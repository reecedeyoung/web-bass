import { CognitoIdentityClient, GetIdCommand } from '@aws-sdk/client-cognito-identity'
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { QueryCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'

const cognitoIdentity = new CognitoIdentityClient({})

const ACCOUNT_ID      = process.env['ACCOUNT_ID']!
const IDENTITY_POOL_ID = process.env['IDENTITY_POOL_ID']!
const USER_POOL_ID    = process.env['USER_POOL_ID']!
const REGION          = process.env['AWS_REGION']!

interface Tables { presets: string; mappings: string }

async function getIdentityId(idToken: string): Promise<string | null> {
  try {
    const result = await cognitoIdentity.send(new GetIdCommand({
      AccountId:      ACCOUNT_ID,
      IdentityPoolId: IDENTITY_POOL_ID,
      Logins: {
        [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: idToken,
      },
    }))
    return result.IdentityId ?? null
  } catch (err) {
    console.warn('migration: GetId failed, skipping migration:', err)
    return null
  }
}

export async function migrateUserIfNeeded(
  ddb: DynamoDBDocumentClient,
  userId: string,
  idToken: string,
  tables: Tables,
): Promise<void> {
  // Check if user already has data under the new (User Pool sub) key.
  // If so, migration already ran or user has no old data.
  const [presetsCount, mappingsCount] = await Promise.all([
    ddb.send(new QueryCommand({
      TableName:                 tables.presets,
      KeyConditionExpression:    'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      Select:                    'COUNT',
    })),
    ddb.send(new QueryCommand({
      TableName:                 tables.mappings,
      KeyConditionExpression:    'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      Select:                    'COUNT',
    })),
  ])

  if ((presetsCount.Count ?? 0) > 0 || (mappingsCount.Count ?? 0) > 0) return

  // Look up what the old Identity Pool key was for this user.
  const identityId = await getIdentityId(idToken)
  if (!identityId || identityId === userId) return

  // Fetch items stored under the old identityId key.
  const [oldPresets, oldMappings] = await Promise.all([
    ddb.send(new QueryCommand({
      TableName:                 tables.presets,
      KeyConditionExpression:    'userId = :uid',
      ExpressionAttributeValues: { ':uid': identityId },
    })),
    ddb.send(new QueryCommand({
      TableName:                 tables.mappings,
      KeyConditionExpression:    'userId = :uid',
      ExpressionAttributeValues: { ':uid': identityId },
    })),
  ])

  const presets  = oldPresets.Items  ?? []
  const mappings = oldMappings.Items ?? []
  if (presets.length === 0 && mappings.length === 0) return

  // Write new items first (safe to retry — PutItem is idempotent here).
  await Promise.all([
    ...presets.map(item  => ddb.send(new PutCommand({ TableName: tables.presets,  Item: { ...item,  userId } }))),
    ...mappings.map(item => ddb.send(new PutCommand({ TableName: tables.mappings, Item: { ...item, userId } }))),
  ])

  // Delete old items only after all writes succeed.
  await Promise.all([
    ...presets.map(item  => ddb.send(new DeleteCommand({ TableName: tables.presets,  Key: { userId: identityId, presetId:  item['presetId']  } }))),
    ...mappings.map(item => ddb.send(new DeleteCommand({ TableName: tables.mappings, Key: { userId: identityId, mappingId: item['mappingId'] } }))),
  ])

  console.log(`migration: moved ${presets.length} presets and ${mappings.length} mappings for user ${userId}`)
}
