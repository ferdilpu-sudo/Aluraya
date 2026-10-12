import { useCallback, useEffect, useRef, useState } from 'react';
import { inspectRuntime } from '../../application/diagnostics';
import type { Diagnostics } from '../../contracts/diagnostics';

export function useDiagnostics() {
  const [report, setReport] = useState<Diagnostics | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await inspectRuntime();
      if (mounted.current) setReport(result);
    } catch {
      if (mounted.current) {
        setReport(null);
        setError(
          'Pemeriksaan gagal. Jalankan npm run doctor untuk melihat prasyarat yang belum tersedia.',
        );
      }
    } finally {
      active.current = false;
      if (mounted.current) setBusy(false);
    }
  }, []);
  return { report, busy, error, refresh };
}
