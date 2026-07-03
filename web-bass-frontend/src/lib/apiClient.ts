import { fetchAuthSession } from 'aws-amplify/auth'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const session = await fetchAuthSession()
  const token   = session.tokens?.idToken?.toString()
  if (!token) throw new Error('Not authenticated')

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
}
