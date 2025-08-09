import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi'
import { contracts } from '@/lib/config'
import { formatUnits, parseUnits } from 'viem'

// Contract ABIs (simplified - in production, import from generated types)
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

const MINT_ROUTER_ABI = [
  {
    name: 'mintWithGHO',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'songName', type: 'string' },
      { name: 'quantity', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'mintWithKANDI',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'songName', type: 'string' },
      { name: 'quantity', type: 'uint256' },
      { name: 'maxKandiAmount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'calculateMintCost',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'songName', type: 'string' },
      { name: 'quantity', type: 'uint256' },
    ],
    outputs: [
      { name: 'totalCost', type: 'uint256' },
      { name: 'platformFee', type: 'uint256' },
      { name: 'netAmount', type: 'uint256' },
    ],
  },
  {
    name: 'getSongRelease',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'songName', type: 'string' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'nftContract', type: 'address' },
          { name: 'tokenContract', type: 'address' },
          { name: 'vaultContract', type: 'address' },
          { name: 'mintPrice', type: 'uint256' },
          { name: 'maxMintsPerTx', type: 'uint256' },
          { name: 'mintEnabled', type: 'bool' },
          { name: 'exists', type: 'bool' },
        ],
      },
    ],
  },
] as const

const KANDI_ABI = [
  ...ERC20_ABI,
  {
    name: 'swapToGHO',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'kandiAmount', type: 'uint256' }],
    outputs: [{ name: 'ghoAmount', type: 'uint256' }],
  },
  {
    name: 'purchaseTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'ghoAmount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claimAirdrop',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'getAirdropInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalAmount', type: 'uint256' },
      { name: 'claimedAmount', type: 'uint256' },
      { name: 'claimableAmount', type: 'uint256' },
      { name: 'unlockTime', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
    ],
  },
] as const

// Hook to get current contract addresses
export function useContractAddresses() {
  const chainId = useChainId()
  return contracts[chainId as keyof typeof contracts] || contracts[1] // Fallback to mainnet
}

// GHO Token hooks
export function useGHOBalance() {
  const { address } = useAccount()
  const contractAddresses = useContractAddresses()

  return useReadContract({
    address: contractAddresses.gho as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  })
}

export function useGHOAllowance(spender: string) {
  const { address } = useAccount()
  const contractAddresses = useContractAddresses()

  return useReadContract({
    address: contractAddresses.gho as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && spender ? [address, spender as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!spender,
      refetchInterval: 5000,
    },
  })
}

export function useApproveGHO() {
  const contractAddresses = useContractAddresses()
  
  return useWriteContract({
    address: contractAddresses.gho as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'approve',
  })
}

// KANDI Token hooks
export function useKANDIBalance() {
  const { address } = useAccount()
  const contractAddresses = useContractAddresses()

  return useReadContract({
    address: contractAddresses.kandi as `0x${string}`,
    abi: KANDI_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  })
}

export function useKANDIAirdropInfo() {
  const { address } = useAccount()
  const contractAddresses = useContractAddresses()

  return useReadContract({
    address: contractAddresses.kandi as `0x${string}`,
    abi: KANDI_ABI,
    functionName: 'getAirdropInfo',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  })
}

export function useSwapKANDIToGHO() {
  const contractAddresses = useContractAddresses()
  
  return useWriteContract({
    address: contractAddresses.kandi as `0x${string}`,
    abi: KANDI_ABI,
    functionName: 'swapToGHO',
  })
}

export function useClaimAirdrop() {
  const contractAddresses = useContractAddresses()
  
  return useWriteContract({
    address: contractAddresses.kandi as `0x${string}`,
    abi: KANDI_ABI,
    functionName: 'claimAirdrop',
  })
}

// Mint Router hooks
export function useSongRelease(songName: string) {
  const contractAddresses = useContractAddresses()

  return useReadContract({
    address: contractAddresses.mintRouter as `0x${string}`,
    abi: MINT_ROUTER_ABI,
    functionName: 'getSongRelease',
    args: [songName],
    query: {
      enabled: !!songName,
      refetchInterval: 15000,
    },
  })
}

export function useMintCost(songName: string, quantity: number) {
  const contractAddresses = useContractAddresses()

  return useReadContract({
    address: contractAddresses.mintRouter as `0x${string}`,
    abi: MINT_ROUTER_ABI,
    functionName: 'calculateMintCost',
    args: [songName, BigInt(quantity)],
    query: {
      enabled: !!songName && quantity > 0,
      refetchInterval: 30000,
    },
  })
}

export function useMintWithGHO() {
  const contractAddresses = useContractAddresses()
  
  return useWriteContract({
    address: contractAddresses.mintRouter as `0x${string}`,
    abi: MINT_ROUTER_ABI,
    functionName: 'mintWithGHO',
  })
}

export function useMintWithKANDI() {
  const contractAddresses = useContractAddresses()
  
  return useWriteContract({
    address: contractAddresses.mintRouter as `0x${string}`,
    abi: MINT_ROUTER_ABI,
    functionName: 'mintWithKANDI',
  })
}

// Utility hooks
export function useTokenBalance(tokenAddress: string, decimals: number = 18) {
  const { address } = useAccount()

  const { data, ...rest } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress,
      refetchInterval: 10000,
    },
  })

  const formattedBalance = data ? formatUnits(data, decimals) : '0'

  return {
    data: formattedBalance,
    raw: data,
    ...rest,
  }
}

export function useFormattedBalance(balance: bigint | undefined, decimals: number = 18) {
  if (!balance) return '0'
  return formatUnits(balance, decimals)
}

export function useParseAmount(amount: string, decimals: number = 18) {
  try {
    return parseUnits(amount, decimals)
  } catch {
    return BigInt(0)
  }
}

// Combined hooks for common workflows
export function useMintWorkflow(songName: string, quantity: number, paymentMethod: 'gho' | 'kandi') {
  const contractAddresses = useContractAddresses()
  const { address } = useAccount()

  // Get mint cost
  const { data: mintCostData } = useMintCost(songName, quantity)
  
  // Get token balances
  const { data: ghoBalance } = useGHOBalance()
  const { data: kandiBalance } = useKANDIBalance()
  
  // Get allowances
  const { data: ghoAllowance } = useGHOAllowance(contractAddresses.mintRouter)
  
  // Write functions
  const { writeContract: approveGHO, isPending: isApprovingGHO } = useApproveGHO()
  const { writeContract: mintWithGHO, isPending: isMintingWithGHO } = useMintWithGHO()
  const { writeContract: mintWithKANDI, isPending: isMintingWithKANDI } = useMintWithKANDI()

  const totalCost = mintCostData?.[0] || BigInt(0)
  const needsApproval = paymentMethod === 'gho' && ghoAllowance !== undefined && ghoAllowance < totalCost
  const hasInsufficientBalance = paymentMethod === 'gho' 
    ? (ghoBalance || BigInt(0)) < totalCost
    : (kandiBalance || BigInt(0)) < totalCost

  const executeApproval = () => {
    if (paymentMethod === 'gho') {
      approveGHO({
        args: [contractAddresses.mintRouter as `0x${string}`, totalCost],
      })
    }
  }

  const executeMint = () => {
    if (paymentMethod === 'gho') {
      mintWithGHO({
        args: [songName, BigInt(quantity)],
      })
    } else {
      mintWithKANDI({
        args: [songName, BigInt(quantity), totalCost], // Using totalCost as max KANDI amount
      })
    }
  }

  return {
    // Data
    totalCost,
    ghoBalance: ghoBalance || BigInt(0),
    kandiBalance: kandiBalance || BigInt(0),
    ghoAllowance: ghoAllowance || BigInt(0),
    
    // States
    needsApproval,
    hasInsufficientBalance,
    isApprovingGHO,
    isMintingWithGHO,
    isMintingWithKANDI,
    isPending: isApprovingGHO || isMintingWithGHO || isMintingWithKANDI,
    
    // Actions
    executeApproval,
    executeMint,
  }
}