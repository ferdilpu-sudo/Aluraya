import { randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer, type Server, type Socket } from 'node:net';
import { z } from 'zod';
import { FrameDecoder } from './transport/frames';
import type { ChatSession } from './chatgpt/session';

export const SWITCHLY_PIPE_PATH = String.raw`\\.\pipe\Aluraya.Switchly.Copilot.v1`;
const pairingPattern = /^[A-Za-z0-9_-]{43}$/;
const requestSchema = z.discriminatedUnion('operation', [
  z.object({
    schemaVersion: z.literal(1),
    requestId: z.uuid(),
    pairingCode: z.string().regex(pairingPattern),
    operation: z.literal('inspect'),
  }).strict(),
  z.object({
    schemaVersion: z.literal(1),
    requestId: z.uuid(),
    pairingCode: z.string().regex(pairingPattern),
    operation: z.literal('send'),
    model: z.string().min(1).max(200),
    text: z.string().trim().min(1).max(4000),
  }).strict(),
]);

export type BridgeControlAction = 'bridge_enable' | 'bridge_disable';

export type BridgeStatus = {
  bridgeActive: boolean;
  bridgeCode: string | null;
};

/**
 * Local-only explicit opt-in capability. A 256-bit pairing code is shown
 * only by Aluraya's own UI. No account, cookie or OAuth token crosses IPC.
 * The named pipe is owned by the current Windows process; pairing is
 * mandatory even for other local processes able to open the pipe.
 */
export class SwitchlyBridgeServer {
  private server: Server | null = null;
  private code: string | null = null;
  private listening = false;
  private busy = false;
  private sockets = new Set<Socket>();
  private session: Pick<ChatSession, 'snapshot' | 'replyOnce' | 'cancelBridge'> | null = null;

  constructor(
    private readonly pipePath = SWITCHLY_PIPE_PATH,
    private readonly allowUnixSocketForTests = false,
  ) {}

  status(): BridgeStatus {
    return { bridgeActive: this.listening, bridgeCode: this.code };
  }

  enable(session: Pick<ChatSession, 'snapshot' | 'replyOnce' | 'cancelBridge'>): BridgeStatus {
    if (process.platform !== 'win32' && !this.allowUnixSocketForTests)
      throw new Error('WINDOWS_REQUIRED');
    const snap = session.snapshot();
    if (!snap.signedIn || !snap.planEnabled || !snap.planConfirmed ||
        snap.usagePaused || snap.models.length === 0)
      throw new Error('BRIDGE_PLAN_NOT_CONFIRMED');
    if (this.server) return this.status();
    this.code = randomBytes(32).toString('base64url');
    this.session = session;
    const server = createServer((socket) => this.accept(socket));
    this.server = server;
    server.on('listening', () => { if (this.server === server) this.listening = true; });
    server.on('error', () => {
      if (this.server === server) this.disable();
    });
    server.listen(this.pipePath);
    return this.status();
  }

  disable(): BridgeStatus {
    this.session?.cancelBridge();
    this.session = null;
    this.code = null;
    this.busy = false;
    this.listening = false;
    const server = this.server;
    this.server = null;
    for (const socket of this.sockets) socket.destroy();
    this.sockets.clear();
    server?.close();
    return this.status();
  }

  private accept(socket: Socket): void {
    if (!this.listening || !this.session || this.sockets.size >= 2) {
      socket.destroy();
      return;
    }
    this.sockets.add(socket);
    const decoder = new FrameDecoder();
    let received = false;
    socket.setTimeout(195_000, () => socket.destroy());
    socket.on('close', () => { this.sockets.delete(socket); });
    socket.on('error', () => { socket.destroy(); });
    socket.on('data', (chunk: Buffer) => {
      if (received) { socket.destroy(); return; }
      try {
        const frames = decoder.push(chunk);
        if (frames.length !== 1) {
          if (frames.length > 1) socket.destroy();
          return;
        }
        received = true;
        void this.handle(socket, frames[0]);
      } catch {
        socket.destroy();
      }
    });
  }

  private authorized(value: string): boolean {
    if (!this.code || !pairingPattern.test(value)) return false;
    const given = Buffer.from(value, 'ascii');
    const expected = Buffer.from(this.code, 'ascii');
    return given.length === expected.length && timingSafeEqual(given, expected);
  }

  private async handle(socket: Socket, input: string): Promise<void> {
    let requestId = '';
    try {
      const request = requestSchema.parse(JSON.parse(input) as unknown);
      requestId = request.requestId;
      if (!this.authorized(request.pairingCode)) {
        this.respond(socket, { schemaVersion: 1, requestId, ok: false,
          error: 'BRIDGE_ACCESS_DENIED' });
        return;
      }
      const session = this.session;
      if (!session) throw new Error('BRIDGE_DISABLED');
      const snapshot = session.snapshot();
      if (!snapshot.signedIn || !snapshot.planConfirmed || snapshot.usagePaused) {
        this.respond(socket, { schemaVersion: 1, requestId, ok: false,
          error: 'BRIDGE_PLAN_NOT_CONFIRMED' });
        return;
      }
      if (request.operation === 'inspect') {
        this.respond(socket, { schemaVersion: 1, requestId, ok: true,
          models: snapshot.models.map(({ id, name }) => ({ id, name })) });
        return;
      }
      if (this.busy) {
        this.respond(socket, { schemaVersion: 1, requestId, ok: false,
          error: 'BRIDGE_BUSY' });
        return;
      }
      if (!snapshot.models.some((model) => model.id === request.model)) {
        this.respond(socket, { schemaVersion: 1, requestId, ok: false,
          error: 'BRIDGE_INVALID_MODEL' });
        return;
      }
      this.busy = true;
      try {
        const reply = await session.replyOnce(request.model, request.text);
        if (this.session !== session || !this.authorized(request.pairingCode))
          throw new Error('BRIDGE_DISABLED');
        this.respond(socket, { schemaVersion: 1, requestId, ok: true, reply });
      } finally {
        this.busy = false;
      }
    } catch {
      if (!socket.destroyed) {
        this.respond(socket, { schemaVersion: 1, requestId, ok: false,
          error: 'BRIDGE_REQUEST_FAILED' });
      }
    }
  }

  private respond(socket: Socket, message: object): void {
    if (socket.destroyed) return;
    const response = JSON.stringify(message);
    if (Buffer.byteLength(response) > 65536) {
      socket.destroy();
      return;
    }
    socket.end(response + '\n');
  }
}
