import { AwsRum } from 'aws-rum-web'

let rum: AwsRum | undefined

export function initRum(): void {
  const appMonitorId  = import.meta.env.VITE_RUM_APP_MONITOR_ID  as string | undefined
  const identityPoolId = import.meta.env.VITE_RUM_IDENTITY_POOL_ID as string | undefined
  const region        = import.meta.env.VITE_AWS_REGION           as string | undefined

  if (!appMonitorId || !identityPoolId || !region) return

  try {
    rum = new AwsRum(appMonitorId, '1.0.0', region, {
      sessionSampleRate: 1,
      identityPoolId,
      endpoint:    `https://dataplane.rum.${region}.amazonaws.com`,
      telemetries: ['errors', 'http', 'performance'],
      allowCookies: true,
    })
  } catch {
    // RUM is non-critical — never let it break the app
  }
}

export function recordRumEvent(type: string, data: Record<string, unknown>): void {
  try { rum?.recordEvent(type, data) } catch { /* ignore */ }
}
