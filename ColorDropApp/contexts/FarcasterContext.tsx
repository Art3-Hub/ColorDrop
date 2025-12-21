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

      // Step 1: Use official SDK method for environment detection
      // This is fast (~100ms timeout) and handles all edge cases internally
      // See: https://miniapps.farcaster.xyz/docs/sdk/is-in-mini-app
      const isMiniApp = await sdk.isInMiniApp()
      console.log('[FarcasterContext] sdk.isInMiniApp():', isMiniApp)

      setIsInMiniApp(isMiniApp)

      if (!isMiniApp) {
        console.log('[FarcasterContext] Not in Mini App - browser mode')
        setUser(null)
        setLoading(false)
        return
      }

      // Step 2: Only fetch context if we're in a Mini App
      // Context is automatically available, no auth needed
      console.log('[FarcasterContext] In Mini App, fetching context...')
      const context = await sdk.context

      if (!context?.user) {
        console.log('[FarcasterContext] No user in context')
        setUser(null)
        setLoading(false)
        return
      }

      // Step 3: Extract user data from context
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
      }

      const farcasterUser: FarcasterUser = {
        fid: contextUser?.fid || 0,
        username: contextUser?.username || 'user',
        displayName: contextUser?.displayName || contextUser?.username || 'User',
        pfpUrl: contextUser?.pfpUrl || '/placeholder.svg',
        custodyAddress: contextUser?.custodyAddress || '0x0000000000000000000000000000000000000000',
        connectedAddress: contextUser?.verifications?.[0] || contextUser?.custodyAddress,
        bio: contextUser?.bio,
        followerCount: contextUser?.followerCount,
        followingCount: contextUser?.followingCount,
      }

      console.log('[FarcasterContext] User loaded:', farcasterUser.username, 'fid:', farcasterUser.fid)
      setUser(farcasterUser)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      setError(errorMessage)
      console.error('[FarcasterContext] Error:', err)
      setUser(null)
      // On error, assume not in mini app for safety
      setIsInMiniApp(false)
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
