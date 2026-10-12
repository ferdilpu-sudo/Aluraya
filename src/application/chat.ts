import { invoke, isTauri } from '@tauri-apps/api/core';
import { chatActionSchema, chatSnapshotSchema, type ChatAction } from '../contracts/chat';

export async function chatAction(action: ChatAction) {
  if (!isTauri()) throw new Error('Buka aplikasi Windows untuk menghubungkan ChatGPT.');
  return chatSnapshotSchema.parse(
    await invoke<unknown>('chat_action', { action: chatActionSchema.parse(action) }),
  );
}
