import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { handlePresets } from './presets'
import { handleMappings } from './mappings'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

const TABLES = {
  presets:  process.env['PRESETS_TABLE']!,
  mappings: process.env['KEYBOARD_MAPPINGS_TABLE']!,
}

export function err(status: number, message: string): APIGatewayProxyResultV2 {
  return {
    statusCode: status,
    headers:    { 'Content-Type': 'application/json' },
    body:       JSON.stringify({ error: message }),
  }
}

export function json(body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode: 200,
    headers:    { 'Content-Type': 'application/json' },
    body:       JSON.stringify(body),
  }
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const userId = event.requestContext.authorizer?.jwt?.claims?.['sub'] as string | undefined
  if (!userId) return err(401, 'Unauthorized')

  // Raw ID token — needed by the lazy migration to call Cognito Identity GetId.
  const idToken = (event.headers['authorization'] ?? '').replace(/^Bearer\s+/i, '')

  const path = event.rawPath

  try {
    if (path.startsWith('/api/presets'))  return await handlePresets(event, userId, idToken, ddb, TABLES)
    if (path.startsWith('/api/mappings')) return await handleMappings(event, userId, idToken, ddb, TABLES)
    return err(404, 'Not found')
  } catch (e) {
    console.error('Unhandled error', e)
    return err(500, 'Internal server error')
  }
}
