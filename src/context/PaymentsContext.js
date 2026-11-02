import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';

import { buildRandomPayment } from '../data/payments';
import { insertPayment, listPayments } from '../db/paymentsRepository';
import NotificationListenerModule from '../../modules/notification-listener';
import { parseBankNotification } from '../utils/notificationParser';

const PaymentsContext = createContext({
  payments: [],
  isLoading: true,
  error: null,
  reload: async () => {},
  addRandomPayment: async () => {},
  addPaymentFromNotification: async () => {},
});

export function PaymentsProvider({ children }) {
  const db = useSQLiteContext();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const stored = await listPayments(db);
      setPayments(stored);
      setError(null);
    } catch (cause) {
      console.warn('No se pudieron cargar los cobros', cause);
      setError('No se pudieron cargar los cobros guardados.');
    }
  }, [db]);

  useEffect(() => {
    let active = true;

    listPayments(db)
      .then((stored) => {
        if (!active) return;
        setPayments(stored);
        setError(null);
      })
      .catch((cause) => {
        console.warn('No se pudieron cargar los cobros', cause);
        if (active) setError('No se pudieron cargar los cobros guardados.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [db]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    await load();
    setIsLoading(false);
  }, [load]);

  const addRandomPayment = useCallback(async () => {
    const payment = buildRandomPayment();
    const { inserted } = await insertPayment(db, payment);
    if (inserted) {
      setPayments((current) => [payment, ...current]);
    }
    return payment;
  }, [db]);

  const addPaymentFromNotification = useCallback(async (parsed) => {
    const payment = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: parsed.sender,
      bank: parsed.bank,
      amount: parsed.amount,
      receivedAt: parsed.receivedAt,
      reference: parsed.reference || null,
      sourceKey: parsed.sourceKey || null,
    };

    const { inserted } = await insertPayment(db, payment);

    // `source_key` es único: si la notificación ya estaba guardada, la
    // inserción se ignora y no se vuelve a mostrar.
    if (inserted) {
      setPayments((current) => {
        if (current.some((p) => p.id === payment.id)) return current;
        return [payment, ...current];
      });
    }

    return { payment, inserted };
  }, [db]);

  const value = useMemo(
    () => ({ payments, isLoading, error, reload, addRandomPayment, addPaymentFromNotification }),
    [payments, isLoading, error, reload, addRandomPayment, addPaymentFromNotification]
  );

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
}

export function usePayments() {
  return useContext(PaymentsContext);
}

// Hook to listen for bank notifications and auto-add payments

export function useBankNotificationListener() {
  const { addPaymentFromNotification, isLoading } = usePayments();

  const handlePayload = useCallback(
    async (payload) => {
      const pendingId = payload?.pendingId;

      try {
        const parsed = parseBankNotification(payload);

        // `null` significa que la notificación no es un cobro: se confirma
        // igual para no reintentarla en cada arranque.
        if (parsed) {
          await addPaymentFromNotification(parsed);
        }

        if (pendingId) {
          NotificationListenerModule.removePendingNotifications([pendingId]);
        }
      } catch (cause) {
        // Sin confirmar: la notificación sigue pendiente y se reintenta luego.
        console.warn('No se pudo procesar la notificación del banco', cause);
      }
    },
    [addPaymentFromNotification]
  );

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    // Espera a que la lista inicial esté cargada para no pisar el estado.
    if (isLoading) return undefined;
    if (typeof NotificationListenerModule.addListener !== 'function') return undefined;

    let active = true;

    const subscription = NotificationListenerModule.addListener('onBankNotification', (payload) => {
      handlePayload(payload);
    });

    // Recupera lo capturado mientras la app estaba cerrada o en segundo plano.
    // Se hace después de adjuntar el listener para no perder eventos que lleguen
    // durante la lectura; el `source_key` evita insertarlos dos veces.
    (async () => {
      try {
        const pending = NotificationListenerModule.getPendingNotifications();

        for (const payload of pending) {
          if (!active) return;
          await handlePayload(payload);
        }
      } catch (cause) {
        console.warn('No se pudieron leer las notificaciones pendientes', cause);
      }
    })();

    return () => {
      active = false;
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, [handlePayload, isLoading]);
}
