import { useCallback, useEffect, useRef, useState } from 'react';
import { llmAction } from '../../application/llm';
import type { LlmAction, LlmSnapshot } from '../../contracts/llm';
export function useLlm() {
  const [state, setState] = useState<LlmSnapshot | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const queued = useRef(0);
  const mounted = useRef(true);
  const execute = useCallback((action: LlmAction): Promise<LlmSnapshot | null> => {
    if (action.action === 'inspect' && queued.current) return Promise.resolve(null);
    queued.current++;
    if (action.action !== 'inspect') setPending(true);
    const next = queue.current.then(async () => {
      try {
        const result = await llmAction(action);
        if (mounted.current) {
          setState(result);
          if (action.action !== 'inspect') setError('');
        }
        return result;
      } catch {
        if (mounted.current)
          setError(
            'Backend desktop tidak tersedia atau sedang dipakai. Jika terputus setelah Kirim, periksa pemakaian provider sebelum mencoba lagi.',
          );
        return null;
      } finally {
        queued.current--;
        if (mounted.current && !queued.current) setPending(false);
      }
    });
    queue.current = next;
    return next;
  }, []);
  useEffect(() => {
    mounted.current = true;
    void execute({ action: 'inspect' });
    return () => {
      mounted.current = false;
    };
  }, [execute]);
  const activity = state?.activity;
  useEffect(() => {
    if (!activity || activity === 'idle') return;
    const timer = setInterval(() => void execute({ action: 'inspect' }), 700);
    return () => clearInterval(timer);
  }, [activity, execute]);
  return { state, pending, error, execute };
}
export type LlmController = ReturnType<typeof useLlm>;
