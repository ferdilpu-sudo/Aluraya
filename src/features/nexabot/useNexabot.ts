import { useCallback, useEffect, useRef, useState } from 'react';
import { nexabotAction, type NexaView } from '../../application/nexabot';
import { type NexaAction } from '../../contracts/nexabot';
import { nexaErrorMessage } from './errors';
import { NexaActionQueue } from './actionQueue';

export function useNexabot() {
  const [state, setState] = useState<NexaView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const queue = useRef(new NexaActionQueue(nexabotAction));
  const execute = useCallback(async (action: NexaAction) => {
    const request = queue.current.run(action);
    setPending(queue.current.pending > 0);
    try {
      const result = await request;
      if (result) {
        setState(result);
        setError(null);
      }
    } catch (failure) {
      if (!(action.action === 'inspect' && failure === 'BUSY')) setError(nexaErrorMessage(failure));
    } finally {
      setPending(queue.current.pending > 0);
    }
  }, []);
  useEffect(() => {
    void execute({ action: 'inspect' });
    const timer = setInterval(() => void execute({ action: 'inspect' }), 1500);
    return () => clearInterval(timer);
  }, [execute]);
  return { state, error, pending, execute };
}
export type NexaController = ReturnType<typeof useNexabot>;
