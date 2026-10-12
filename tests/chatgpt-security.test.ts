import { describe, expect, it, beforeAll } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { parseCallback, authorize } from '../sidecar/src/chatgpt/oauth';
import { verifyIdentity } from '../sidecar/src/chatgpt/identity';
import { consumeStream } from '../sidecar/src/chatgpt/inference';
import { chatActionSchema, chatSnapshotSchema } from '../src/contracts/chat';
import { WindowsStore } from '../sidecar/src/chatgpt/store';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function callback(query: string) {
  return new URL(`http://127.0.0.1:1455/auth/callback?${query}`);
}
describe('OAuth callback security', () => {
  it('requires exact state and rejects duplicate or substituted client IDs', () => {
    expect(() => parseCallback(callback('state=wrong&code=x&client_id=oaiapp_a'), 'right')).toThrow(
      'INVALID_CALLBACK',
    );
    expect(() => parseCallback(callback('state=s&state=s&code=x&client_id=oaiapp_a'), 's')).toThrow(
      'INVALID_CALLBACK',
    );
    expect(() =>
      parseCallback(callback('state=s&code=x&client_id=oaiapp_other'), 's', 'oaiapp_original'),
    ).toThrow('INVALID_CALLBACK');
    expect(() =>
      parseCallback(callback('state=s&code=x&client_id=dynamic_agent_client'), 's'),
    ).toThrow('INVALID_CALLBACK');
  });
  it('honors denied consent and retains issued ID on returning callbacks', () => {
    expect(() => parseCallback(callback('state=s&error=access_denied'), 's')).toThrow(
      'LOGIN_DENIED',
    );
    expect(parseCallback(callback('state=s&code=x'), 's', 'oaiapp_saved')).toEqual({
      code: 'x',
      clientId: 'oaiapp_saved',
    });
  });
  it('starts an actual loopback listener before opening authorization and closes after one callback', async () => {
    let redirect = '';
    const result = await authorize(
      'urn:uuid:fixture',
      undefined,
      async (address) => {
        const url = new URL(address);
        expect(url.origin).toBe('https://auth.openai.com');
        expect(url.searchParams.get('client_id')).toBe('dynamic_agent_client');
        expect(url.searchParams.get('code_challenge_method')).toBe('S256');
        expect(url.searchParams.get('scope')).toContain('chatgpt.tokens.use.direct');
        redirect = url.searchParams.get('redirect_uri')!;
        expect(new URL(redirect).hostname).toBe('127.0.0.1');
        await fetch(
          `${redirect}?state=${url.searchParams.get('state')}&code=fixture&client_id=oaiapp_fixture`,
        ).catch(() => {});
      },
      new AbortController().signal,
    );
    expect(result.redirectUri).toBe(redirect);
    expect(result.verifier.length).toBeGreaterThan(43);
    await expect(fetch(redirect)).rejects.toThrow();
  });
});

describe('ID token verification', () => {
  let keys: Awaited<ReturnType<typeof generateKeyPair>>;
  let jwks: ReturnType<typeof createLocalJWKSet>;
  beforeAll(async () => {
    keys = await generateKeyPair('RS256');
    jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(keys.publicKey)), kid: 'fixture' }] });
  });
  async function token(overrides: Record<string, unknown> = {}) {
    return new SignJWT({
      sub: 'subject-a',
      iss: 'https://auth.openai.com',
      aud: 'oaiapp_fixture',
      nonce: 'nonce',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
      ...overrides,
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'fixture' })
      .sign(keys.privateKey);
  }
  it('accepts signed identity only for the issued client and nonce', async () => {
    expect(await verifyIdentity(await token(), 'oaiapp_fixture', 'nonce', jwks)).toEqual({
      subject: 'subject-a',
      email: null,
    });
  });
  it.each([
    { nonce: 'other' },
    { iss: 'https://example.com' },
    { aud: 'oaiapp_other' },
    { exp: 1 },
    { sub: '' },
  ])('rejects altered claims %j', async (claims) => {
    await expect(
      verifyIdentity(await token(claims), 'oaiapp_fixture', 'nonce', jwks),
    ).rejects.toThrow('INVALID_IDENTITY');
  });
  it('rejects a token signed by another key', async () => {
    const other = await generateKeyPair('RS256');
    const forged = await new SignJWT({ sub: 'forged' })
      .setProtectedHeader({ alg: 'RS256', kid: 'fixture' })
      .sign(other.privateKey);
    await expect(verifyIdentity(forged, 'oaiapp_fixture', 'nonce', jwks)).rejects.toThrow(
      'INVALID_IDENTITY',
    );
  });
});
function stream(events: unknown[]) {
  const bytes = new TextEncoder().encode(
    events.map((event) => `data: ${JSON.stringify(event)}\r\n\r\n`).join(''),
  );
  return new Response(
    new ReadableStream({
      start(controller) {
        for (let i = 0; i < bytes.length; i += 3) controller.enqueue(bytes.slice(i, i + 3));
        controller.close();
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } },
  );
}
describe('Responses completion and quota', () => {
  it('preserves fragmented UTF-8 and waits for completion', async () => {
    let output = '';
    await consumeStream(
      stream([
        { type: 'response.output_text.delta', delta: 'Adegan → hujan' },
        { type: 'response.completed' },
      ]),
      (value) => (output += value),
    );
    expect(output).toBe('Adegan → hujan');
  });
  it('does not call an interrupted or incomplete stream successful', async () => {
    await expect(
      consumeStream(stream([{ type: 'response.output_text.delta', delta: 'partial' }]), () => {}),
    ).rejects.toThrow('STREAM_INTERRUPTED');
    await expect(
      consumeStream(stream([{ type: 'response.incomplete' }]), () => {}),
    ).rejects.toThrow('RESPONSE_INCOMPLETE');
  });
  it('recognizes quota failure after text starts and bounds output', async () => {
    await expect(
      consumeStream(
        stream([
          { type: 'response.output_text.delta', delta: 'partial' },
          {
            type: 'response.failed',
            response: { error: { code: 'subscription_sharing_usage_limit_exceeded' } },
          },
        ]),
        () => {},
      ),
    ).rejects.toThrow('USAGE_LIMIT');
    await expect(
      consumeStream(
        stream([{ type: 'response.output_text.delta', delta: 'x'.repeat(6001) }]),
        () => {},
      ),
    ).rejects.toThrow('OUTPUT_LIMIT');
  });
  it('rejects hidden tool/approval fields at the UI boundary', () => {
    expect(
      chatActionSchema.safeParse({
        action: 'send',
        model: 'discovered',
        text: 'Hi',
        approved: true,
      }).success,
    ).toBe(false);
    expect(chatSnapshotSchema.safeParse({ accessToken: 'secret' }).success).toBe(false);
  });
});

it.skipIf(process.platform !== 'win32')(
  'protects the actual Windows credential file with DPAPI and restores the host ID',
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'aluraya-dpapi-'));
    const store = new WindowsStore(directory);
    try {
      const saved = await store.load();
      const encrypted = await readFile(join(directory, 'accounts.dpapi'), 'utf8');
      expect(encrypted).not.toContain(saved.hostId);
      expect(encrypted).not.toContain('fixture-secret');
      await store.close();
      const reopened = new WindowsStore(directory);
      expect(await reopened.load()).toEqual(saved);
      await reopened.close();
    } finally {
      await store.close();
      await rm(directory, { recursive: true, force: true });
    }
  },
  30000,
);
