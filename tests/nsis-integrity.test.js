import { Buffer } from 'node:buffer';
import { expect, it } from 'vitest';
import { verifyNsisExecutable } from '../scripts/nsis-integrity.mjs';
const source = Buffer.from('binary-prefix:__TAURI_BUNDLE_TYPE_VAR_UNK:binary-suffix');
const installed = Buffer.from('binary-prefix:__TAURI_BUNDLE_TYPE_VAR_NSS:binary-suffix');
it('accepts the NSIS marker while preserving the build executable', () => {
  const before = Buffer.from(source);
  expect(() => verifyNsisExecutable(source, installed)).not.toThrow();
  expect(source.equals(before)).toBe(true);
});
it('rejects corruption outside the marker, truncation and wrong bundle type', () => {
  const tampered = Buffer.from(installed);
  tampered[0] = 0;
  for (const invalid of [tampered, installed.subarray(1), source]) {
    expect(() => verifyNsisExecutable(source, invalid)).toThrow('PACKAGED_EXECUTABLE_MISMATCH');
  }
});
it('fails closed when a toolchain changes or duplicates the source marker', () => {
  for (const invalid of [installed, Buffer.concat([source, source])]) {
    expect(() => verifyNsisExecutable(invalid, installed)).toThrow(
      'UNEXPECTED_TAURI_BUNDLE_MARKER',
    );
  }
});
