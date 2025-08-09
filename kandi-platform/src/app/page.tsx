'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { SongCard } from '@/components/ui/SongCard'
import { PlatformStats } from '@/components/dashboard/PlatformStats'
import { MintInterface } from '@/components/mint/MintInterface'
import { mockSongs, SongRelease } from '@/lib/config'
import { Search, Filter, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [mintModalSong, setMintModalSong] = useState<SongRelease | null>(null)

  const genres = ['all', ...Array.from(new Set(mockSongs.map(song => song.genre.toLowerCase())))]
  
  const filteredSongs = mockSongs.filter(song => {
    const matchesSearch = song.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGenre = selectedGenre === 'all' || song.genre.toLowerCase() === selectedGenre
    return matchesSearch && matchesGenre
  })

  const handleMint = (songId: string) => {
    const song = mockSongs.find(s => s.id === songId)
    if (song) {
      setMintModalSong(song)
    }
  }

  const handleViewVault = (songId: string) => {
    console.log('Viewing vault for song:', songId)
    // TODO: Implement vault view
    setCurrentPage('vault')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* Platform Statistics */}
            <PlatformStats />
            
            {/* Song Releases Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Featured Releases
                  </h2>
                  <p className="text-gray-400 mt-1">
                    Discover and mint exclusive music NFTs
                  </p>
                </div>
                
                <motion.div
                  className="flex items-center gap-1 text-sm text-emerald-400"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>+25% this week</span>
                </motion.div>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search songs or artists..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    className="pl-10 pr-8 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                  >
                    {genres.map(genre => (
                      <option key={genre} value={genre} className="bg-gray-800">
                        {genre === 'all' ? 'All Genres' : genre.charAt(0).toUpperCase() + genre.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Songs Grid */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {filteredSongs.map((song, index) => (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <SongCard
                      song={song}
                      onMint={handleMint}
                      onViewVault={handleViewVault}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {filteredSongs.length === 0 && (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-gray-400 mb-4">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No songs found</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )
      
      case 'mint':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Advanced Mint Interface</h2>
              <p className="text-gray-400 mb-8">Select a song below to open the minting interface</p>
            </div>
            
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {mockSongs.map((song, index) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <SongCard
                    song={song}
                    onMint={handleMint}
                    onViewVault={handleViewVault}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )
      
      case 'vault':
        return (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-white mb-4">Vault Management</h2>
            <p className="text-gray-400">Coming soon - NFT ↔ kToken swapping interface</p>
          </div>
        )
      
      case 'rewards':
        return (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-white mb-4">Rewards Center</h2>
            <p className="text-gray-400">Coming soon - KANDI rewards and staking</p>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>

      {/* Mint Modal */}
      <AnimatePresence>
        {mintModalSong && (
          <MintInterface
            song={mintModalSong}
            onClose={() => setMintModalSong(null)}
          />
        )}
      </AnimatePresence>

      {/* Hidden Web3Modal button for wallet connection */}
      <div style={{ display: 'none' }}>
        <w3m-button />
      </div>
    </div>
  )
}
