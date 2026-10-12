import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { ISSUER } from './http';
import { ChatError } from './errors';

const jwks = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`), {
  timeoutDuration: 10000,
});
export async function verifyIdentity(
  token: string,
  clientId: string,
  nonce?: string,
  keys: JWTVerifyGetKey = jwks,
) {
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: ISSUER,
      audience: clientId,
      requiredClaims: ['sub', 'exp', 'iat'],
      algorithms: ['RS256'],
      clockTolerance: 5,
    });
    if (!payload.sub || (nonce !== undefined && payload.nonce !== nonce)) throw new Error();
    if (payload.azp !== undefined && payload.azp !== clientId) throw new Error();
    if (Array.isArray(payload.aud) && payload.aud.length > 1 && payload.azp !== clientId)
      throw new Error();
    return {
      subject: payload.sub,
      email: typeof payload.email === 'string' ? payload.email.slice(0, 320) : null,
    };
  } catch {
    throw new ChatError('INVALID_IDENTITY');
  }
}
