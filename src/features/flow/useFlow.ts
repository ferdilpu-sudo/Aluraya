import { useCallback, useEffect, useRef, useState } from 'react';
import { flowAction } from '../../application/flow';
import { flowError } from './flowErrors';
import type { FlowAction, FlowSnapshot } from '../../contracts/flow';

export function useFlow() {
  const [state, setState] = useState<FlowSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const queued = useRef(0);
  const mounted = useRef(true);
  const execute = useCallback((action: FlowAction): Promise<FlowSnapshot | null> => {
    if (action.action === 'inspect' && queued.current > 0) return Promise.resolve(null);
    queued.current++;
    if (action.action !== 'inspect') setPending(true);
    const work = queue.current.then(async () => {
      try {
        const result = await flowAction(action);
        if (mounted.current) {
          setState(result);
          setError(null);
        }
        return result;
      } catch (error) {
        if (mounted.current) setError(flowError(error));
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
    if (!state?.browserOpen) return;
    const timer = setInterval(() => void execute({ action: 'inspect' }), 1500);
    return () => clearInterval(timer);
  }, [state, execute]);
  return { state, error, pending, execute };
}
