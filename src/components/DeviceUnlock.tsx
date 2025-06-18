import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronRight, Shield, Check, Clock, 
  AlertCircle, Zap, Lock, Timer, 
  GlobeLock, Cloud, ShieldOff, Home, ArrowLeft, X, 
  CheckCircle,
  Wallet,
  CreditCard,
  Info,
  Copy,
  MessageCircle,
  Download,
  Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateReceipt } from '../utils/generateReceipt';
import { createAppKit, useAppKit, useAppKitAccount, useAppKitProvider, useAppKitNetworkCore } from '@reown/appkit/react'
import { networks, projectId, metadata, ethersAdapter } from './config';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { bsc, mainnet } from 'viem/chains';
import WhatsAppButton from './WhatsAppButton';
import { BrowserProvider, JsonRpcSigner, parseEther, formatEther } from 'ethers';
import type { Provider } from '@reown/appkit/react';
import { AppKit } from '@reown/appkit';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import NowPaymentsManual from './NowPaymentsManual';
import ManualPaymentFlow from './ManualPaymentFlow';
import CryptoAssetDropdown from './CryptoAssetDropdown';
import { QRCodeSVG } from 'qrcode.react';

createAppKit({
  adapters: [ethersAdapter],
  networks,
  metadata,
  projectId,
  themeMode: 'light',
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  }
})

const carriers = [
  "AT&T", "T-Mobile", "Verizon", "Sprint", 
  "O2", "Vodafone", "EE", "Orange",
  "Three", "Rogers", "Bell", "Telus", 
  "MX Iusacell", "Other"
];

interface UnlockService {
  id: string;
  name: string;
  icon: React.ElementType;
  originalPrice: number;
  discountedPrice: number;
  averageTime: string;
  deliveryTime: string;
  successRate: string;
  description: string;
  detailedDescription: string;
  features: string[];
  type: string;
}

const services: UnlockService[] = [
  {
    id: "mdm",
    name: "MDM Bypass",
    icon: ShieldOff,
    originalPrice: 59.99,
    discountedPrice: 39.99,
    averageTime: "24 hours",
    deliveryTime: "24 hours guaranteed",
    successRate: "99.9%",
    description: "Remove Mobile Device Management restrictions",
    detailedDescription: "Mobile Device Management (MDM) can limit your device's functionality. Our MDM bypass service completely removes these restrictions, giving you full control over your Apple device. This process is safe, permanent, and does not require jailbreaking.",
    features: [
      "Permanent MDM removal",
      "Works for all iOS devices",
      "No jailbreak required",
      "Quick 24-hour processing"
    ],
    type: "mdm-bypass"
  },
  {
    id: "icloud",
    name: "iCloud Unlock",
    icon: Cloud,
    originalPrice: 69.99,
    discountedPrice: 49.99,
    averageTime: "24-48 hours",
    deliveryTime: "24 hours guaranteed",
    successRate: "99.9%",
    description: "Unlock iCloud-locked Apple devices",
    detailedDescription: "Stuck with an iCloud-locked device? Our professional iCloud unlock service helps you regain full access to your Apple device. We use official methods to remove iCloud activation locks, ensuring your device's integrity and functionality.",
    features: [
      "Official iCloud unlock method",
      "Supports all iPhone models",
      "Worldwide service",
      "100% success guarantee"
    ],
    type: "icloud-unlock"
  },
  {
    id: "sim",
    name: "SIM Unlock",
    icon: GlobeLock,
    originalPrice: 49.95,
    discountedPrice: 29.99,
    averageTime: "3-5 days",
    deliveryTime: "24 hours guaranteed",
    successRate: "99.9%",
    description: "Carrier unlock for mobile devices",
    detailedDescription: "Free your device from carrier restrictions. Our SIM unlock service allows you to use your phone with any carrier worldwide. We provide a permanent unlock that works across international networks.",
    features: [
      "Permanent carrier unlock",
      "Compatible with all carriers",
      "Global network support",
      "Fast and secure process"
    ],
    type: "sim-unlock"
  }
];

const cryptoPayments = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    discount: 10,
    address: "bc1q0htz6vz6pzvxhqmlmpr09aw37rqppfx3pawtp8"
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    discount: 8,
    address: "0x4FB2473a5145fFbDf59Dc4BC16f8Fc1F6aB57042"
  },
  {
    name: "USDT TRC-20",
    symbol: "USDT",
    discount: 5,
    address: "TUyskte8JUL2AuHU4DYE1GjfPoX74dnUfH"
  }
];

// Add this CSS at the top of the file, after the imports
const loadingSpinnerStyle = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 10px;
  vertical-align: middle;
}
`;

// Add the style tag to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = loadingSpinnerStyle;
document.head.appendChild(styleSheet);

// Add receipt type
interface TransactionReceipt {
  status: number;
  hash: string;
  blockNumber: number;
  confirmations: number;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
}

const CryptoIcon = ({ symbol, className }: { symbol: string; className?: string }) => {
  const iconMap: { [key: string]: string } = {
    btc: "https://icones.pro/wp-content/uploads/2024/03/icone-bitcoin-official.png",
    eth: "https://icones.pro/wp-content/uploads/2024/03/blue-ethereum-icon-logo-symbol-original-official.png",
    usdttrc20: "https://totalcoin.io/uploads/coins/big/usdt.png",
    usdterc20: "https://totalcoin.io/uploads/coins/big/usdt.png",
    usdc: "https://icones.pro/wp-content/uploads/2024/04/blue-usdc-icon-symbol-logo.png",
    ltc: "https://upload.wikimedia.org/wikipedia/commons/f/f8/LTC-400.png",
    sol: "https://icones.pro/wp-content/uploads/2024/04/icone-officielle-de-solana-logo-du-symbole-png-1536x1536.png"
  };

  // Map the symbol to the correct key
  const getIconKey = (symbol: string) => {
    const lowerSymbol = symbol.toLowerCase();
    if (lowerSymbol === 'usdt') return 'usdttrc20'; // Default to TRC20 for USDT
    if (lowerSymbol === 'usdterc20') return 'usdterc20';
    if (lowerSymbol === 'usdttrc20') return 'usdttrc20';
    return lowerSymbol;
  };

  const iconKey = getIconKey(symbol);
  const iconUrl = iconMap[iconKey];

  return (
    <img 
      src={iconUrl} 
      alt={`${symbol} icon`}
      className={className}
    />
  );
};

// Add this helper at the top (after imports or near CryptoIcon):
const getAssetDisplay = (id: string) => {
  switch (id) {
    case 'btc':
      return { symbol: 'BTC' };
    case 'eth':
      return { symbol: 'ETH' };
    case 'usdttrc20':
      return { symbol: 'USDT' };
    case 'usdterc20':
      return { symbol: 'USDT' };
    case 'usdc':
      return { symbol: 'USDC' };
    case 'ltc':
      return { symbol: 'LTC' };
    case 'sol':
      return { symbol: 'SOL' };
    default:
      return { symbol: id.toUpperCase() };
  }
};

export default function DeviceUnlock() {
  const [isWalletModalOpen, setWalletModalOpen] = useState(false);

  const openWalletModal = () => setWalletModalOpen(true);
  const closeWalletModal = () => setWalletModalOpen(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { model } = useParams();
  const [step, setStep] = useState(1);
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [selectedService, setSelectedService] = useState<UnlockService | null>(null);
  const [imei, setImei] = useState("");
  const [email, setEmail] = useState("");
  const [includeBlacklistCheck, setIncludeBlacklistCheck] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [imeiError, setImeiError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [gasPrice, setGasPrice] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [maxFeePerGas, setMaxFeePerGas] = useState<bigint | null>(null);
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState<bigint | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasInsufficientFunds, setHasInsufficientFunds] = useState(false);
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const [showPaymentGuidance, setShowPaymentGuidance] = useState(false);
  const [showTransactionCancelled, setShowTransactionCancelled] = useState(false);
  const [showWalletConnected, setShowWalletConnected] = useState(false);
  const [isWalletPaymentModalOpen, setIsWalletPaymentModalOpen] = useState(false);
  const [selectedCryptoMethod, setSelectedCryptoMethod] = useState<string | null>(null);
  const [requiredAmount, setRequiredAmount] = useState<string>('0');
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [showPendingConfirmation, setShowPendingConfirmation] = useState(false);
  const [showPaymentError, setShowPaymentError] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('btc');
  const [isPolicyAcknowledged, setIsPolicyAcknowledged] = useState(false);
  const [paymentAddress, setPaymentAddress] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [currentStep, setCurrentStep] = useState('');
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationState, setNotificationState] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [amountCopied, setAmountCopied] = useState(false);
  const [selectedPaymentTab, setSelectedPaymentTab] = useState<'manual' | 'wallet'>('manual');

  // AppKit hooks
  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>('eip155');
  const { chainId } = useAppKitNetworkCore();

  // Update wallet connection state when isConnected changes
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [hasShownConnectionMessage, setHasShownConnectionMessage] = useState(false);

  useEffect(() => {
    const wasConnected = isWalletConnected;
    setIsWalletConnected(isConnected);
    
    // Only show the connection message when the wallet first connects
    if (isConnected && !wasConnected) {
      const hasShownMessage = localStorage.getItem('walletConnectedMessageShown');
      if (!hasShownMessage) {
        setShowWalletConnected(true);
        localStorage.setItem('walletConnectedMessageShown', 'true');
        // Hide the notification after 5 seconds
        const timer = setTimeout(() => {
          setShowWalletConnected(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [isConnected]);

  // Reset the localStorage flag when the modal is closed
  useEffect(() => {
    if (!isWalletPaymentModalOpen) {
      localStorage.removeItem('walletConnectedMessageShown');
    }
  }, [isWalletPaymentModalOpen]);

  // Validation methods
  const validateIMEI = (imei: string) => {
    if (!/^\d{15}$/.test(imei)) {
      return "IMEI must be exactly 15 digits";
    }
    
    let sum = 0;
    let isEven = false;
    
    for (let i = imei.length - 1; i >= 0; i--) {
      let digit = parseInt(imei[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    if (sum % 10 !== 0) {
      return "Invalid IMEI number";
    }
    
    return "";
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleWalletPayment = async () => {
    if (!isConnected || !walletProvider || !address) {
      setPaymentError('Please connect your wallet first');
      return;
    }

    // Prevent multiple requests
    if (isRequestPending || showTransactionCancelled) {
      return;
    }

    setIsRequestPending(true);
    setIsProcessingPayment(true);
    setPaymentError(null);
    setPaymentSuccess(false);
    setTransactionHash(null);

    try {
      // Create provider and signer
      const provider = new BrowserProvider(walletProvider, chainId);
      const signer = new JsonRpcSigner(provider, address);

      // Check if the wallet is a smart contract
      const bytecode = await provider.getCode(address);
      const isSmartContract = bytecode !== "0x";
      console.log('Smart Contract Wallet Check:', {
        address,
        isSmartContract,
        bytecode: bytecode === "0x" ? "EOA (Externally Owned Account)" : "Smart Contract"
      });

      // Calculate amount in ETH with proper decimal handling
      const euroAmount = (selectedService?.discountedPrice || 0) + (includeBlacklistCheck ? 2.95 : 0);
      const amountInEth = Number((euroAmount / 3000).toFixed(8)); // Updated conversion rate
      
      if (isNaN(amountInEth) || amountInEth <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);

      // Create transaction parameters
      const transaction = {
        from: address,
        to: "0x9394CD307B4c1C37a0F4713CbD222238c077209a",
        value: parseEther(amountInEth.toString()),
        gasPrice: gasPrice,
        data: "0x6465706f736974", // "deposit" in hex
        type: 0 // Legacy transaction type
      };

      // Estimate gas
      const gasEstimate = await provider.estimateGas(transaction);
      const gasLimit = gasEstimate;

      // Check if balance is sufficient
      const balance = await provider.getBalance(address);
      const totalRequired = transaction.value + (transaction.gasPrice * gasLimit);
      setRequiredAmount(formatEther(totalRequired));
      
      if (balance < totalRequired) {
        setHasInsufficientFunds(true);
        setShowInsufficientFunds(true);
        throw new Error('Insufficient funds');
      }

      // Show both notifications simultaneously
      setShowPaymentGuidance(true);

      if (isSmartContract) {
        toast(
          <div className="flex items-center">
            <div className="loading-spinner" />
            <span>After smart contract confirmation, please wait a few moments for the transaction to complete on the blockchain.</span>
          </div>,
          {
            duration: 5000,
            position: 'top-center',
            style: {
              background: '#4A90E2',
              color: '#fff',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '14px',
              maxWidth: '500px',
              marginTop: '60px' // Increased margin to position below first notification
            }
          }
        );
      }
      
      // Send transaction
      console.log('Sending Transaction:', {
        from: transaction.from,
        to: transaction.to,
        value: formatEther(transaction.value),
        gasPrice: formatEther(transaction.gasPrice),
        gasLimit: gasLimit.toString(),
        data: transaction.data,
        type: transaction.type
      });

      const tx = await signer.sendTransaction({
        ...transaction,
        gasLimit: gasLimit
      });
      
      console.log('Transaction Sent:', {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: formatEther(tx.value || BigInt(0)),
        data: tx.data
      });
      
      if (tx?.hash) {
        setTransactionHash(tx.hash);
        
        try {
          // Show pending confirmation notification
          setShowPendingConfirmation(true);
          console.log('Transaction Pending:', {
            hash: tx.hash,
            status: 'pending',
            message: 'Waiting for blockchain confirmation...'
          });

          // Wait for transaction to be mined with a timeout
          const receipt = await Promise.race([
            tx.wait(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Transaction timeout')), 300000) // 5 minutes timeout
            )
          ]) as TransactionReceipt;
          
          console.log('Transaction Receipt:', {
            hash: receipt.hash,
            status: receipt.status === 1 ? 'success' : 'failed',
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            effectiveGasPrice: formatEther(receipt.effectiveGasPrice || BigInt(0))
          });
          
          if (receipt.status === 1) {
            console.log('Transaction Confirmed:', {
              hash: receipt.hash,
              status: 'success',
              blockNumber: receipt.blockNumber,
              confirmations: receipt.confirmations,
              message: 'Transaction successfully confirmed on the blockchain'
            });
            
            // Set success states
            setPaymentSuccess(true);
            setShowPendingConfirmation(false);
            triggerConfetti();
            
            // Generate receipt
            const receiptData = {
              orderId: `ORDER-${Date.now()}`,
              service: selectedService?.name || '',
              device: model || '',
              amount: amountInEth,
              originalPrice: selectedService?.originalPrice || 0,
              discount: selectedService?.originalPrice ? selectedService.originalPrice - selectedService.discountedPrice : 0,
              finalPrice: selectedService?.discountedPrice || 0,
              paymentMethod: isSmartContract ? 'Smart Contract Wallet' : 'WalletConnect',
              transactionHash: receipt.hash,
              date: new Date().toISOString(),
              imei: imei,
              email: email
            };
            
            await generateReceipt(receiptData);
            
            // Close modal and show success step
            setIsWalletPaymentModalOpen(false);
            
            // Force a small delay to ensure state updates are processed
            setTimeout(() => {
              console.log('Transitioning to Success Page:', {
                step: 6,
                orderId: receiptData.orderId,
                transactionHash: receiptData.transactionHash
              });
              setStep(6);
            }, 500);
            
            return;
          } else {
            console.error('Transaction Failed:', {
              hash: receipt.hash,
              status: 'failed',
              blockNumber: receipt.blockNumber,
              message: 'Transaction reverted by the blockchain'
            });
            throw new Error('Transaction failed');
          }
        } catch (waitError: any) {
          console.error('Transaction Error:', {
            error: waitError.message,
            code: waitError.code,
            data: waitError.data,
            transaction: tx.hash
          });
          setShowPendingConfirmation(false);
          if (waitError.message === 'Transaction timeout') {
            setPaymentError('Transaction is taking longer than expected. Please check your wallet for the transaction status.');
          } else {
            setPaymentError('Error confirming transaction. Please check your wallet for the transaction status.');
          }
        }
      }
    } catch (error: any) {
      console.error('Payment Error:', {
        error: error.message,
        code: error.code,
        data: error.data,
        message: error.error?.message || error.message || 'Transaction failed'
      });
      
      if (error.code === 'INSUFFICIENT_FUNDS' || error.message === 'Insufficient funds') {
        setHasInsufficientFunds(true);
        setShowInsufficientFunds(true);
        setPaymentError(
          `Insufficient funds in your wallet. Please ensure you have enough ETH to cover the payment amount plus gas fees.`
        );
      } else if (error.code === 'USER_REJECTED' || error.message?.includes('User canceled') || error.message?.includes('User denied')) {
        setPaymentError('Transaction was canceled by user. Please try again if you want to proceed with the payment.');
        setShowPaymentGuidance(false);
        setShowTransactionCancelled(true);
      } else if (error.code === 'NETWORK_ERROR') {
        setPaymentError('Network error occurred. Please check your internet connection and try again.');
      } else if (error.code === 'NUMERIC_FAULT') {
        setPaymentError('There was an issue with the payment amount. Please try again or contact support.');
      } else if (error.message?.includes('gas')) {
        setPaymentError('Transaction failed due to gas issues. Please try again in a few minutes or contact support.');
      } else {
        const errorMessage = error.error?.message || error.message || 'Transaction failed';
        const readableError = errorMessage
          .replace(/failed with \d+ gas: /, '')
          .replace(/address 0x[a-fA-F0-9]{40}/, 'your wallet')
          .replace(/have \d+ want \d+/, 'have insufficient funds')
          .replace(/too many decimals for format.*/, 'Invalid payment amount. Please try again.');
        
        setPaymentError(`Payment failed: ${readableError}`);
      }
    } finally {
      setIsProcessingPayment(false);
      setIsRequestPending(false);
    }
  };

  // Reset states when modal is closed
  useEffect(() => {
    if (!isWalletPaymentModalOpen) {
      setIsRequestPending(false);
      setShowTransactionCancelled(false);
      setShowPaymentGuidance(false);
    }
  }, [isWalletPaymentModalOpen]);

  // Notification component with manual gas options
  const Notification = ({ message, type, onClose }: { message: string; type: 'error' | 'success' | 'info'; onClose: () => void }) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
      // Only start the progress timer for success and error notifications
      if (type !== 'info') {
        const duration = 5000; // 5 seconds
        const interval = 50; // Update every 50ms
        const steps = duration / interval;
        const decrement = 100 / steps;

        const timer = setInterval(() => {
          setProgress((prev) => {
            if (prev <= 0) {
              clearInterval(timer);
              onClose();
              return 0;
            }
            return prev - decrement;
          });
        }, interval);

        return () => clearInterval(timer);
      }
    }, [onClose, type]);

    const handleOpenWallet = () => {
      // Try to open the wallet app
      if (window.ethereum) {
        (window.ethereum as { request: (args: { method: string }) => Promise<string[]> })
          .request({ method: 'eth_requestAccounts' });
      }
      // If using WalletConnect, try to open the mobile app
      if (walletProvider) {
        (walletProvider as any).wcProvider?.openWallet();
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed left-0 right-0 mx-auto z-[60] p-4 rounded-lg shadow-lg w-[calc(100%-2rem)] max-w-md relative overflow-hidden ${
          type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}
        style={{ top: '20px' }}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {type === 'error' ? (
                <AlertCircle className="w-5 h-5 mr-2 text-red-500 flex-shrink-0" />
              ) : type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
              ) : (
                <Info className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0" />
              )}
              <p className="text-sm font-medium break-words">{message}</p>
            </div>
            {type === 'info' && (
              <button
                onClick={handleOpenWallet}
                className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
              >
                <Wallet className="w-4 h-4" />
                <span>Open Wallet</span>
              </button>
            )}
          </div>
          {type !== 'info' && (
            <div className="absolute bottom-0 left-0 right-0 h-1">
              <motion.div
                className={`h-full rounded-b-lg ${
                  type === 'error' 
                    ? 'bg-red-500' 
                    : 'bg-green-500'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const WalletPaymentModal = () => {
    const [walletBalance, setWalletBalance] = useState<string>('0');
    const [estimatedGasFee, setEstimatedGasFee] = useState<string>('0');
    const [hasInsufficientFunds, setHasInsufficientFunds] = useState(false);
    const [requiredAmount, setRequiredAmount] = useState<string>('0');
    const [paymentAmount, setPaymentAmount] = useState<string>('0');
    const [showWalletConnected, setShowWalletConnected] = useState(false);
    const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
    const [showPaymentGuidance, setShowPaymentGuidance] = useState(false);
    const [lastGasPriceFetch, setLastGasPriceFetch] = useState<number>(0);
    const [cachedGasPrice, setCachedGasPrice] = useState<any>(null);

    const fetchGasPrice = async () => {
      const now = Date.now();
      if (now - lastGasPriceFetch < 30000 && cachedGasPrice) {
        return cachedGasPrice;
      }

      try {
        const gasData = {
          result: {
            SafeGasPrice: "0.00000003",
            ProposeGasPrice: "0.00000004",
            FastGasPrice: "0.00000005"
          }
        };
        
        setLastGasPriceFetch(now);
        setCachedGasPrice(gasData);
        return gasData;
      } catch (error) {
        console.error('Error setting gas prices:', error);
        return null;
      }
    };

    // Only check balance when explicitly requested
    const checkBalance = async () => {
      if (isConnected && walletProvider && address) {
        try {
          const provider = new BrowserProvider(walletProvider, chainId);
          const balance = await provider.getBalance(address);
          setWalletBalance(formatEther(balance));
          
          const euroAmount = (selectedService?.discountedPrice || 0) + (includeBlacklistCheck ? 2.95 : 0);
          const amountInEth = Number((euroAmount / 3000).toFixed(8)); // Updated conversion rate
          const paymentAmountEth = parseEther(amountInEth.toString());
          setPaymentAmount(formatEther(paymentAmountEth));
          
          const gasData = await fetchGasPrice();
          
          if (gasData?.result) {
            const baseGasPriceGwei = parseFloat(gasData.result.SafeGasPrice);
            const baseGasPriceWei = BigInt(Math.floor(baseGasPriceGwei * 1e9));
            
            const gasLimit = BigInt(21000);
            const gasFee = baseGasPriceWei * gasLimit;
            setEstimatedGasFee(formatEther(gasFee));
            
            const gasBuffer = parseEther('0.0005');
            const totalRequired = paymentAmountEth + gasFee + gasBuffer;
            setRequiredAmount(formatEther(totalRequired));
            
            const hasEnoughFunds = balance >= totalRequired;
            setHasInsufficientFunds(!hasEnoughFunds);
          }
        } catch (error) {
          console.error('Error in checkBalance:', error);
        }
      }
    };

    // Only update wallet connected state
    useEffect(() => {
      if (isConnected && !showWalletConnected) {
        setShowWalletConnected(true);
      }
    }, [isConnected]);

    return (
      <AnimatePresence>
        {isWalletPaymentModalOpen && (
          <>
            {/* Notifications */}
            <div className="fixed top-0 left-0 right-0 z-[60] flex flex-col gap-2 p-4">
              <AnimatePresence>
                {showPaymentGuidance && (
                  <Notification 
                    message="Please open your wallet app to confirm the transaction. Make sure to review the details before confirming."
                    type="info"
                    onClose={() => setShowPaymentGuidance(false)}
                  />
                )}
                {showInsufficientFunds && (
                  <Notification 
                    message={`Insufficient funds. You need at least ${(((selectedService?.discountedPrice || 0) + (includeBlacklistCheck ? 2.95 : 0)) / 3000).toFixed(5)} ETH (€${((selectedService?.discountedPrice || 0) + (includeBlacklistCheck ? 2.95 : 0)).toFixed(2)}) to complete this transaction. Please add more ETH to your wallet or try with a different payment method.`}
                    type="error"
                    onClose={() => setShowInsufficientFunds(false)}
                  />
                )}
                {showTransactionCancelled && (
                  <Notification 
                    message="Transaction was canceled. Please try again if you want to proceed with the payment."
                    type="error"
                    onClose={() => setShowTransactionCancelled(false)}
                  />
                )}
                {showPendingConfirmation && (
                  <Notification 
                    message={`Transaction is pending confirmation. Hash: ${transactionHash?.slice(0, 6)}...${transactionHash?.slice(-4)}`}
                    type="info" 
                    onClose={() => setShowPendingConfirmation(false)}
                  />
                )}
              </AnimatePresence>
            </div>
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 0.98, opacity: 1 }}
                exit={{ scale: 0.1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="bg-blue-600 text-white p-6 rounded-t-xl">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">WalletConnect Payment</h2>
                    <button 
                      onClick={() => setIsWalletPaymentModalOpen(false)}
                      className="text-white hover:text-blue-100"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <p className="text-sm text-blue-100 mt-2">
                    Complete your payment for {selectedService?.name}
                  </p>
                  <div className="mt-2 text-2xl font-bold">
                    €{(
                      (selectedService?.discountedPrice || 0) + 
                      (includeBlacklistCheck ? 2.95 : 0)
                    ).toFixed(2)}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="p-6 border-b">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Device</p>
                      <p className="font-semibold">{model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">IMEI</p>
                      <p className="font-semibold">{imei}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Service</p>
                      <p className="font-semibold">{selectedService?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Unlock Time</p>
                      <p className="font-semibold">{selectedService?.deliveryTime}</p>
                    </div>
                  </div>
                </div>

                {/* Crypto Method Selection */}
                <div className="p-6 border-b">
                  <h3 className="text-md font-semibold mb-3">Select Cryptocurrency</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {cryptoPayments.map((crypto) => (
                      <motion.button
                        key={crypto.symbol}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setSelectedCryptoMethod(crypto.symbol);
                        }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-3 border rounded-lg transition-all ${
                          selectedCryptoMethod === crypto.symbol 
                            ? 'border-blue-600 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-semibold">{crypto.symbol}</span>
                          <span className="text-xs text-green-600">
                            {/* Save {crypto.discount}% */}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Wallet Connect */}
                <AnimatePresence>
                  {selectedCryptoMethod && (
                    <motion.div
                      initial={{ opacity: 1, height: 0 }}
                      animate={{ opacity: 1, height: 0 }}
                      exit={{ opacity: 1, height: 0 }}
                      className="p-6 pb-28 border-b"
                    >
                      <h3 className="text-md font-semibold mb-6">Connect Your Wallet</h3>
                      <div className="">
                        <appkit-button />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pay Button */}
                <div className="p-6">
                  <button
                    onClick={() => {
                      checkBalance();
                      handleWalletPayment();
                    }}
                    disabled={!selectedCryptoMethod || !isConnected || isProcessingPayment || hasInsufficientFunds}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg 
                      hover:bg-blue-700 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing Payment...
                      </div>
                    ) : !isConnected ? (
                      'Connect Wallet to Pay'
                    ) : hasInsufficientFunds ? (
                      'Insufficient Funds - Add ETH to Wallet'
                    ) : (
                      `Pay €${((selectedService?.discountedPrice || 0) + (includeBlacklistCheck ? 2.95 : 0)).toFixed(2)}`
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleIMEIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 15);
    setImei(value);
    setImeiError(validateIMEI(value));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const [selectedCrypto, setSelectedCrypto] = useState(cryptoPayments[0].symbol);

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  
  const confirmCancel = () => {
    // Reset all state
    setStep(1);
    setSelectedCarrier("");
    setSelectedService(null);
    setImei("");
    setEmail("");
    setIncludeBlacklistCheck(false);
    setAcceptedTerms(false);
    
    // Navigate to home
    navigate('/');
  };

  const [showPaymentConfirmationModal, setShowPaymentConfirmationModal] = useState(false);
  const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
  
    const handleCopy = () => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
  
    return (
      <button 
        onClick={handleCopy}
        className="text-blue-600 hover:text-blue-800 text-sm"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    );
  };
  
  const CancelModal = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Confirm Cancellation</h2>
          <button 
            onClick={() => setShowCancelModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to cancel? All entered information will be lost.
        </p>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={() => setShowCancelModal(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            No, Continue
          </button>
          <button 
            onClick={confirmCancel}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Yes, Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderServiceSummaryBar = () => {
    if (!selectedService) return null;

    return (
      <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <selectedService.icon className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-900">{selectedService.name}</h3>
            <p className="text-sm text-blue-700">
              {selectedService.description} | €{selectedService.discountedPrice}
            </p>
          </div>
        </div>
        {selectedService.type === 'sim-unlock' && selectedCarrier && (
          <div className="text-sm text-blue-800">
            <strong>Carrier:</strong> {selectedCarrier}
          </div>
        )}
      </div>
    );
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  // Shimmering gold effect animation
  const shimmerVariants = {
    initial: { backgroundPosition: '0 0' },
    animate: {
      backgroundPosition: ['0 0', '100% 0'],
      transition: {
        repeat: Infinity,
        repeatType: "mirror" as const,
        duration: 3,
        ease: "linear"
      }
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => navigate('/device-catalog')}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Device Catalog</span>
              </button>
              <button 
                onClick={handleCancel}
                className="text-red-600 hover:text-red-700 flex items-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            </div>

            <h2 className="text-xl font-semibold mb-4">Select Service</h2>
            <div className="space-y-6">
              {services.map((service) => (
                <motion.div 
                  key={service.id}
                  whileHover={{ scale: 1.02 }}
                  className={`bg-white rounded-lg border p-6 transition-all duration-300 cursor-pointer ${
                    selectedService?.id === service.id 
                      ? 'border-blue-600 shadow-lg' 
                      : 'hover:border-blue-300'
                  }`}
                  onClick={() => {
                    setSelectedService(service);
                    if (service.type === 'sim-unlock') {
                      setStep(2); // Go to carrier selection for SIM unlock
                    } else {
                      setStep(3); // Go to details for other services
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-600">{service.name}</h3>
                      <p className="text-green-600">Success rate: {service.successRate}</p>
                    </div>
                    <div className="text-right">
                      <span className="line-through text-gray-500">€{service.originalPrice}</span>
                      <span className="text-2xl font-bold text-blue-600 ml-2">€{service.discountedPrice}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">{service.detailedDescription}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <AnimatePresence>
              {showCancelModal && <CancelModal />}
            </AnimatePresence>
          </div>
        );

      case 2:
        // Carrier selection for SIM unlock
        if (selectedService?.type === 'sim-unlock') {
          return (
            <div>
              {renderServiceSummaryBar()}
              <div className="flex justify-between items-center mb-6">
                <button 
                  onClick={() => setStep(1)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
                <button 
                  onClick={handleCancel}
                  className="text-red-600 hover:text-red-700 flex items-center space-x-2"
                >
                  <X className="w-5 h-5" />
                  <span>Cancel</span>
                </button>
              </div>
              <h2 className="text-xl font-semibold mb-4">Select Original Carrier</h2>
              <p className="text-gray-600 mb-6">
                Please select the original network provider to which your device is locked
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {carriers.map((carrier) => (
                  <button
                    key={carrier}
                    className={`p-4 border rounded-lg text-left ${
                      selectedCarrier === carrier
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-400'
                    }`}
                    onClick={() => {
                      setSelectedCarrier(carrier);
                      setStep(3);
                    }}
                  >
                    {carrier}
                  </button>
                ))}
              </div>
              

              <AnimatePresence>
                {showCancelModal && <CancelModal />}
              </AnimatePresence>
            </div>

            
          );
        }
        
      case 3:
        // Details form for MDM and iCloud
        return (
          <div>
            {renderServiceSummaryBar()}
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setStep(1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <button 
                onClick={handleCancel}
                className="text-red-600 hover:text-red-700 flex items-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            </div>
            <h2 className="text-xl font-semibold mb-4">Enter Device Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">IMEI Number</label>
                <input
                  type="text"
                  placeholder="Type *#06# to find IMEI"
                  className={`w-full p-2 border rounded ${imeiError ? 'border-red-500' : ''}`}
                  value={imei}
                  onChange={handleIMEIChange}
                />
                {imeiError && <p className="text-red-500 text-sm mt-1">{imeiError}</p>}
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className={`w-full p-2 border rounded ${emailError ? 'border-red-500' : ''}`}
                  value={email}
                  onChange={handleEmailChange}
                />
                {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="blacklistCheck"
                  checked={includeBlacklistCheck}
                  onChange={(e) => setIncludeBlacklistCheck(e.target.checked)}
                />
                <label htmlFor="blacklistCheck">Include Blacklist Check (+€2.95)</label>
              </div>

              <div>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      setShowTermsError(false);
                    }}
                    className="mt-1"
                  />
                  <label htmlFor="terms" className="text-sx">
                    I agree to the <Link to="/terms" className="text-blue-600 hover:underline" target="_blank">Terms and Conditions</Link> and accept the use of my info
                  </label>
                </div>
                {showTermsError && (
                  <p className="text-red-500 text-sm mt-2">
                    Please read and accept the Terms and Conditions
                  </p>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    const imeiValidation = validateIMEI(imei);
                    const emailValidation = validateEmail(email);
                    
                    setImeiError(imeiValidation);
                    setEmailError(emailValidation);
                    
                    if (!acceptedTerms) {
                      setShowTermsError(true);
                      return;
                    }
                    
                    if (!imeiValidation && !emailValidation) {
                      setStep(5);
                    }
                  }}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showCancelModal && <CancelModal />}
            </AnimatePresence>
          </div>
        );

      case 4:
        return (
          <div>
            {renderServiceSummaryBar()}
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => selectedService?.type === 'sim-unlock' ? setStep(2) : setStep(2)}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <button 
                onClick={handleCancel}
                className="text-red-600 hover:text-red-700 flex items-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            </div>
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="bg-white rounded-lg border p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Device</span>
                  <span className="font-semibold">{model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service</span>
                  <span className="font-semibold">{selectedService?.name}</span>
                </div>
                {selectedService?.type === 'sim-unlock' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Carrier</span>
                    <span>{selectedCarrier}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">IMEI</span>
                  <span>{imei}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span>{email}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Price</span>
                    <span className="line-through">€{selectedService?.originalPrice}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>
                      -€{(
                        (selectedService?.originalPrice || 0) - 
                        (selectedService?.discountedPrice || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                  {includeBlacklistCheck && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Blacklist Check</span>
                      <span>€2.95</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold mt-2">
                    <span>Total</span>
                    <span>
                      €{(
                        (selectedService?.discountedPrice || 0) + 
                        (includeBlacklistCheck ? 2.95 : 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => setStep(5)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showCancelModal && <CancelModal />}
            </AnimatePresence>
          </div>
        );

        case 5:
          return (
            <div>
              {renderServiceSummaryBar()}
              <div className="flex justify-between items-center mb-6">
                <button 
                  onClick={() => setStep(3)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
                <button 
                  onClick={handleCancel}
                  className="text-red-600 hover:text-red-700 flex items-center space-x-2"
                >
                  <X className="w-5 h-5" />
                  <span>Cancel</span>
                </button>
              </div>

              <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-semibold mb-6 text-center">
                    Order Summary
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Device Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">Device Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Device Model:</span>
                          <span className="font-medium">{model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">IMEI:</span>
                          <span className="font-medium">{imei}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Service Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">Service Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service Type:</span>
                          <span className="font-medium">{selectedService?.name}</span>
                        </div>
                        {selectedService?.type === 'sim-unlock' && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Carrier:</span>
                            <span className="font-medium">{selectedCarrier}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Unlock Time:</span>
                          <span className="font-medium">{selectedService?.deliveryTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Success Rate:</span>
                          <span className="font-medium text-green-600">{selectedService?.successRate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="mt-6 border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Original Price</span>
                      <span className="line-through">€{selectedService?.originalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>
                        -€{(
                          (selectedService?.originalPrice || 0) - 
                          (selectedService?.discountedPrice || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                    {includeBlacklistCheck && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Blacklist Check</span>
                        <span>€2.95</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold mt-2">
                      <span>Total Amount</span>
                      <span>
                        €{(
                          (selectedService?.discountedPrice || 0) + 
                          (includeBlacklistCheck ? 2.95 : 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Payment Methods Container */}
                <div className="bg-white rounded-xl shadow-lg p-6 ">
                  <h2 className="text-2xl font-semibold mb-6 text-center">
                    Payment Methods
                  </h2>


                  <WalletPaymentModal />

                  {/* Manual Payment Section */}
                  <div className="bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-200">
                    <div className="mb-4 sm:mb-6">
                      <div className="border-b border-gray-200">
                        <nav className="flex flex-col sm:flex-row sm:space-x-8" aria-label="Tabs">
                          <button
                            onClick={() => setSelectedPaymentTab('manual')}
                            className={`
                              whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm
                              ${selectedPaymentTab === 'manual'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }
                            `}
                          >
                            Manual Payment
                          </button>
                          <button
                            onClick={() => setSelectedPaymentTab('wallet')}
                            disabled={!!paymentAddress}
                            className={`
                              whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm
                              ${selectedPaymentTab === 'wallet'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }
                              ${!!paymentAddress ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          >
                            WalletConnect
                          </button>
                        </nav>
                      </div>
                    </div>

                    <div className="payment-content">
                      {selectedPaymentTab === 'manual' ? (
                        <div className="space-y-4 sm:space-y-6">
                          <div className="bg-white rounded-lg p-4 sm:p-6 border border-blue-100 shadow-sm">
                            <div className="flex flex-col space-y-4">
                              <div className="flex items-center space-x-3">
                                <CreditCard className="w-6 h-6 text-blue-600" />
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900">Manual Cryptocurrency Payment</h3>
                                  <p className="text-sm text-gray-500">Pay with Bitcoin, Ethereum, USDT, or other cryptocurrencies directly to the provided address.</p>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 p-3 sm:p-4 rounded-lg gap-2">
                                <div className="text-sm text-gray-600">Pay for MDM Bypass</div>
                                <div className="text-lg font-semibold text-blue-600">€{((selectedService?.discountedPrice || 0) + (includeBlacklistCheck ? 2.95 : 0)).toFixed(2)}</div>
                              </div>
                            </div>
                          </div>

                          {/* Progress Steps */}
                          <div className="flex flex-col sm:flex-row sm:justify-between mb-4 sm:mb-8 gap-2 sm:gap-0">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                !paymentAddress ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                              }`}>
                                1
                              </div>
                              <span className={`ml-2 text-sm transition-colors ${
                                !paymentAddress ? 'text-gray-900' : 'text-gray-400'
                              }`}>Choose asset</span>
                            </div>
                            <div className="flex-1 mx-0 sm:mx-4 border-t border-gray-200 my-auto"></div>
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                paymentAddress ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                              }`}>
                                2
                              </div>
                              <span className={`ml-2 text-sm transition-colors ${
                                paymentAddress ? 'text-gray-900' : 'text-gray-400'
                              }`}>Send deposit</span>
                            </div>
                          </div>

                          {/* Step 1: Choose Asset */}
                          {!paymentAddress && (
                            <div className="space-y-4 sm:space-y-6">
                              <div className="bg-white rounded-lg p-4 sm:p-6 border border-blue-100 shadow-sm">
                                <div className="space-y-4 sm:space-y-6">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                                      Select Cryptocurrency
                                    </label>
                                    <CryptoAssetDropdown
                                      selectedAsset={selectedPaymentMethod}
                                      onSelect={(assetId) => {
                                        setSelectedPaymentMethod(assetId);
                                        setPaymentAddress('');
                                        setPaymentAmount('');
                                        setPaymentId('');
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="w-full bg-blue-600 text-white py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                              >
                                {isProcessing ? (
                                  <div className="flex items-center justify-center">
                                    <div className="loading-spinner" />
                                    <span>Processing...</span>
                                  </div>
                                ) : (
                                  'Generate Deposit Address'
                                )}
                              </button>
                            </div>
                          )}

                          {/* Step 2: Send Deposit */}
                          {paymentAddress && (
                            <div className="space-y-4 sm:space-y-6">
                              <div className="bg-white rounded-lg p-4 sm:p-6 border border-blue-100 shadow-sm">
                                <div className="space-y-4 sm:space-y-6">
                                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 sm:gap-0">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Send exactly
                                      </label>
                                      <div className="flex items-center space-x-2">
                                        <CryptoIcon symbol={selectedPaymentMethod} className="w-8 h-8" />
                                        <div className="flex items-center space-x-2">
                                          <div className="text-xl sm:text-2xl font-bold text-gray-900">
                                            {paymentAmount} {getAssetDisplay(selectedPaymentMethod).symbol}
                                          </div>
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(paymentAmount);
                                              setAmountCopied(true);
                                              toast.success('Amount copied to clipboard!');
                                              setTimeout(() => setAmountCopied(false), 2000);
                                            }}
                                            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                                          >
                                            <AnimatePresence mode="wait">
                                              <motion.div
                                                key={amountCopied ? 'check' : 'copy'}
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                              >
                                                {amountCopied ? (
                                                  <Check className="w-5 h-5 text-green-500" />
                                                ) : (
                                                  <Copy className="w-5 h-5" />
                                                )}
                                              </motion.div>
                                            </AnimatePresence>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                                      <div className="text-sm text-gray-600">Time remaining</div>
                                      <div className="text-lg font-semibold text-blue-600">
                                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      To this address
                                    </label>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                      <code className="w-full bg-gray-50 p-2 sm:p-3 rounded-lg text-sm font-mono border border-blue-100 break-all">
                                        {paymentAddress}
                                      </code>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(paymentAddress);
                                          setCopied(true);
                                          toast.success('Address copied to clipboard!');
                                          setTimeout(() => setCopied(false), 2000);
                                        }}
                                        className="w-full sm:w-auto p-2 text-gray-500 hover:text-blue-600 transition-colors"
                                      >
                                        <AnimatePresence mode="wait">
                                          <motion.div
                                            key={copied ? 'check' : 'copy'}
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.5, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                          >
                                            {copied ? (
                                              <Check className="w-5 h-5 text-green-500" />
                                            ) : (
                                              <Copy className="w-5 h-5" />
                                            )}
                                          </motion.div>
                                        </AnimatePresence>
                                      </button>
                                    </div>
                                  </div>
                                  {/* QR Code */}
                                  <div className="flex justify-center mt-2">
                                    <div className="bg-white p-2 sm:p-4 rounded-lg border border-blue-100">
                                      <QRCodeSVG
                                        value={`${selectedPaymentMethod}:${paymentAddress}?amount=${paymentAmount}`}
                                        size={140}
                                        level="H"
                                        includeMargin={true}
                                      />
                                    </div>
                                  </div>
                                  {/* Warning */}
                                  <div className="flex items-start space-x-2 text-amber-600 text-sm bg-amber-50 p-2 sm:p-3 rounded-lg border border-amber-100">
                                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <p>Please send the exact amount. Sending a different amount may result in payment failure.</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  onClick={() => {
                                    setPaymentAddress('');
                                    setPaymentAmount('');
                                    setPaymentId('');
                                    setTimeLeft(0);
                                  }}
                                  className="w-full sm:flex-1 py-2 sm:py-3 rounded-lg font-medium border border-blue-200 text-gray-700 hover:bg-blue-50 transition-colors"
                                >
                                  Back to Asset Selection
                                </button>
                                <button
                                  onClick={() => {
                                    setPaymentAddress('');
                                    setPaymentAmount('');
                                    setPaymentId('');
                                    setTimeLeft(0);
                                    setSelectedPaymentMethod('btc');
                                    setIsPolicyAcknowledged(false);
                                  }}
                                  className="w-full sm:flex-1 py-2 sm:py-3 rounded-lg font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  Cancel Payment
                                </button>
                              </div>
                            </div>
                          )}

                          {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                              {error}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="bg-white rounded-lg p-6 border border-blue-100 shadow-sm">
                            <div className="flex flex-col space-y-4">
                              <div className="flex items-center space-x-3">
                                <Wallet className="w-6 h-6 text-blue-600" />
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900">WalletConnect Fast Payment</h3>
                                  <p className="text-sm text-gray-500">Pay securely with any crypto wallet using WalletConnect — trusted worldwide.</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600">Pay for MDM Bypass</div>
                                <div className="text-lg font-semibold text-blue-600">€{((selectedService?.discountedPrice || 0) + (includeBlacklistCheck ? 2.95 : 0)).toFixed(2)}</div>
                              </div>
                              <button
                                onClick={() => setIsWalletPaymentModalOpen(true)}
                                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                Connect Pay for MDM Bypass - €{((selectedService?.discountedPrice || 0) + (includeBlacklistCheck ? 2.95 : 0)).toFixed(2)}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                </div>
                
              </div>

              <AnimatePresence>
                {showCancelModal && <CancelModal />}
              </AnimatePresence>
            </div>
          );

      case 6:
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto relative overflow-hidden"
    >
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-green-500"></div>

      {/* Success Illustration */}
      <div className="flex justify-center mb-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20 
          }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center"
        >
          <CheckCircle className="w-14 h-14 text-green-600" />
        </motion.div>
      </div>

      {/* Success Message */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Payment Confirmed!
        </h2>
        <p className="text-gray-600 text-sm">
          Your unlock request has been processed. We'll begin working on your device immediately.
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">Order ID</span>
          <div className="flex items-center space-x-2">
            <code className="bg-white px-2 py-1 rounded text-xs font-mono">
              ORDER-{Date.now()}
            </code>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`ORDER-${Date.now()}`);
                toast.success('Order ID Copied!');
              }}
              className="text-gray-500 hover:text-blue-600"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">Device</span>
          <span className="font-medium">{model}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">Service</span>
          <span className="font-medium">{selectedService?.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">IMEI</span>
          <span className="font-mono">{imei}</span>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="bg-blue-50 rounded-xl p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-blue-800 font-semibold">Transaction Hash</span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(transactionHash || '');
              toast.success('Transaction Hash Copied!');
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <code className="block bg-white p-2 rounded text-xs font-mono truncate">
          {transactionHash}
        </code>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <p className="text-gray-600 text-sm text-center mb-2">
          Please contact our admin through WhatsApp to confirm your payment has been received. Share your Order ID and Transaction Hash for faster verification.
        </p>
        <button
          onClick={() => {
            const message = `Hello! I've completed my device unlock payment.
Order ID: ORDER-${Date.now()}
Transaction Hash: ${transactionHash}
Can you confirm my payment?`;
            window.open(`https://wa.me/15793860596?text=${encodeURIComponent(message)}`, '_blank');
          }}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Contact Support</span>
        </button>

        <div className="flex space-x-3">
          <button
            onClick={() => {
              const receiptData = {
                orderId: `ORDER-${Date.now()}`,
                service: selectedService?.name || '',
                device: model || '',
                originalPrice: selectedService?.originalPrice || 0,
                discount: selectedService?.originalPrice ? selectedService.originalPrice - selectedService.discountedPrice : 0,
                finalPrice: selectedService?.discountedPrice || 0,
                paymentMethod: 'WalletConnect',
                transactionHash: transactionHash || undefined,
                date: new Date().toISOString(),
                imei: imei,
                email: email
              };
              generateReceipt(receiptData);
            }}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Receipt</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Home
          </button>
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-center text-xs text-gray-500 mt-4">
        Updates will be sent to {email}
      </p>
    </motion.div>
  );

      default:
        return null;
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const totalAmount = (selectedService?.discountedPrice || 0) + (includeBlacklistCheck ? 2.95 : 0);
      
      const response = await fetch('https://api.nowpayments.io/v1/payment', {
        method: 'POST',
        headers: {
          'x-api-key': import.meta.env.VITE_NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price_amount: totalAmount,
          price_currency: 'EUR',
          pay_currency: selectedPaymentMethod,
          order_id: `ORDER-${Date.now()}`,
          order_description: `${selectedService?.name} for ${model}`,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/cancel`,
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
        setTimeLeft(20 * 60);
        setTimerRunning(true);
        setNotificationState({
          type: 'success',
          message: 'Payment address generated successfully! Please send the exact amount to the address below.'
        });
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

  // Add this useEffect near the other useEffect hooks:
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (paymentAddress && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setPaymentExpired(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [paymentAddress, timeLeft]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notifications */}
      <div className="fixed top-0 left-0 right-0 z-[60] flex flex-col gap-2 p-4">
        <AnimatePresence>
          {showPaymentGuidance && (
            <Notification 
              message="Please open your wallet app to confirm the transaction. Wait for some time for the transaction to be confirmed on the blockchain."
              type="info"
              onClose={() => setShowPaymentGuidance(false)}
            />
          )}
          {showInsufficientFunds && (
            <Notification 
              message={`Insufficient funds. You need at least ${(((selectedService?.discountedPrice || 0) + (includeBlacklistCheck ? 2.95 : 0)) / 3000).toFixed(5)} ETH (€${((selectedService?.discountedPrice || 0) + (includeBlacklistCheck ? 2.95 : 0)).toFixed(2)}) to complete this transaction. Please add more ETH to your wallet or try with a different payment method.`}
              type="error"
              onClose={() => setShowInsufficientFunds(false)}
            />
          )}
          {showTransactionCancelled && (
            <Notification 
              message="Transaction was canceled. Please try again if you want to proceed with the payment."
              type="error"
              onClose={() => setShowTransactionCancelled(false)}
            />
          )}
          {showPendingConfirmation && (
            <Notification 
              message={`Transaction is pending confirmation. Hash: ${transactionHash?.slice(0, 6)}...${transactionHash?.slice(-4)}`}
              type="info"
              onClose={() => setShowPendingConfirmation(false)}
            />
          )}
        </AnimatePresence>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}
