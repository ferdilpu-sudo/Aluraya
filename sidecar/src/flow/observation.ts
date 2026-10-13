import type { FlowObservation } from '../../../src/contracts/flow';

export const FLOW_URL = 'https://labs.google/fx/tools/flow';
export function pageKind(address: string): FlowObservation['page'] {
  try {
    const url = new URL(address);
    if (url.protocol !== 'https:' || url.port || url.username || url.password) return 'other';
    if (url.hostname === 'accounts.google.com') return 'login';
    if (
      url.hostname === 'flow.google' ||
      (url.hostname === 'labs.google' &&
        /^\/fx\/(?:[a-z-]+\/)?tools\/flow(?:\/|$)/.test(url.pathname))
    )
      return 'flow';
  } catch {
    /* Untrusted navigation is never inspected. */
  }
  return 'other';
}
// These are unverified visible labels, never authorization, prices or balances.
export function observedLabels(lines: string[]) {
  const safe = lines
    .slice(0, 1000)
    .map((line) => line.trim())
    .filter((line) => line.length <= 100 && !/[@<>]|https?:|bearer|token|cookie/i.test(line));
  const modelLabels = [
    ...new Set(
      safe.filter((line) => /^(?:Veo|Imagen|Nano Banana|Gemini Omni)\b[\w .()+/-]*$/i.test(line)),
    ),
  ].slice(0, 12);
  const creditLabels = [
    ...new Set(
      safe.filter((line) =>
        /^(?:(?:AI |Google Flow )?(?:credits?|kredit)\s*:?\s*[\d., ]+|[\d., ]+\s*(?:AI |Google Flow )?(?:credits?|kredit))$/i.test(
          line,
        ),
      ),
    ),
  ].slice(0, 6);
  return { modelLabels, creditLabels };
}
