'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, Music, Zap, Vault, Gift, Settings } from 'lucide-react'
import { useAccount } from 'wagmi'
import { formatAddress } from '@/lib/utils'

interface HeaderProps {
  currentPage?: string
  onPageChange?: (page: string) => void
}

export function Header({ currentPage = 'dashboard', onPageChange }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { address, isConnected } = useAccount()

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Music },
    { id: 'mint', name: 'Mint', icon: Zap },
    { id: 'vault', name: 'Vault', icon: Vault },
    { id: 'rewards', name: 'Rewards', icon: Gift },
  ]

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl blur-lg opacity-50 -z-10" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                KANDI
              </h1>
              <p className="text-xs text-gray-400 -mt-1">Music Platform</p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item, index) => (
              <motion.button
                key={item.id}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === item.id
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
                onClick={() => onPageChange?.(item.id)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.name}</span>
              </motion.button>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Settings */}
            <motion.button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5" />
            </motion.button>

            {/* Wallet Connection */}
            {isConnected ? (
              <motion.div
                className="flex items-center space-x-3 bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-700/50"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-300">
                  {formatAddress(address || '')}
                </span>
              </motion.div>
            ) : (
              <motion.button
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
                onClick={() => {
                  // Web3Modal will handle this automatically
                  const connectButton = document.querySelector('w3m-button')
                  if (connectButton) {
                    (connectButton as any).click()
                  }
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Connect Wallet
              </motion.button>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          className={`md:hidden overflow-hidden ${isMenuOpen ? 'block' : 'hidden'}`}
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: isMenuOpen ? 'auto' : 0, 
            opacity: isMenuOpen ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="py-4 space-y-2 border-t border-gray-800/50">
            {navigation.map((item) => (
              <motion.button
                key={item.id}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  currentPage === item.id
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
                onClick={() => {
                  onPageChange?.(item.id)
                  setIsMenuOpen(false)
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </header>
  )
}