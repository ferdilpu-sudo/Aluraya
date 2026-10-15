import { useCallback, useEffect, useRef, useState } from 'react';
import { nexabotAction, type NexaView } from '../../application/nexabot';
import { type NexaAction } from '../../contracts/nexabot';
import { nexaErrorMessage } from './errors';

export function useNexabot() {
  const [state, setState] = useState<NexaView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const flight = useRef(false);
  const execute = useCallback(async (action: NexaAction) => {
    if (flight.current) return;
    flight.current = true;
    if (action.action !== 'inspect') setPending(true);
    try {
      setState(await nexabotAction(action));
      setError(null);
    } catch (failure) {
      if (!(action.action === 'inspect' && failure === 'BUSY')) setError(nexaErrorMessage(failure));
    } finally {
      flight.current = false;
      setPending(false);
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
