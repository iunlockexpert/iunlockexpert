import { usePaymentStore } from '../store/paymentStore';
import { PaymentService } from '../services/PaymentService';

export const usePayment = () => {
  const {
    paymentId,
    paymentAddress,
    paymentAmount,
    selectedCurrency,
    timeLeft,
    isProcessing,
    error,
    setPaymentDetails,
    setTimeLeft,
    setError,
    reset
  } = usePaymentStore();

  const startPayment = async (amount: number, currency: string) => {
    try {
      const payment = await PaymentService.createPayment(amount, currency);
      
      setPaymentDetails({
        paymentId: payment.payment_id,
        paymentAddress: payment.pay_address,
        paymentAmount: payment.pay_amount,
        selectedCurrency: currency
      });
      
      setTimeLeft(20 * 60); // 20 minutes
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment creation failed');
      return false;
    }
  };

  const checkPayment = async () => {
    if (!paymentId) return false;

    try {
      const status = await PaymentService.checkPaymentStatus(paymentId);
      
      switch (status.payment_status) {
        case 'finished':
          reset();
          return true;
        case 'failed':
          setError('Payment failed');
          return false;
        default:
          return false;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment check failed');
      return false;
    }
  };

  return {
    paymentId,
    paymentAddress,
    paymentAmount,
    selectedCurrency,
    timeLeft,
    isProcessing,
    error,
    startPayment,
    checkPayment,
    reset
  };
}; 