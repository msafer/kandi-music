import { http, createConfig } from 'wagmi'
import { base, sepolia, mainnet } from 'wagmi/chains'
import { walletConnect } from 'wagmi/connectors'

// Contract addresses (update with deployed addresses)
export const contracts = {
  [mainnet.id]: {
    gho: '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f',
    kandi: '0x0000000000000000000000000000000000000000', // Update after deployment
    mintRouter: '0x0000000000000000000000000000000000000000', // Update after deployment
  },
  [base.id]: {
    gho: '0x0000000000000000000000000000000000000000', // Update when available
    kandi: '0x0000000000000000000000000000000000000000', // Update after deployment
    mintRouter: '0x0000000000000000000000000000000000000000', // Update after deployment
  },
  [sepolia.id]: {
    gho: '0xc4bF5CbDaBE595361438F8c6a187bDc330539c60',
    kandi: '0x0000000000000000000000000000000000000000', // Update after deployment
    mintRouter: '0x0000000000000000000000000000000000000000', // Update after deployment
  },
} as const

// WalletConnect project ID
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

// Wagmi configuration
export const config = createConfig({
  chains: [mainnet, base, sepolia],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [
    walletConnect({
      projectId,
      metadata: {
        name: 'KANDI Music Platform',
        description: 'Web3 Music NFT Platform with ERC-222 Standard',
        url: 'https://kandimusic.com',
        icons: ['https://kandimusic.com/icon.png'],
      },
    }),
  ],
})

// Song releases configuration
export interface SongRelease {
  id: string
  name: string
  artist: string
  nftContract: string
  tokenContract: string
  vaultContract: string
  coverImage: string
  mintPrice: string
  maxSupply: number
  currentSupply: number
  floorPrice: string
  marketCap: string
  releaseDate: string
  genre: string
}

// Mock song data (replace with API calls)
export const mockSongs: SongRelease[] = [
  {
    id: 'hades',
    name: 'Hades',
    artist: 'Cosmic Beats',
    nftContract: '0x0000000000000000000000000000000000000000',
    tokenContract: '0x0000000000000000000000000000000000000000',
    vaultContract: '0x0000000000000000000000000000000000000000',
    coverImage: '/images/hades-cover.jpg',
    mintPrice: '0.0004',
    maxSupply: 10000000,
    currentSupply: 2500000,
    floorPrice: '0.00045',
    marketCap: '1125.00',
    releaseDate: '2024-01-15',
    genre: 'Electronic'
  },
  {
    id: 'stellar-dreams',
    name: 'Stellar Dreams',
    artist: 'Luna Wave',
    nftContract: '0x0000000000000000000000000000000000000000',
    tokenContract: '0x0000000000000000000000000000000000000000',
    vaultContract: '0x0000000000000000000000000000000000000000',
    coverImage: '/images/stellar-dreams-cover.jpg',
    mintPrice: '0.0004',
    maxSupply: 10000000,
    currentSupply: 1200000,
    floorPrice: '0.00041',
    marketCap: '492.00',
    releaseDate: '2024-01-20',
    genre: 'Ambient'
  },
  {
    id: 'neon-nights',
    name: 'Neon Nights',
    artist: 'Synthwave Collective',
    nftContract: '0x0000000000000000000000000000000000000000',
    tokenContract: '0x0000000000000000000000000000000000000000',
    vaultContract: '0x0000000000000000000000000000000000000000',
    coverImage: '/images/neon-nights-cover.jpg',
    mintPrice: '0.0004',
    maxSupply: 10000000,
    currentSupply: 5800000,
    floorPrice: '0.00048',
    marketCap: '2784.00',
    releaseDate: '2024-01-10',
    genre: 'Synthwave'
  }
]

// Platform configuration
export const platformConfig = {
  name: 'KANDI Music Platform',
  description: 'Web3 Music NFT Platform with ERC-222 Standard',
  tokensPerNft: 10000,
  platformFeeRate: 250, // 2.5% in basis points
  airdropLockPeriod: 90, // days
  kandiTotalSupply: '100000000000', // 100B
  kandiDistribution: {
    openSale: 50,
    airdrop: 20,
    farcaster: 10,
    staking: 10,
    checkin: 10
  }
}