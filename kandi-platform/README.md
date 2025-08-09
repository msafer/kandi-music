# KANDI Music Platform - Frontend Application

A beautiful, modern Web3 frontend for the KANDI Music Platform, showcasing the revolutionary ERC-222 standard that pairs music NFTs with fractional kTokens.

## 🎵 Features

### 🎨 Modern UI/UX
- **Dark Theme**: Sleek, music-focused design with vibrant gradients
- **Responsive Design**: Perfect experience across desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion powered interactions and transitions
- **Glassmorphism**: Modern backdrop blur effects and transparent elements

### 🔗 Web3 Integration
- **Wallet Connection**: Web3Modal integration with multiple wallet support
- **Multi-Chain Support**: Ethereum, Base, and Sepolia networks
- **Real-time Data**: Live contract data fetching with automatic updates
- **Transaction Handling**: Comprehensive error handling and user feedback

### 🎼 Music Platform Features
- **Song Marketplace**: Browse and discover music NFT releases
- **Advanced Minting**: Dual payment options (GHO/KANDI) with cost breakdown
- **Platform Statistics**: Real-time metrics and market data
- **Search & Filter**: Find songs by name, artist, or genre
- **Vault Management**: NFT ↔ kToken swapping interface (coming soon)
- **Rewards System**: KANDI token staking and airdrops (coming soon)

## 🛠️ Technology Stack

- **Frontend Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth transitions
- **Web3 Integration**: Wagmi v2 + Viem for Ethereum interactions
- **Wallet Connection**: Web3Modal for multi-wallet support
- **TypeScript**: Full type safety throughout the application
- **State Management**: React Query for server state

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- A Web3 wallet (MetaMask, WalletConnect, etc.)
- Access to Ethereum, Base, or Sepolia network

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/kandi-music-platform
   cd kandi-music-platform/kandi-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your configuration:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Application Structure

```
src/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main dashboard page
│   └── globals.css        # Global styles
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   │   └── PlatformStats.tsx
│   ├── layout/            # Layout components
│   │   └── Header.tsx
│   ├── mint/              # Minting interface
│   │   └── MintInterface.tsx
│   ├── providers/         # React context providers
│   │   └── Web3Provider.tsx
│   └── ui/                # Reusable UI components
│       └── SongCard.tsx
├── hooks/                 # Custom React hooks
│   └── useContracts.ts   # Web3 contract interaction hooks
└── lib/                   # Utility functions and configuration
    ├── config.ts         # App configuration and constants
    └── utils.ts          # Utility functions
```

## 🎨 Design System

### Color Palette
- **Primary**: Indigo to Purple gradients (`from-indigo-500 to-purple-500`)
- **Accent**: Pink, Teal, Emerald for highlights
- **Background**: Dark grays with gradient overlays
- **Text**: White primary, gray-400 secondary

### Typography
- **Headings**: Bold, gradient text effects
- **Body**: Clean, readable sans-serif
- **Emphasis**: Color-coded for different types of data

### Animations
- **Page Transitions**: Smooth fade and slide effects
- **Hover States**: Scale and glow transformations
- **Loading States**: Rotating spinners and pulsing effects
- **Data Updates**: Smooth value transitions

## 🔧 Component Features

### SongCard
- Interactive album art with play/pause simulation
- Real-time minting progress bars
- Hover effects and animations
- Quick actions for minting and vault access

### MintInterface
- Multi-step minting process
- GHO/KANDI payment selection
- Real-time cost calculations
- Transaction status tracking
- Success confirmation with explorer links

### PlatformStats
- Live platform metrics
- KANDI token distribution visualization
- Interactive stat cards with hover effects
- Quick action buttons

### Header
- Responsive navigation
- Wallet connection status
- Network indicator
- Mobile-optimized menu

## 🔗 Web3 Integration

### Contract Interactions
- **ERC-20 Operations**: Balance checking, approvals, transfers
- **Minting**: NFT minting with GHO/KANDI payments
- **Vault Operations**: NFT ↔ kToken swapping (contract ready)
- **KANDI Features**: Airdrops, staking, rewards (contract ready)

### Supported Networks
- **Ethereum Mainnet**: Primary deployment target
- **Base**: L2 for reduced gas fees
- **Sepolia**: Testnet for development

### Real-time Updates
- Balance monitoring every 10 seconds
- Allowance checking every 5 seconds
- Platform stats refresh every 30 seconds
- Transaction status tracking

## 🎯 User Flows

### 1. Connect Wallet
```
Landing → Connect Wallet Button → Web3Modal → Wallet Selection → Connected State
```

### 2. Mint NFTs
```
Dashboard → Song Card → Mint Button → Payment Selection → Amount Input → Approve (if needed) → Mint → Success
```

### 3. Browse Songs
```
Dashboard → Search/Filter → Song Grid → Song Details → Actions
```

### 4. Platform Overview
```
Dashboard → Platform Stats → Distribution Charts → Quick Actions
```

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checking

### Key Development Notes

1. **Type Safety**: All components use TypeScript with strict typing
2. **Performance**: React Query caching and optimistic updates
3. **Error Handling**: Comprehensive error boundaries and user feedback
4. **Mobile First**: Responsive design with mobile-first approach
5. **Accessibility**: ARIA labels and keyboard navigation support

## 🚦 Contract Integration

### Mock Data vs Real Contracts
Currently uses mock data for demonstration. To connect to real contracts:

1. Update contract addresses in `src/lib/config.ts`
2. Replace mock data with real contract calls
3. Add proper error handling for network issues
4. Implement transaction confirmation flows

### Contract Hooks Available
- `useGHOBalance()` - Get user's GHO balance
- `useKANDIBalance()` - Get user's KANDI balance
- `useMintWorkflow()` - Complete minting workflow
- `useKANDIAirdropInfo()` - Airdrop eligibility and status
- `useSongRelease()` - Song contract information

## 🎼 Future Enhancements

### Phase 1: Core Features
- [ ] Real contract integration
- [ ] Transaction history
- [ ] User portfolio view
- [ ] Enhanced error handling

### Phase 2: Advanced Features
- [ ] Vault swap interface
- [ ] Staking dashboard
- [ ] Rewards tracking
- [ ] Social features

### Phase 3: Platform Growth
- [ ] Artist dashboard
- [ ] Analytics and insights
- [ ] Mobile app
- [ ] Advanced trading features

## 🎨 Customization

### Themes
Easily customize the theme by modifying:
- `tailwind.config.js` for color palette
- `src/app/globals.css` for global styles
- Component-level styling in individual files

### Branding
Update branding elements:
- Logo in `src/components/layout/Header.tsx`
- App metadata in `src/app/layout.tsx`
- Favicon and images in `public/`

### Configuration
Modify platform settings in:
- `src/lib/config.ts` for contracts and constants
- Environment variables for sensitive data

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🤝 Support

- **Documentation**: [docs.kandimusic.com](https://docs.kandimusic.com)
- **Discord**: [discord.gg/kandi](https://discord.gg/kandi)
- **Twitter**: [@KANDIMusic](https://twitter.com/KANDIMusic)
- **Email**: support@kandimusic.com

---

**Built with ❤️ for the future of music ownership**

*Powered by ERC-222 • Revolutionary NFT-Token Pairing Standard*
