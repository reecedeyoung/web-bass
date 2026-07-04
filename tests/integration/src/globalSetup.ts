import { config } from 'dotenv'

export function setup() {
  // Load .env.test.local for local runs; CI injects vars directly
  config({ path: '.env.test.local', override: false })

  const required = [
    'TEST_USER_EMAIL',
    'TEST_USER_PASSWORD',
    'COGNITO_USER_POOL_CLIENT_ID',
    'API_BASE_URL',
  ]
  const missing = required.filter(k => !process.env[k])
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`)
  }
}
