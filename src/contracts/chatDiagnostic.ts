import { z } from 'zod';

export const chatDiagnosticSchema = z
  .object({
    stage: z.enum(['http', 'stream', 'protocol']),
    status: z.number().int().min(100).max(599),
    shape: z.enum(['error', 'detail', 'other', 'non_json', 'empty', 'event']),
    code: z
      .string()
      .max(100)
      .regex(/^[a-z][a-z0-9_]*$/)
      .nullable(),
    param: z
      .string()
      .max(100)
      .regex(/^[a-z][a-z0-9_.[\]]*$/)
      .nullable(),
    requestId: z
      .string()
      .max(100)
      .regex(/^(req_[a-zA-Z0-9_-]+|[a-fA-F0-9-]{36})$/)
      .nullable(),
  })
  .strict();
export type ChatDiagnostic = z.infer<typeof chatDiagnosticSchema>;
