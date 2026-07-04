import { getIdToken } from './auth'

function base() {
  return process.env['API_BASE_URL']!
}

export async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getIdToken()
  return fetch(`${base()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
}

export function anonFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${base()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}
