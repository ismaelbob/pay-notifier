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
import NotificationListenerModule from '../../modules/modules/notification-listener/src/NotificationListenerModule';
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
    await insertPayment(db, payment);
    setPayments((current) => [payment, ...current]);
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
    };
    await insertPayment(db, payment);
    setPayments((current) => {
      // Avoid duplicates by id
      if (current.some((p) => p.id === payment.id)) return current;
      return [payment, ...current];
    });
    return payment;
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
  const { addPaymentFromNotification } = usePayments();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = NotificationListenerModule.addListener('onBankNotification', (payload) => {
      const parsed = parseBankNotification(payload);
      if (parsed) {
        addPaymentFromNotification(parsed).catch((e) => console.warn('Error adding notification payment', e));
      }
    });

    return () => subscription?.remove();
  }, [addPaymentFromNotification]);
}
