import { create } from 'zustand';

interface PaymentState {
  paymentId: string | null;
  paymentAddress: string | null;
  paymentAmount: string | null;
  selectedCurrency: string;
  timeLeft: number | null;
  isProcessing: boolean;
  error: string | null;
  setPaymentDetails: (details: {
    paymentId: string;
    paymentAddress: string;
    paymentAmount: string;
    selectedCurrency: string;
  }) => void;
  setTimeLeft: (time: number | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  paymentId: null,
  paymentAddress: null,
  paymentAmount: null,
  selectedCurrency: 'btc',
  timeLeft: null,
  isProcessing: false,
  error: null,
  setPaymentDetails: (details) => set(details),
  setTimeLeft: (time) => set({ timeLeft: time }),
  setError: (error) => set({ error }),
  reset: () => set({
    paymentId: null,
    paymentAddress: null,
    paymentAmount: null,
    timeLeft: null,
    isProcessing: false,
    error: null
  })
})); 