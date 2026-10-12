import { useCallback, useEffect, useRef, useState } from 'react';
import { chatAction } from '../../application/chat';
import type { ChatAction, ChatSnapshot } from '../../contracts/chat';

export function useChat() {
  const [state, setState] = useState<ChatSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const queued = useRef(0);
  const mounted = useRef(true);
  const execute = useCallback((action: ChatAction): Promise<ChatSnapshot | null> => {
    if (action.action === 'inspect' && queued.current > 0) return Promise.resolve(null);
    queued.current++;
    if (action.action !== 'inspect') setPending(true);
    const work = queue.current.then(async () => {
      try {
        const result = await chatAction(action);
        if (mounted.current) {
          setState(result);
          setError(null);
        }
        return result;
      } catch {
        if (mounted.current)
          setError(
            'Koneksi desktop tidak tersedia atau sedang dipakai. Buka Aluraya Windows; tutup jendela duplikat bila ada.',
          );
        return null;
      } finally {
        queued.current--;
        if (mounted.current && queued.current === 0) setPending(false);
      }
    });
    queue.current = work;
    return work;
  }, []);
  useEffect(() => {
    mounted.current = true;
    void execute({ action: 'inspect' });
    return () => {
      mounted.current = false;
    };
  }, [execute]);
  useEffect(() => {
    if (!state || state.activity === 'idle') return;
    const timer = setInterval(() => void execute({ action: 'inspect' }), 500);
    return () => clearInterval(timer);
  }, [state, execute]);
  return { state, error, pending, execute };
}
