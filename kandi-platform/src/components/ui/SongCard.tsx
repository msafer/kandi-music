'use client'

import { motion } from 'framer-motion'
import { Play, Pause, TrendingUp, Users, Clock, Music } from 'lucide-react'
import { useState } from 'react'
import { SongRelease } from '@/lib/config'
import { formatNumber, formatPrice } from '@/lib/utils'

interface SongCardProps {
  song: SongRelease
  onMint?: (songId: string) => void
  onViewVault?: (songId: string) => void
}

export function SongCard({ song, onMint, onViewVault }: SongCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const progressPercentage = (song.currentSupply / song.maxSupply) * 100

  return (
    <motion.div
      className="group relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Album Art */}
      <div className="relative mb-4">
        <div className="aspect-square rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 group-hover:shadow-2xl group-hover:shadow-indigo-500/25 transition-all duration-300">
          <div className="w-full h-full rounded-xl bg-gray-800 flex items-center justify-center relative overflow-hidden">
            {/* Placeholder for album art */}
            <Music className="w-16 h-16 text-gray-600" />
            
            {/* Vinyl record effect */}
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-indigo-500/30"
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
            />
            
            {/* Play/Pause Button */}
            <motion.button
              className={`absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={() => setIsPlaying(!isPlaying)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Song Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-xl text-white group-hover:text-indigo-300 transition-colors">
            {song.name}
          </h3>
          <p className="text-gray-400 text-sm">{song.artist}</p>
          <span className="inline-block px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full mt-1">
            {song.genre}
          </span>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-400">
              <TrendingUp className="w-3 h-3" />
              <span>Floor Price</span>
            </div>
            <p className="font-semibold text-emerald-400">{formatPrice(song.floorPrice)} GHO</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-400">
              <Users className="w-3 h-3" />
              <span>Market Cap</span>
            </div>
            <p className="font-semibold text-blue-400">{formatPrice(song.marketCap)} GHO</p>
          </div>
        </div>

        {/* Mint Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Minted</span>
            <span className="text-white font-medium">
              {formatNumber(song.currentSupply)} / {formatNumber(song.maxSupply)}
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </div>
          
          <p className="text-xs text-gray-400">
            {progressPercentage.toFixed(1)}% minted
          </p>
        </div>

        {/* Release Date */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>Released {new Date(song.releaseDate).toLocaleDateString()}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <motion.button
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
            onClick={() => onMint?.(song.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Mint NFT
          </motion.button>
          
          <motion.button
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:border-indigo-500 hover:text-indigo-300 transition-all duration-200"
            onClick={() => onViewVault?.(song.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Vault
          </motion.button>
        </div>
      </div>

      {/* Glowing edge effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />
    </motion.div>
  )
}