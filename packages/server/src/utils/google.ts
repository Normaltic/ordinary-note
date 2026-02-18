import { OAuth2Client } from 'google-auth-library';
import { config } from './config.js';

const client = new OAuth2Client(config.google.clientId);

export async function verifyGoogleIdToken(credential: string) {
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: config.google.clientId,
  });
  return ticket.getPayload();
}
