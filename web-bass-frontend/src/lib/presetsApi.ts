import { QueryCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { getDynamoClient, getAuthenticatedUserId } from './dynamodb'
import type { Preset } from '../presets/types'

const TABLE = import.meta.env.VITE_PRESETS_TABLE as string | undefined

export async function fetchPresets(): Promise<Preset[]> {
  if (!TABLE) return []
  const [client, userId] = await Promise.all([getDynamoClient(), getAuthenticatedUserId()])
  const result = await client.send(new QueryCommand({
    TableName:                 TABLE,
    KeyConditionExpression:    'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }))
  return (result.Items ?? []).map(item => ({
    id:          item['presetId'] as string,
    name:        item['name']     as string,
    description: item['description'] as string | undefined,
    params:      item['params']   as Preset['params'],
  }))
}

export async function putPreset(preset: Preset): Promise<void> {
  if (!TABLE) return
  const [client, userId] = await Promise.all([getDynamoClient(), getAuthenticatedUserId()])
  await client.send(new PutCommand({
    TableName: TABLE,
    Item: {
      userId,
      presetId:    preset.id,
      name:        preset.name,
      description: preset.description,
      params:      preset.params,
    },
  }))
}

export async function removePreset(presetId: string): Promise<void> {
  if (!TABLE) return
  const [client, userId] = await Promise.all([getDynamoClient(), getAuthenticatedUserId()])
  await client.send(new DeleteCommand({
    TableName: TABLE,
    Key: { userId, presetId },
  }))
}
