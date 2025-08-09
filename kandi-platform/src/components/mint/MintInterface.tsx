'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Minus, 
  CreditCard, 
  Zap, 
  Info, 
  CheckCircle, 
  Clock,
  ArrowRight,
  Wallet
} from 'lucide-react'
import { SongRelease } from '@/lib/config'
import { formatPrice, formatNumber, isValidNumber } from '@/lib/utils'
import { useAccount } from 'wagmi'

interface MintInterfaceProps {
  song: SongRelease
  onClose?: () => void
}

export function MintInterface({ song, onClose }: MintInterfaceProps) {
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'gho' | 'kandi'>('gho')
  const [kandiAmount, setKandiAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'configure' | 'confirm' | 'processing' | 'success'>('configure')
  
  const { address, isConnected } = useAccount()

  // Calculate costs
  const mintPrice = parseFloat(song.mintPrice)
  const totalCostGHO = mintPrice * quantity
  const platformFee = totalCostGHO * 0.025 // 2.5%
  const netCost = totalCostGHO - platformFee
  
  // Mock KANDI exchange rate (1 KANDI = 0.001 GHO)
  const kandiExchangeRate = 0.001
  const requiredKANDI = totalCostGHO / kandiExchangeRate

  const maxMintPerTx = 100
  const availableToMint = song.maxSupply - song.currentSupply

  useEffect(() => {
    if (paymentMethod === 'kandi') {
      setKandiAmount(requiredKANDI.toString())
    }
  }, [paymentMethod, requiredKANDI])

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(maxMintPerTx, quantity + delta))
    setQuantity(newQuantity)
  }

  const handleQuantityInput = (value: string) => {
    if (isValidNumber(value)) {
      const num = Math.max(1, Math.min(maxMintPerTx, parseInt(value)))
      setQuantity(num)
    }
  }

  const handleMint = async () => {
    if (!isConnected) {
      // Trigger wallet connection
      return
    }

    setIsLoading(true)
    setStep('processing')

    try {
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setStep('success')
    } catch (error) {
      console.error('Minting failed:', error)
      setStep('configure')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 'configure':
        return (
          <div className="space-y-6">
            {/* Song Info */}
            <div className="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {song.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{song.name}</h3>
                <p className="text-gray-400">{song.artist}</p>
                <p className="text-sm text-indigo-300">{formatPrice(song.mintPrice)} GHO each</p>
              </div>
            </div>

            {/* Quantity Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-white font-medium">Quantity</label>
                <div className="text-sm text-gray-400">
                  Max {Math.min(maxMintPerTx, availableToMint)} per transaction
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <motion.button
                  className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white transition-colors"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
                
                <input
                  type="number"
                  min="1"
                  max={Math.min(maxMintPerTx, availableToMint)}
                  value={quantity}
                  onChange={(e) => handleQuantityInput(e.target.value)}
                  className="flex-1 text-center py-2 px-4 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
                
                <motion.button
                  className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white transition-colors"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= Math.min(maxMintPerTx, availableToMint)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
              <label className="text-white font-medium">Payment Method</label>
              
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    paymentMethod === 'gho'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-gray-700 bg-gray-800/30 text-gray-300 hover:border-gray-600'
                  }`}
                  onClick={() => setPaymentMethod('gho')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">GHO</p>
                      <p className="text-xs opacity-70">Direct payment</p>
                    </div>
                  </div>
                </motion.button>
                
                <motion.button
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    paymentMethod === 'kandi'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                      : 'border-gray-700 bg-gray-800/30 text-gray-300 hover:border-gray-600'
                  }`}
                  onClick={() => setPaymentMethod('kandi')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">KANDI</p>
                      <p className="text-xs opacity-70">Platform tokens</p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* KANDI Amount Input */}
            {paymentMethod === 'kandi' && (
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="text-white font-medium">KANDI Amount</label>
                <input
                  type="number"
                  value={kandiAmount}
                  onChange={(e) => setKandiAmount(e.target.value)}
                  className="w-full py-3 px-4 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Enter KANDI amount"
                />
                <p className="text-xs text-gray-400">
                  Recommended: {formatNumber(requiredKANDI)} KANDI (at current exchange rate)
                </p>
              </motion.div>
            )}

            {/* Cost Breakdown */}
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <h4 className="text-white font-medium mb-3">Cost Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">NFT Price ({quantity}x)</span>
                  <span className="text-white">{formatPrice(totalCostGHO)} GHO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform Fee (2.5%)</span>
                  <span className="text-white">{formatPrice(platformFee)} GHO</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-white">Total Cost</span>
                    <span className="text-indigo-300">
                      {paymentMethod === 'gho' 
                        ? `${formatPrice(totalCostGHO)} GHO`
                        : `${formatNumber(parseFloat(kandiAmount) || requiredKANDI)} KANDI`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Info */}
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-indigo-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-indigo-300 font-medium mb-1">What you'll receive:</p>
                  <ul className="text-indigo-200 space-y-1">
                    <li>• {quantity} Music NFT{quantity > 1 ? 's' : ''}</li>
                    <li>• {formatNumber(quantity * 10000)} kTokens (in vault)</li>
                    <li>• Royalty share from future sales</li>
                    <li>• KANDI rewards eligibility</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'processing':
        return (
          <div className="text-center py-12">
            <motion.div
              className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Clock className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">Processing Transaction</h3>
            <p className="text-gray-400 mb-4">
              Please confirm the transaction in your wallet...
            </p>
            <div className="text-sm text-gray-500">
              This may take a few moments to complete.
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="text-center py-12">
            <motion.div
              className="w-16 h-16 mx-auto mb-6 bg-emerald-500 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">Mint Successful!</h3>
            <p className="text-gray-400 mb-6">
              You've successfully minted {quantity} {song.name} NFT{quantity > 1 ? 's' : ''}
            </p>
            <div className="space-y-3">
              <motion.button
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
                onClick={() => window.open('#', '_blank')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                View on Explorer
              </motion.button>
              <motion.button
                className="w-full py-3 border border-gray-600 text-gray-300 rounded-lg font-medium hover:border-indigo-500 hover:text-indigo-300 transition-all duration-200"
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 max-w-md w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/50 p-6 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">
            {step === 'configure' && 'Mint NFT'}
            {step === 'processing' && 'Processing...'}
            {step === 'success' && 'Success!'}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        {step === 'configure' && (
          <div className="sticky bottom-0 bg-gray-900/90 backdrop-blur-sm border-t border-gray-700/50 p-6 rounded-b-2xl">
            {!isConnected ? (
              <motion.button
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
                onClick={() => {
                  // Trigger wallet connection
                  const connectButton = document.querySelector('w3m-button')
                  if (connectButton) {
                    (connectButton as any).click()
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Wallet className="w-5 h-5" />
                <span>Connect Wallet</span>
              </motion.button>
            ) : (
              <motion.button
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleMint}
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Mint {quantity} NFT{quantity > 1 ? 's' : ''}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}