import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { validateMapping } from './validation'
import { migrateUserIfNeeded } from './migration'
import { err, json } from './index'

const TABLE           = process.env['KEYBOARD_MAPPINGS_TABLE']!
const MAX_BODY_BYTES  = 32_768

export async function handleMappings(
  event: APIGatewayProxyEventV2,
  userId: string,
  idToken: string,
  ddb: DynamoDBDocumentClient,
  tables: { presets: string; mappings: string },
): Promise<APIGatewayProxyResultV2> {
  const method    = event.requestContext.http.method
  const mappingId = event.pathParameters?.['mappingId']

  if (method === 'GET') {
    await migrateUserIfNeeded(ddb, userId, idToken, tables)
    const result = await ddb.send(new QueryCommand({
      TableName:                 TABLE,
      KeyConditionExpression:    'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    }))
    return json((result.Items ?? []).map(item => ({
      name:        item['name']        as string,
      description: item['description'] as string | undefined,
      version:     item['version']     as number | undefined,
      mappings:    item['mappings'],
    })))
  }

  if (method === 'PUT' && mappingId) {
    if (!event.body) return err(400, 'Missing body')
    if (Buffer.byteLength(event.body, 'utf8') > MAX_BODY_BYTES) return err(413, 'Payload too large')
    let mapping: unknown
    try { mapping = JSON.parse(event.body) } catch { return err(400, 'Invalid JSON') }

    const validationError = validateMapping(mapping)
    if (validationError) return err(400, validationError)

    const m = mapping as { name: string; description?: string; version?: number; mappings: unknown }
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: { userId, mappingId, name: m.name, description: m.description, version: m.version, mappings: m.mappings },
    }))
    return { statusCode: 204, body: '' }
  }

  return err(405, 'Method not allowed')
}
