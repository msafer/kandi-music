'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { createWeb3Modal } from '@web3modal/wagmi'
import { config, projectId } from '@/lib/config'

// Setup queryClient
const queryClient = new QueryClient()

// Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  enableOnramp: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#6366f1',
    '--w3m-color-mix-strength': 40,
    '--w3m-accent': '#6366f1',
    '--w3m-border-radius-master': '8px',
  }
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}