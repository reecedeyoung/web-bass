import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { validatePreset } from './validation'
import { migrateUserIfNeeded } from './migration'
import { err, json } from './index'

const TABLE      = process.env['PRESETS_TABLE']!
const MAX_PRESETS = 50

export async function handlePresets(
  event: APIGatewayProxyEventV2,
  userId: string,
  idToken: string,
  ddb: DynamoDBDocumentClient,
  tables: { presets: string; mappings: string },
): Promise<APIGatewayProxyResultV2> {
  const method   = event.requestContext.http.method
  const presetId = event.pathParameters?.['presetId']

  if (method === 'GET') {
    await migrateUserIfNeeded(ddb, userId, idToken, tables)
    const result = await ddb.send(new QueryCommand({
      TableName:                 TABLE,
      KeyConditionExpression:    'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    }))
    return json((result.Items ?? []).map(item => ({
      id:          item['presetId']    as string,
      name:        item['name']        as string,
      description: item['description'] as string | undefined,
      params:      item['params'],
    })))
  }

  if (method === 'PUT' && presetId) {
    if (!event.body) return err(400, 'Missing body')
    let preset: unknown
    try { preset = JSON.parse(event.body) } catch { return err(400, 'Invalid JSON') }

    const validationError = validatePreset(preset)
    if (validationError) return err(400, validationError)

    // Check item count — allow update of existing preset without counting against limit.
    const existing = await ddb.send(new QueryCommand({
      TableName:                 TABLE,
      KeyConditionExpression:    'userId = :uid AND presetId = :pid',
      ExpressionAttributeValues: { ':uid': userId, ':pid': presetId },
      Select:                    'COUNT',
    }))
    if ((existing.Count ?? 0) === 0) {
      const total = await ddb.send(new QueryCommand({
        TableName:                 TABLE,
        KeyConditionExpression:    'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
        Select:                    'COUNT',
      }))
      if ((total.Count ?? 0) >= MAX_PRESETS) return err(429, `Preset limit (${MAX_PRESETS}) reached`)
    }

    const p = preset as { id: string; name: string; description?: string; params: unknown }
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: { userId, presetId, name: p.name, description: p.description, params: p.params },
    }))
    return { statusCode: 204, body: '' }
  }

  if (method === 'DELETE' && presetId) {
    await ddb.send(new DeleteCommand({
      TableName:           TABLE,
      Key:                 { userId, presetId },
      ConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    }))
    return { statusCode: 204, body: '' }
  }

  return err(405, 'Method not allowed')
}
