import { Amplify } from 'aws-amplify'

export function configureAmplify(): void {
  const rawDomain = import.meta.env.VITE_COGNITO_DOMAIN as string | undefined
  const domain = rawDomain?.replace(/^https?:\/\//, '')

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId:       import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID    as string,
        identityPoolId:   import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID as string,
        loginWith: domain ? {
          oauth: {
            domain,
            scopes:          ['email', 'openid', 'profile'],
            redirectSignIn:  [window.location.origin],
            redirectSignOut: [window.location.origin],
            responseType:    'code',
          },
        } : undefined,
      },
    },
  })
}
