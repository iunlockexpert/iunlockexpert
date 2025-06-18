import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Copy, CheckCircle, AlertTriangle } from 'lucide-react';

// Add type declaration for Vite env variables
declare global {
  interface ImportMeta {
    env: {
      VITE_NOWPAYMENTS_API_KEY: string;
    }
  }
}

interface NowPaymentsManualProps {
  total: number;
  discountedTotal: number | null;
  onPaymentComplete: () => void;
  onPaymentFailed: (error: string) => void;
}

export default function NowPaymentsManual({
  total,
  discountedTotal,
  onPaymentComplete,
  onPaymentFailed
}: NowPaymentsManualProps) {
  // NowPayments states
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirming' | 'confirmed' | 'finished' | 'failed'>('pending');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('btc');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [paymentAddress, setPaymentAddress] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'choose_asset' | 'send_deposit'>('choose_asset');
  const [isPolicyAcknowledged, setIsPolicyAcknowledged] = useState(false);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [paymentExpired, setPaymentExpired] = useState(false);

  const paymentMethods = [
    { id: 'btc', name: 'Bitcoin (BTC)' },
    { id: 'eth', name: 'Ethereum (ETH)' },
    { id: 'usdt', name: 'USDT (TRC20)' },
    { id: 'usdterc20', name: 'USDT (ERC20)' },
    { id: 'usdttrc20', name: 'USDT (TRC20)' },
    { id: 'usdc', name: 'USDC' },
    { id: 'ltc', name: 'Litecoin (LTC)' }
  ];

  const checkPaymentStatus = async (paymentId: string) => {
    try {
      const response = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
        method: 'GET',
        headers: {
          'x-api-key': import.meta.env.VITE_NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `API error: ${response.status} ${response.statusText}`);
      }

      // Update payment status based on response
      setPaymentStatus(data.payment_status);

      // Handle different payment statuses
      switch (data.payment_status) {
        case 'finished':
          onPaymentComplete();
          return true;
        case 'failed':
          onPaymentFailed('Payment failed. Please try again.');
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      onPaymentFailed('Failed to verify payment status. Please contact support.');
      return false;
    }
  };

  const handlePayment = async () => {
    if (!isPolicyAcknowledged) {
      setError('Please accept the terms of service first');
      return;
    }

    setIsProcessing(true);
    try {
      // Use discountedTotal if available, otherwise use total
      const totalAmount = discountedTotal !== null ? discountedTotal : total;
      
      // Map the selected payment method to the correct NowPayments currency code
      const getPaymentCurrency = (method: string) => {
        switch (method.toLowerCase()) {
          case 'usdt':
            return 'usdttrc20';
          case 'usdterc20':
            return 'usdterc20';
          case 'usdttrc20':
            return 'usdttrc20';
          case 'usdc':
            return 'usdc';
          case 'eth':
            return 'eth';
          case 'btc':
            return 'btc';
          case 'ltc':
            return 'ltc';
          default:
            return method.toLowerCase();
        }
      };

      const payCurrency = getPaymentCurrency(selectedPaymentMethod);
      
      const response = await fetch('https://api.nowpayments.io/v1/payment', {
        method: 'POST',
        headers: {
          'x-api-key': import.meta.env.VITE_NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price_amount: totalAmount,
          price_currency: 'USD',
          pay_currency: payCurrency,
          order_id: `ORDER-${Date.now()}`,
          order_description: 'Device Unlock Service',
          success_url: `${window.location.origin}/dashboard?section=purchases&status=success`,
          cancel_url: `${window.location.origin}/checkout?status=cancelled`,
          is_fixed_rate: false,
          is_fee_paid_by_user: false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `API error: ${response.status} ${response.statusText}`);
      }

      if (data.payment_id && data.pay_address) {
        setPaymentId(data.payment_id);
        setPaymentAddress(data.pay_address);
        setPaymentAmount(data.pay_amount);
        setPaymentStatus('confirming');
        setCurrentStep('send_deposit');
        setPaymentExpired(false);
        setTimeLeft(20 * 60); // 20 minutes
        setTimerRunning(true);

        // Start polling for payment status
        const checkStatus = async () => {
          const isCompleted = await checkPaymentStatus(data.payment_id);
          if (isCompleted) {
            setTimerRunning(false);
          }
        };

        // Initial check after 30 seconds
        setTimeout(checkStatus, 30000);
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (err) {
      console.error('Payment creation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Effect to manage the timer
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (timerRunning && timeLeft !== null && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(prevTime => (prevTime !== null ? prevTime - 1 : null));
      }, 1000);
    } else if (timerRunning && timeLeft !== null && timeLeft <= 0) {
      setTimerRunning(false);
      setPaymentExpired(true);
      setError('Payment window expired. Please create a new payment.');
      setTimeLeft(null);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timerRunning, timeLeft]);

  // Format time left for display (MM:SS)
  const formatTime = (seconds: number | null) => {
    if (seconds === null || seconds < 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {currentStep === 'choose_asset' ? (
          <motion.div
            key="choose-asset"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <span>{paymentMethods.find(m => m.id === selectedPaymentMethod)?.name || 'Select Payment Method'}</span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
                >
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        setSelectedPaymentMethod(method.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors"
                    >
                      {method.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="policy"
                checked={isPolicyAcknowledged}
                onChange={(e) => setIsPolicyAcknowledged(e.target.checked)}
                className="w-4 h-4 text-amber-500 border-gray-600 rounded focus:ring-amber-500"
              />
              <label htmlFor="policy" className="text-sm text-gray-300">
                I acknowledge that I have read and agree to the terms of service
              </label>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400"
              >
                {error}
              </motion.div>
            )}

            <button
              onClick={handlePayment}
              disabled={isProcessing || !isPolicyAcknowledged}
              className={`w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-gray-900 font-bold shadow-lg transition-all ${
                (isProcessing || !isPolicyAcknowledged) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? 'Processing...' : 'Continue to Payment'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="send-deposit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Payment Details</h3>
                <div className="flex items-center space-x-2 text-amber-500">
                  <Clock className="w-5 h-5" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Send exactly</p>
                  <div className="flex items-center justify-between bg-gray-800/80 border border-gray-700 rounded-lg p-3">
                    <p className="font-mono text-xl text-white">{paymentAmount}</p>
                    <button
                      onClick={() => copyToClipboard(paymentAmount)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">To this address</p>
                  <div className="flex items-center justify-between bg-gray-800/80 border border-gray-700 rounded-lg p-3">
                    <p className="font-mono text-sm text-gray-300 truncate">{paymentAddress}</p>
                    <button
                      onClick={() => copyToClipboard(paymentAddress)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {paymentExpired && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg"
                >
                  <div className="flex items-center text-red-400">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <p>Payment window expired. Please create a new payment.</p>
                  </div>
                </motion.div>
              )}

              <div className="mt-6">
                <button
                  onClick={() => setCurrentStep('choose_asset')}
                  className="w-full py-3 px-6 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
                >
                  Back to Payment Methods
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 