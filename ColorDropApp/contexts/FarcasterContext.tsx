'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  custodyAddress: string
  connectedAddress?: string
  bio?: string
  followerCount?: number
  followingCount?: number
}

interface FarcasterContextType {
  user: FarcasterUser | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  isInMiniApp: boolean
  signIn: () => Promise<void>
  signOut: () => void
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined)

export function useFarcaster() {
  const context = useContext(FarcasterContext)
  if (context === undefined) {
    throw new Error('useFarcaster must be used within a FarcasterProvider')
  }
  return context
}

interface FarcasterProviderProps {
  children: ReactNode
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInMiniApp, setIsInMiniApp] = useState(false)

  const signIn = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[FarcasterContext] Checking Mini App environment...')

      // Get SDK context first
      console.log('[FarcasterContext] Getting SDK context...')
      const context = await sdk.context
      console.log('[FarcasterContext] SDK context:', context)

      // 3-method environment detection (like ZodiacCards)
      // Method 1: Official SDK method
      const sdkIsInMiniApp = await sdk.isInMiniApp()

      // Method 2: Context-based detection
      const contextCheck = context as { client?: { clientFid?: number }, isMinApp?: boolean, miniApp?: unknown }
      const hasContext = !!(
        contextCheck?.client?.clientFid ||
        contextCheck?.isMinApp ||
        contextCheck?.miniApp
      )

      // Method 3: User agent check for Farcaster mobile
      const userAgentCheck = typeof navigator !== 'undefined' &&
        navigator.userAgent.includes('Farcaster')

      // Combined detection - any method returning true means we're in Farcaster
      const isFarcasterEnv = sdkIsInMiniApp || hasContext || userAgentCheck

      console.log('[FarcasterContext] Environment detection:', {
        sdkIsInMiniApp,
        hasContext,
        clientFid: contextCheck?.client?.clientFid,
        isMinApp: contextCheck?.isMinApp,
        miniApp: contextCheck?.miniApp,
        userAgentCheck,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
        finalResult: isFarcasterEnv
      })

      setIsInMiniApp(isFarcasterEnv)

      if (!isFarcasterEnv) {
        console.log('[FarcasterContext] Not in Farcaster environment - no Farcaster user available')
        setUser(null)
        setLoading(false)
        return
      }

      console.log('[FarcasterContext] Running in Farcaster environment')

      if (!context?.user && !context?.client) {
        console.log('[FarcasterContext] No user context available from SDK')
        setUser(null)
        setLoading(false)
        return
      }

      // Extract user data from context
      // Use type assertion since SDK types may be incomplete
      const contextUser = context.user as {
        fid?: number
        username?: string
        displayName?: string
        pfpUrl?: string
        custodyAddress?: string
        verifications?: string[]
        bio?: string
        followerCount?: number
        followingCount?: number
      } | undefined

      const farcasterUser: FarcasterUser = {
        fid: contextUser?.fid || (context.client as { clientFid?: number })?.clientFid || 0,
        username: contextUser?.username || 'user',
        displayName: contextUser?.displayName || contextUser?.username || 'User',
        pfpUrl: contextUser?.pfpUrl || '/placeholder.svg',
        custodyAddress: contextUser?.custodyAddress || '0x0000000000000000000000000000000000000000',
        connectedAddress: contextUser?.verifications?.[0] || contextUser?.custodyAddress,
        bio: contextUser?.bio,
        followerCount: contextUser?.followerCount,
        followingCount: contextUser?.followingCount,
      }

      console.log('[FarcasterContext] Farcaster user loaded:', {
        fid: farcasterUser.fid,
        username: farcasterUser.username,
        connectedAddress: farcasterUser.connectedAddress
      })
      setUser(farcasterUser)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      setError(errorMessage)
      console.error('[FarcasterContext] Error:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    setError(null)
  }

  useEffect(() => {
    // Auto-initialize when component mounts
    signIn()
  }, [])

  // User is authenticated if we have a valid fid (> 0)
  const isAuthenticated = !!(user && user.fid > 0)

  const value: FarcasterContextType = {
    user,
    loading,
    error,
    isAuthenticated,
    isInMiniApp,
    signIn,
    signOut,
  }

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  )
}
