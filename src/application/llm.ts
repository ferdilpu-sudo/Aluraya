import { invoke, isTauri } from '@tauri-apps/api/core';
import { llmActionSchema, llmSnapshotSchema, type LlmAction } from '../contracts/llm';
export async function llmAction(action: LlmAction) {
  if (!isTauri()) throw new Error('DESKTOP_REQUIRED');
  return llmSnapshotSchema.parse(
    await invoke<unknown>('llm_action', { action: llmActionSchema.parse(action) }),
  );
}
