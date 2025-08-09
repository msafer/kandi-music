'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Music, Users, DollarSign, Zap, Lock } from 'lucide-react'
import { formatNumber, formatPrice, formatTokenAmount } from '@/lib/utils'
import { platformConfig } from '@/lib/config'

interface PlatformStatsProps {
  totalSongs?: number
  totalUsers?: number
  totalVolume?: string
  kandiPrice?: string
  totalMarketCap?: string
  stakingRewards?: string
}

export function PlatformStats({
  totalSongs = 3,
  totalUsers = 12500,
  totalVolume = '4250.50',
  kandiPrice = '0.001',
  totalMarketCap = '8562.25',
  stakingRewards = '125000'
}: PlatformStatsProps) {
  const stats = [
    {
      label: 'Active Songs',
      value: totalSongs.toString(),
      icon: Music,
      color: 'from-purple-500 to-pink-500',
      change: '+2 this week',
      description: 'Music releases available'
    },
    {
      label: 'Total Users',
      value: formatNumber(totalUsers),
      icon: Users,
      color: 'from-blue-500 to-indigo-500',
      change: '+8.5% this month',
      description: 'Active platform users'
    },
    {
      label: 'Trading Volume',
      value: `${formatPrice(totalVolume)} GHO`,
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-500',
      change: '+12.3% this week',
      description: '24h trading volume'
    },
    {
      label: 'KANDI Price',
      value: `${formatPrice(kandiPrice)} GHO`,
      icon: DollarSign,
      color: 'from-yellow-500 to-orange-500',
      change: '+5.2% today',
      description: 'Platform token price'
    },
    {
      label: 'Market Cap',
      value: `${formatPrice(totalMarketCap)} GHO`,
      icon: Zap,
      color: 'from-pink-500 to-rose-500',
      change: '+15.8% this month',
      description: 'Total platform value'
    },
    {
      label: 'Staking Rewards',
      value: formatTokenAmount(stakingRewards, 'KANDI'),
      icon: Lock,
      color: 'from-indigo-500 to-purple-500',
      change: 'Available to claim',
      description: 'Total rewards distributed'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Platform Overview
        </h2>
        <p className="text-gray-400">
          Real-time statistics for the KANDI Music Platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -2, scale: 1.02 }}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
            
            {/* Icon */}
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              
              {/* Change indicator */}
              <div className="text-right">
                <span className="text-xs text-emerald-400 font-medium">
                  {stat.change}
                </span>
              </div>
            </div>

            {/* Value */}
            <div className="space-y-1 mb-3">
              <h3 className="text-2xl font-bold text-white">
                {stat.value}
              </h3>
              <p className="text-sm text-gray-400">
                {stat.label}
              </p>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500">
              {stat.description}
            </p>

            {/* Animated border */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10 blur-xl`} />
          </motion.div>
        ))}
      </div>

      {/* KANDI Distribution */}
      <motion.div
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <h3 className="text-xl font-bold text-white mb-4">
          KANDI Token Distribution
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(platformConfig.kandiDistribution).map(([key, percentage]) => (
            <div key={key} className="text-center space-y-2">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-white capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-xs text-gray-400">
                  {percentage}% • {formatNumber((percentage / 100) * parseInt(platformConfig.kandiTotalSupply))} KANDI
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      >
        <motion.button
          className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Buy KANDI Tokens
        </motion.button>
        
        <motion.button
          className="p-4 border border-gray-600 rounded-xl text-gray-300 font-medium hover:border-indigo-500 hover:text-indigo-300 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Start Staking
        </motion.button>
        
        <motion.button
          className="p-4 border border-gray-600 rounded-xl text-gray-300 font-medium hover:border-purple-500 hover:text-purple-300 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Claim Rewards
        </motion.button>
      </motion.div>
    </div>
  )
}