import { useEffect, useRef, useState } from 'react'
import {
  signUp,
  confirmSignUp,
  signIn,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
} from 'aws-amplify/auth'
import { useAuth } from '../../context/AuthContext'
import type { SocialProvider } from '../../context/AuthContext'
import './LoginModal.css'

// ── Social providers ────────────────────────────────────────────────────────

interface ProviderConfig { id: SocialProvider; label: string; icon: React.ReactNode; enabled: boolean }

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'Google', label: 'Continue with Google', enabled: false,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84-.66-.68z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'Apple', label: 'Continue with Apple', enabled: false,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zm3.378-3.066c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702z"/>
      </svg>
    ),
  },
  {
    id: 'Microsoft', label: 'Continue with Microsoft', enabled: false,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#f25022" d="M1 1h10v10H1z"/>
        <path fill="#00a4ef" d="M13 1h10v10H13z"/>
        <path fill="#7fba00" d="M1 13h10v10H1z"/>
        <path fill="#ffb900" d="M13 13h10v10H13z"/>
      </svg>
    ),
  },
  {
    id: 'Facebook', label: 'Continue with Facebook', enabled: false,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
      </svg>
    ),
  },
]

// ── Error mapping ───────────────────────────────────────────────────────────

function friendlyError(err: unknown): string {
  const name = (err as { name?: string }).name ?? ''
  const message = (err as { message?: string }).message ?? 'Something went wrong.'
  switch (name) {
    case 'UsernameExistsException':    return 'An account with this email already exists.'
    case 'UserNotConfirmedException':  return 'Please verify your email before signing in.'
    case 'NotAuthorizedException':     return 'Incorrect email or password.'
    case 'UserNotFoundException':      return 'No account found with this email.'
    case 'InvalidPasswordException':   return 'Password doesn\'t meet the requirements.'
    case 'CodeMismatchException':      return 'Incorrect verification code.'
    case 'ExpiredCodeException':       return 'Verification code has expired. Request a new one.'
    case 'LimitExceededException':     return 'Too many attempts. Please try again later.'
    case 'InvalidParameterException':  return 'Please check your input and try again.'
    default:                           return message
  }
}

// ── View types ──────────────────────────────────────────────────────────────

type View = 'providers' | 'sign-in' | 'sign-up' | 'verify' | 'forgot' | 'reset'

// ── Main component ──────────────────────────────────────────────────────────

export default function LoginModal() {
  const { closeLoginModal, signInWithProvider } = useAuth()

  const [view,            setView]            = useState<View>('providers')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code,            setCode]            = useState('')
  const [error,           setError]           = useState<string | null>(null)
  const [isSubmitting,    setIsSubmitting]    = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeLoginModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeLoginModal])

  useEffect(() => {
    setError(null)
    // Small delay so the new view has rendered before focusing
    const t = setTimeout(() => firstInputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [view])

  function goTo(v: View) {
    setError(null)
    setCode('')
    setView(v)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await signIn({ username: email, password })
      // AuthContext Hub listener closes the modal on signedIn event
    } catch (err) {
      if ((err as { name?: string }).name === 'UserNotConfirmedException') {
        await resendSignUpCode({ username: email })
        goTo('verify')
      } else {
        setError(friendlyError(err))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsSubmitting(true)
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email } },
      })
      goTo('verify')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await confirmSignUp({ username: email, confirmationCode: code })
      await signIn({ username: email, password })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResendCode() {
    setError(null)
    try {
      await resendSignUpCode({ username: email })
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await resetPassword({ username: email })
      goTo('reset')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsSubmitting(true)
    try {
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword: password })
      goTo('sign-in')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────

  function BackLink({ to, label = 'Back' }: { to: View; label?: string }) {
    return (
      <button type="button" className="lm-back" onClick={() => goTo(to)}>
        ← {label}
      </button>
    )
  }

  function ErrorMsg() {
    return error ? <p className="lm-error" role="alert">{error}</p> : null
  }

  // ── Views ───────────────────────────────────────────────────────────────

  const views: Record<View, React.ReactNode> = {

    providers: (
      <>
        <h2 className="lm-title">Sign in to Web Bass</h2>
        <p className="lm-subtitle">Save and load your presets and control mappings across devices.</p>
        <div className="lm-providers">
          {PROVIDERS.map(({ id, label, icon, enabled }) => (
            <button
              key={id}
              className="lm-provider-btn"
              disabled={!enabled}
              onClick={() => enabled && signInWithProvider(id)}
              aria-label={enabled ? label : `${label} (coming soon)`}
            >
              <span className="lm-provider-icon">{icon}</span>
              <span className="lm-provider-label">{label}</span>
            </button>
          ))}
        </div>
        <div className="lm-divider"><span>or</span></div>
        <div className="lm-email-options">
          <button className="lm-email-btn" onClick={() => goTo('sign-in')}>Sign in with email</button>
          <button className="lm-email-btn lm-email-btn--secondary" onClick={() => goTo('sign-up')}>Create an account</button>
        </div>
      </>
    ),

    'sign-in': (
      <>
        <BackLink to="providers" />
        <h2 className="lm-title">Sign in</h2>
        <form className="lm-form" onSubmit={handleSignIn} noValidate>
          <div className="lm-field">
            <label className="lm-label" htmlFor="lm-email">Email</label>
            <input
              ref={firstInputRef}
              id="lm-email"
              className="lm-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="lm-field">
            <label className="lm-label" htmlFor="lm-password">Password</label>
            <input
              id="lm-password"
              className="lm-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <ErrorMsg />
          <button className="lm-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="lm-form-footer">
          <button type="button" className="lm-link" onClick={() => goTo('forgot')}>Forgot password?</button>
          <span className="lm-form-footer-sep" />
          <button type="button" className="lm-link" onClick={() => goTo('sign-up')}>Create an account</button>
        </div>
      </>
    ),

    'sign-up': (
      <>
        <BackLink to="providers" />
        <h2 className="lm-title">Create an account</h2>
        <form className="lm-form" onSubmit={handleSignUp} noValidate>
          <div className="lm-field">
            <label className="lm-label" htmlFor="lm-su-email">Email</label>
            <input
              ref={firstInputRef}
              id="lm-su-email"
              className="lm-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="lm-field">
            <label className="lm-label" htmlFor="lm-su-password">Password</label>
            <input
              id="lm-su-password"
              className="lm-input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <span className="lm-hint">8+ characters, uppercase, lowercase, and number.</span>
          </div>
          <div className="lm-field">
            <label className="lm-label" htmlFor="lm-su-confirm">Confirm password</label>
            <input
              id="lm-su-confirm"
              className="lm-input"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <ErrorMsg />
          <button className="lm-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <div className="lm-form-footer">
          Already have an account?
          <button type="button" className="lm-link" onClick={() => goTo('sign-in')}>Sign in</button>
        </div>
      </>
    ),

    verify: (
      <>
        <h2 className="lm-title">Check your email</h2>
        <p className="lm-subtitle">We sent a verification code to <strong>{email}</strong>.</p>
        <form className="lm-form" onSubmit={handleVerify} noValidate>
          <div className="lm-field">
            <label className="lm-label" htmlFor="lm-code">Verification code</label>
            <input
              ref={firstInputRef}
              id="lm-code"
              className="lm-input lm-input--code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>
          <ErrorMsg />
          <button className="lm-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying…' : 'Verify email'}
          </button>
        </form>
        <div className="lm-form-footer">
          Didn't receive it?
          <button type="button" className="lm-link" onClick={handleResendCode}>Resend code</button>
        </div>
      </>
    ),

    forgot: (
      <>
        <BackLink to="sign-in" label="Back to sign in" />
        <h2 className="lm-title">Reset password</h2>
        <p className="lm-subtitle">Enter your email and we'll send you a reset code.</p>
        <form className="lm-form" onSubmit={handleForgot} noValidate>
          <div className="lm-field">
            <label className="lm-label" htmlFor="lm-forgot-email">Email</label>
            <input
              ref={firstInputRef}
              id="lm-forgot-email"
              className="lm-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <ErrorMsg />
          <button className="lm-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send reset code'}
          </button>
        </form>
      </>
    ),

    reset: (
      <>
        <h2 className="lm-title">Set new password</h2>
        <p className="lm-subtitle">Enter the code sent to <strong>{email}</strong> and choose a new password.</p>
        <form className="lm-form" onSubmit={handleReset} noValidate>
          <div className="lm-field">
            <label className="lm-label" htmlFor="lm-reset-code">Reset code</label>
            <input
              ref={firstInputRef}
              id="lm-reset-code"
              className="lm-input lm-input--code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>
          <div className="lm-field">
            <label className="lm-label" htmlFor="lm-reset-password">New password</label>
            <input
              id="lm-reset-password"
              className="lm-input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <span className="lm-hint">8+ characters, uppercase, lowercase, and number.</span>
          </div>
          <div className="lm-field">
            <label className="lm-label" htmlFor="lm-reset-confirm">Confirm new password</label>
            <input
              id="lm-reset-confirm"
              className="lm-input"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <ErrorMsg />
          <button className="lm-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      </>
    ),
  }

  return (
    <div className="lm-overlay" onClick={closeLoginModal} role="dialog" aria-modal="true" aria-label="Sign in">
      <div className="lm-card" onClick={e => e.stopPropagation()}>
        <button className="lm-close" onClick={closeLoginModal} aria-label="Close">×</button>
        {views[view]}
      </div>
    </div>
  )
}
