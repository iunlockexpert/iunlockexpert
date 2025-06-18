import React, { useState, useEffect } from 'react';
import { Bitcoin, Coins, DollarSign, Copy, Check, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode.react';
import { usePayment } from '../hooks/usePayment';

interface ManualPaymentFlowProps {
  totalAmount: number;
  onCancel: () => void;
  onPaymentComplete: () => void;
}

const ManualPaymentFlow: React.FC<ManualPaymentFlowProps> = ({
  totalAmount,
  onCancel,
  onPaymentComplete
}) => {
  const [currentStep, setCurrentStep] = useState<'choose_asset' | 'send_deposit'>('choose_asset');
  const [selectedAsset, setSelectedAsset] = useState<string>('btc');
  const [isPolicyAccepted, setIsPolicyAccepted] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    paymentAddress,
    paymentAmount,
    timeLeft,
    startPayment,
    checkPayment,
    reset,
    error
  } = usePayment();

  const assets = [
    { id: 'btc', name: 'Bitcoin', icon: Bitcoin },
    { id: 'eth', name: 'Ethereum', icon: Coins },
    { id: 'usdt', name: 'USDT', icon: DollarSign },
    { id: 'usdc', name: 'USDC', icon: DollarSign }
  ];

  // Poll for payment status
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (currentStep === 'send_deposit' && timeLeft !== null && timeLeft > 0) {
      intervalId = setInterval(async () => {
        const isCompleted = await checkPayment();
        if (isCompleted) {
          onPaymentComplete();
        }
      }, 10000); // Check every 10 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentStep, timeLeft, checkPayment, onPaymentComplete]);

  const handleGenerateAddress = async () => {
    if (!isPolicyAccepted) {
      return;
    }

    const success = await startPayment(totalAmount, selectedAsset);
    if (success) {
      setCurrentStep('send_deposit');
    }
  };

  const handleCopy = async () => {
    if (paymentAddress) {
      await navigator.clipboard.writeText(paymentAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'choose_asset' ? 'bg-[#8a4fff]' : 'bg-[#8a4fff]/20'
          }`}>
            1
          </div>
          <span className="ml-2 text-sm">Choose asset</span>
        </div>
        <div className="flex-1 mx-4 border-t border-[#8a4fff]/20 my-auto"></div>
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'send_deposit' ? 'bg-[#8a4fff]' : 'bg-[#8a4fff]/20'
          }`}>
            2
          </div>
          <span className="ml-2 text-sm">Send deposit</span>
        </div>
      </div>

      {currentStep === 'choose_asset' ? (
        // Step 1: Choose Asset
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Choose asset</h2>
          
          {/* Asset Selection */}
          <div className="grid grid-cols-2 gap-4">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id)}
                className={`p-4 rounded-xl border ${
                  selectedAsset === asset.id
                    ? 'border-[#8a4fff] bg-[#8a4fff]/10'
                    : 'border-[#8a4fff]/20 hover:border-[#8a4fff]/40'
                } transition-all`}
              >
                <div className="flex items-center space-x-3">
                  <asset.icon className="w-6 h-6 text-[#8a4fff]" />
                  <span className="text-white">{asset.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Amount Display */}
          <div className="bg-[#210746] rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Amount to pay</div>
            <div className="text-2xl font-semibold text-white">
              {totalAmount.toFixed(2)} USD
            </div>
          </div>

          {/* Terms of Service */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms"
              checked={isPolicyAccepted}
              onChange={(e) => setIsPolicyAccepted(e.target.checked)}
              className="rounded border-[#8a4fff]/20"
            />
            <label htmlFor="terms" className="text-sm text-gray-400">
              I've read and accept the Terms of Service
            </label>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleGenerateAddress}
              disabled={!isPolicyAccepted}
              className={`flex-1 py-3 rounded-xl font-medium ${
                isPolicyAccepted
                  ? 'bg-[#8a4fff] text-white hover:bg-[#7a3ddf]'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              Generate Deposit Address
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-3 rounded-xl font-medium border border-[#8a4fff]/20 text-white hover:bg-[#8a4fff]/10"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // Step 2: Send Deposit
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-white">Send deposit</h2>
            <div className="text-[#8a4fff] font-mono">
              {formatTime(timeLeft || 0)}
            </div>
          </div>

          {/* Amount Information */}
          <div className="bg-[#210746] rounded-xl p-4 space-y-3">
            <div>
              <div className="text-sm text-gray-400">USD Value</div>
              <div className="text-xl font-semibold text-white">
                ${totalAmount.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Crypto Amount</div>
              <div className="text-xl font-semibold text-white">
                {paymentAmount} {selectedAsset.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-400 mb-2">Address</div>
              <div className="relative">
                <div className="bg-[#210746] rounded-xl p-4 text-white font-mono break-all pr-12">
                  {paymentAddress}
                </div>
                <button
                  onClick={handleCopy}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a4fff] hover:text-[#7a3ddf]"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-2">Network</div>
              <div className="bg-[#210746] rounded-xl p-4 text-white">
                {selectedAsset.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start space-x-2 text-yellow-400 text-sm">
            <AlertCircle size={16} className="mt-0.5" />
            <p>Please send the exact amount. Sending a different amount may result in payment failure.</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-xl">
              <QRCode
                value={`${selectedAsset}:${paymentAddress}?amount=${paymentAmount}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => setCurrentStep('choose_asset')}
            className="w-full py-3 rounded-xl font-medium border border-[#8a4fff]/20 text-white hover:bg-[#8a4fff]/10"
          >
            Back to Asset Selection
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function to format time
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export default ManualPaymentFlow; 