import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider'

let cachedToken: string | null = null

export async function getIdToken(): Promise<string> {
  if (cachedToken) return cachedToken

  const client = new CognitoIdentityProviderClient({ region: 'us-east-1' })
  const resp = await client.send(new InitiateAuthCommand({
    AuthFlow:   'USER_PASSWORD_AUTH',
    ClientId:   process.env['COGNITO_USER_POOL_CLIENT_ID']!,
    AuthParameters: {
      USERNAME: process.env['TEST_USER_EMAIL']!,
      PASSWORD: process.env['TEST_USER_PASSWORD']!,
    },
  }))

  if (!resp.AuthenticationResult?.IdToken) {
    throw new Error('Cognito did not return an IdToken — check test user credentials')
  }

  cachedToken = resp.AuthenticationResult.IdToken
  return cachedToken
}
