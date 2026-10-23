import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { SEED_PAYMENTS, buildRandomPayment } from '../data/payments';

const PaymentsContext = createContext({
  payments: [],
  addRandomPayment: () => {},
});

export function PaymentsProvider({ children }) {
  const [payments, setPayments] = useState(SEED_PAYMENTS);

  const addRandomPayment = useCallback(() => {
    const payment = buildRandomPayment();
    setPayments((current) => [payment, ...current]);
    return payment;
  }, []);

  const value = useMemo(
    () => ({ payments, addRandomPayment }),
    [payments, addRandomPayment]
  );

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
}

export function usePayments() {
  return useContext(PaymentsContext);
}
