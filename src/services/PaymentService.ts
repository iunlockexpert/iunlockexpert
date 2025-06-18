export class PaymentService {
  private static readonly API_KEY = import.meta.env.VITE_NOWPAYMENTS_API_KEY;
  private static readonly API_URL = 'https://api.nowpayments.io/v1';

  static async createPayment(amount: number, currency: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_URL}/payment`, {
        method: 'POST',
        headers: {
          'x-api-key': this.API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: 'USD',
          pay_currency: currency,
          order_id: `ORDER-${Date.now()}`,
          is_fixed_rate: true,
          is_fee_paid_by_user: false
        })
      });

      if (!response.ok) {
        throw new Error('Payment creation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment creation error:', error);
      throw error;
    }
  }

  static async checkPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_URL}/payment/${paymentId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Payment status check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment status check error:', error);
      throw error;
    }
  }
} 