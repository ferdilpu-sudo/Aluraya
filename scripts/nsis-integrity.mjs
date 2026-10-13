import { Buffer } from 'node:buffer';

// Tauri patches this marker when bundling, then restores the build executable.
// https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-bundler/src/bundle.rs
export function verifyNsisExecutable(source, installed) {
  const original = Buffer.from('__TAURI_BUNDLE_TYPE_VAR_UNK');
  const packaged = Buffer.from('__TAURI_BUNDLE_TYPE_VAR_NSS');
  const offset = source.indexOf(original);
  if (offset < 0 || source.indexOf(original, offset + 1) !== -1) {
    throw new Error('UNEXPECTED_TAURI_BUNDLE_MARKER');
  }
  const expected = Buffer.from(source);
  packaged.copy(expected, offset);
  if (!expected.equals(installed)) throw new Error('PACKAGED_EXECUTABLE_MISMATCH');
}
