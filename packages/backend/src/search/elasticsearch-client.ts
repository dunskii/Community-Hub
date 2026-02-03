import { Client } from '@elastic/elasticsearch';

let client: Client | null = null;

export function getEsClient(): Client {
  if (!client) {
    const node = process.env['ELASTICSEARCH_URL'] ?? 'http://localhost:9200';
    const apiKey = process.env['ELASTICSEARCH_API_KEY'];

    // TLS configuration is handled by the ES_URL scheme (https://) and
    // Node.js system CA certificates. Custom CA can be added via NODE_EXTRA_CA_CERTS.
    client = new Client({
      node,
      ...(apiKey && { auth: { apiKey } }),
    });
  }
  return client;
}

export async function esHealthCheck(): Promise<boolean> {
  try {
    await getEsClient().ping();
    return true;
  } catch {
    return false;
  }
}

export async function closeEsClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
