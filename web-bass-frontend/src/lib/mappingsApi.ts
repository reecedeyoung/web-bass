import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { getDynamoClient, getAuthenticatedUserId } from './dynamodb'
import type { KeyMapping } from '../mappings/types'

const TABLE = import.meta.env.VITE_MAPPINGS_TABLE as string | undefined

export async function fetchMappings(): Promise<KeyMapping[]> {
  if (!TABLE) return []
  const [client, userId] = await Promise.all([getDynamoClient(), getAuthenticatedUserId()])
  const result = await client.send(new QueryCommand({
    TableName:                 TABLE,
    KeyConditionExpression:    'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }))
  return (result.Items ?? []).map(item => ({
    name:        item['name']        as string,
    description: item['description'] as string | undefined,
    version:     item['version']     as number | undefined,
    mappings:    item['mappings']    as KeyMapping['mappings'],
  }))
}

export async function putMapping(mappingId: string, mapping: KeyMapping): Promise<void> {
  if (!TABLE) return
  const [client, userId] = await Promise.all([getDynamoClient(), getAuthenticatedUserId()])
  await client.send(new PutCommand({
    TableName: TABLE,
    Item: {
      userId,
      mappingId,
      name:        mapping.name,
      description: mapping.description,
      version:     mapping.version,
      mappings:    mapping.mappings,
    },
  }))
}
