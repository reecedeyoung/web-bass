import { createContext, useContext, useEffect, useState } from 'react'
import {
  getCurrentUser,
  fetchAuthSession,
  signInWithRedirect,
  signOut as amplifySignOut,
} from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'

export type SocialProvider = 'Google' | 'Facebook' | 'Apple' | 'Microsoft'

interface AuthUser {
  username: string
  displayName: string
}

interface AuthContextValue {
  user:              AuthUser | null
  identityId:        string | null
  isAuthenticated:   boolean
  isLoading:         boolean
  showLoginModal:    boolean
  openLoginModal:    () => void
  closeLoginModal:   () => void
  signInWithProvider:(provider: SocialProvider) => void
  signOut:           () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,           setUser]           = useState<AuthUser | null>(null)
  const [identityId,     setIdentityId]     = useState<string | null>(null)
  const [isLoading,      setIsLoading]      = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)

  async function loadSession() {
    try {
      const [cognitoUser, session] = await Promise.all([
        getCurrentUser(),
        fetchAuthSession(),
      ])
      const email = session.tokens?.idToken?.payload?.['email'] as string | undefined
      setUser({
        username:    cognitoUser.username,
        displayName: email ?? cognitoUser.username,
      })
      setIdentityId(session.identityId ?? null)
    } catch {
      setUser(null)
      setIdentityId(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSession()

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        loadSession()
        setShowLoginModal(false)
      } else if (payload.event === 'signedOut') {
        setUser(null)
        setIdentityId(null)
      }
    })

    return unsubscribe
  }, [])

  function signInWithProvider(provider: SocialProvider) {
    if (provider === 'Microsoft') {
      signInWithRedirect({ provider: { custom: 'Microsoft' } })
    } else {
      signInWithRedirect({ provider: provider as 'Google' | 'Facebook' | 'Apple' })
    }
  }

  async function signOut() {
    await amplifySignOut()
  }

  return (
    <AuthContext.Provider value={{
      user,
      identityId,
      isAuthenticated:    user !== null,
      isLoading,
      showLoginModal,
      openLoginModal:     () => setShowLoginModal(true),
      closeLoginModal:    () => setShowLoginModal(false),
      signInWithProvider,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
