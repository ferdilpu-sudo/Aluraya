import { describe, expect, it } from 'vitest';
import { FrameDecoder } from '../sidecar/src/transport/frames';
import { dispatch } from '../sidecar/src/dispatch';
import { MAX_FRAME_BYTES, responseSchema } from '../src/contracts/sidecar';

const requestId = '38d0587b-17b4-4abc-a6c2-c23aabdaae8d';
const request = { schemaVersion: 1, requestId, type: 'health.inspect', payload: {} };

describe('bounded sidecar transport', () => {
  it('preserves Indonesian UTF-8 text split inside a multibyte character', () => {
    const decoder = new FrameDecoder();
    const encoded = Buffer.from('"Adegan → berikutnya"\n');
    const position = encoded.indexOf(Buffer.from('→')) + 1;
    expect(decoder.push(encoded.subarray(0, position))).toEqual([]);
    expect(decoder.push(encoded.subarray(position))).toEqual(['"Adegan → berikutnya"']);
  });
  it('accepts multiple frames without mixing correlation IDs', () => {
    expect(new FrameDecoder().push(Buffer.from('one\ntwo\n'))).toEqual(['one', 'two']);
  });
  it('rejects oversized incomplete input before buffering it', () => {
    expect(() => new FrameDecoder().push(Buffer.alloc(MAX_FRAME_BYTES + 1, 65))).toThrow(
      'FRAME_TOO_LARGE',
    );
  });
  it('rejects truncated input at EOF', () => {
    const decoder = new FrameDecoder();
    decoder.push(Buffer.from('{'));
    expect(() => decoder.end()).toThrow('INCOMPLETE_FRAME');
  });
  it('rejects malformed UTF-8 instead of replacing bytes', () => {
    expect(() => new FrameDecoder().push(Buffer.from([0xc3, 0x28, 10]))).toThrow();
  });
});

describe('diagnostic command boundary', () => {
  it('returns only observed sidecar readiness, preserving provider blockers', () => {
    const response = responseSchema.parse(JSON.parse(dispatch(JSON.stringify(request))));
    expect(response.requestId).toBe(requestId);
    if (!response.ok) throw new Error('Expected health result');
    expect(response.payload.checks.find((check) => check.id === 'sidecar')?.state).toBe('pass');
    for (const id of ['chatgpt', 'flow', 'generation']) {
      expect(response.payload.checks.find((check) => check.id === id)?.state).toBe('blocked');
    }
  });
  it.each(['generation.enqueue', 'approval.create', 'shell.execute'])(
    'rejects unauthorized %s',
    (type) => {
      expect(() => dispatch(JSON.stringify({ ...request, type }))).toThrow();
    },
  );
  it('rejects approval flags or shell payload injected into health', () => {
    expect(() => dispatch(JSON.stringify({ ...request, payload: { approved: true } }))).toThrow();
  });
  it('rejects unknown schema and invalid correlation ID', () => {
    expect(() => dispatch(JSON.stringify({ ...request, schemaVersion: 2 }))).toThrow();
    expect(() => dispatch(JSON.stringify({ ...request, requestId: '../secret' }))).toThrow();
  });
});
