import type { LlmSnapshot } from '../contracts/llm';
import type { PlanSource, ProposalEnvelope } from '../contracts/proposal';
import { parsePlan } from './planning';
export type PlanBinding = { requestId: string; source: PlanSource };
export function readPlanReply(
  binding: PlanBinding | null,
  reply: LlmSnapshot['reply'],
): { proposal: ProposalEnvelope | null; responseError: string } {
  if (!binding || !reply || reply.requestId !== binding.requestId)
    return { proposal: null, responseError: '' };
  if (reply.state !== 'completed')
    return {
      proposal: null,
      responseError:
        'Usulan terpotong. Tidak dapat diterapkan; siapkan request baru dengan cakupan lebih kecil atau batas output lebih besar.',
    };
  try {
    return {
      proposal: parsePlan(reply.text, binding.source, binding.requestId),
      responseError: '',
    };
  } catch (e) {
    return {
      proposal: null,
      responseError: e instanceof Error ? e.message : 'Usulan tidak valid.',
    };
  }
}
