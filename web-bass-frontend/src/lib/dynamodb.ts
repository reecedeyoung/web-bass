import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { fetchAuthSession } from 'aws-amplify/auth'

export async function getDynamoClient(): Promise<DynamoDBDocumentClient> {
  const session = await fetchAuthSession()
  const client = new DynamoDBClient({
    region:      (import.meta.env.VITE_AWS_REGION as string | undefined) ?? 'us-east-1',
    credentials: session.credentials,
  })
  return DynamoDBDocumentClient.from(client)
}
