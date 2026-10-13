import { invoke, isTauri } from '@tauri-apps/api/core';
import { flowActionSchema, flowSnapshotSchema, type FlowAction } from '../contracts/flow';
export async function flowAction(action: FlowAction) {
  if (!isTauri()) throw new Error('Buka aplikasi Windows untuk menghubungkan Flow.');
  return flowSnapshotSchema.parse(
    await invoke<unknown>('flow_action', { action: flowActionSchema.parse(action) }),
  );
}
