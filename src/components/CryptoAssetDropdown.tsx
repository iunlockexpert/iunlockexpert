import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  network?: string;
}

const cryptoAssets: CryptoAsset[] = [
  { id: 'btc', name: 'BTC', symbol: 'BTC' },
  { id: 'eth', name: 'ETH', symbol: 'ETH' },
  { id: 'usdttrc20', name: 'USDT', symbol: 'USDT', network: 'TRC-20' },
  { id: 'usdterc20', name: 'USDT', symbol: 'USDT', network: 'ERC-20' },
  { id: 'usdc', name: 'USDC', symbol: 'USDC' },
  { id: 'ltc', name: 'LTC', symbol: 'LTC' },
  { id: 'sol', name: 'SOL', symbol: 'SOL' }
];

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

interface CryptoAssetDropdownProps {
  selectedAsset: string;
  onSelect: (assetId: string) => void;
  className?: string;
}

const CryptoAssetDropdown: React.FC<CryptoAssetDropdownProps> = ({
  selectedAsset,
  onSelect,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedAssetData = cryptoAssets.find(asset => asset.id === selectedAsset) || cryptoAssets[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
      >
        <div className="flex items-center space-x-3">
          <CryptoIcon symbol={selectedAssetData.symbol} className="w-6 h-6" />
          <div className="text-left">
            <div className="font-medium text-gray-900">{selectedAssetData.name}</div>
            {selectedAssetData.network && (
              <div className="text-xs text-gray-500">{selectedAssetData.network}</div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg">
          {cryptoAssets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => {
                onSelect(asset.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between p-3 hover:bg-blue-50 transition-colors ${
                selectedAsset === asset.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <CryptoIcon symbol={asset.symbol} className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">{asset.name}</div>
                  {asset.network && (
                    <div className="text-xs text-gray-500">{asset.network}</div>
                  )}
                </div>
              </div>
              {selectedAsset === asset.id && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CryptoAssetDropdown; 