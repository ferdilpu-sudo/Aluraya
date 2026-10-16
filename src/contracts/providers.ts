import { z } from 'zod';
export const providerRoles = ['llm', 'image', 'video'] as const;
export const providerProtocols = [
  'chat-completions',
  'responses',
  'anthropic-messages',
  'gemini-content',
  'custom-http',
] as const;
const pointer = z
  .string()
  .min(1)
  .max(240)
  .regex(/^(?:\/(?:[^~/]|~[01])*)*$/);
const endpoint = z
  .string()
  .min(1)
  .max(300)
  .refine((value) => {
    const remaining = value.replace(/\{(model|jobId)\}/g, 'value');
    return (
      remaining.startsWith('/') &&
      !remaining.startsWith('//') &&
      !/[\\%?#\s{}]/.test(remaining) &&
      !remaining.split('/').some((p) => p === '.' || p === '..')
    );
  }, 'Gunakan path relatif /… tanpa query, traversal, atau URL lengkap.');
const baseUrl = z
  .string()
  .url()
  .max(500)
  .refine((value) => {
    try {
      const url = new URL(value);
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      return (
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash &&
        !/%|\\/.test(value) &&
        (url.protocol === 'https:' || (local && url.protocol === 'http:'))
      );
    } catch {
      return false;
    }
  }, 'HTTPS wajib, kecuali HTTP localhost. Jangan letakkan key pada URL.');
const auth = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }).strict(),
  z
    .object({ type: z.literal('bearer'), secretRef: z.string().regex(/^[a-zA-Z0-9_/-]{1,120}$/) })
    .strict(),
  z
    .object({
      type: z.literal('header'),
      headerName: z
        .string()
        .regex(/^[A-Za-z][A-Za-z0-9-]{0,79}$/)
        .refine(
          (s) =>
            ![
              'host',
              'cookie',
              'content-length',
              'content-type',
              'connection',
              'transfer-encoding',
              'proxy-authorization',
            ].includes(s.toLowerCase()),
        ),
      secretRef: z.string().regex(/^[a-zA-Z0-9_/-]{1,120}$/),
    })
    .strict(),
]);
const inputBinding = z
  .object({
    source: z.enum([
      'prompt',
      'messages',
      'model',
      'ratio',
      'resolution',
      'duration',
      'references',
    ]),
    target: pointer,
  })
  .strict();
const mapping = z
  .object({
    inputs: z.array(inputBinding).min(1).max(30),
    output: z
      .object({ text: pointer.nullable(), mediaUrl: pointer.nullable(), jobId: pointer.nullable() })
      .strict(),
    polling: z
      .object({
        endpoint,
        statusPath: pointer,
        pending: z.array(z.string().min(1)).min(1),
        done: z.array(z.string().min(1)).min(1),
        failed: z.array(z.string().min(1)).min(1),
        mediaUrl: pointer,
        intervalSeconds: z.number().int().min(2).max(60),
        timeoutSeconds: z.number().int().min(30).max(7200),
      })
      .strict()
      .nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (new Set(value.inputs.map((i) => i.target)).size !== value.inputs.length)
      ctx.addIssue({ code: 'custom', message: 'Target request duplikat.' });
    if (!value.output.text && !value.output.mediaUrl && !value.output.jobId)
      ctx.addIssue({ code: 'custom', message: 'Mapping hasil wajib.' });
    if (Boolean(value.output.jobId) !== Boolean(value.polling))
      ctx.addIssue({ code: 'custom', message: 'Job ID dan polling harus didefinisikan bersama.' });
    if (value.polling) {
      const states = [...value.polling.pending, ...value.polling.done, ...value.polling.failed];
      if (new Set(states).size !== states.length)
        ctx.addIssue({ code: 'custom', message: 'Status polling saling tumpang tindih.' });
    }
  });
export const providerProfileSchema = z
  .object({
    id: z.uuid(),
    name: z.string().trim().min(1).max(100),
    role: z.enum(providerRoles),
    protocol: z.enum(providerProtocols),
    baseUrl,
    endpoint,
    model: z.string().trim().min(1).max(200),
    auth,
    apiVersion: z
      .string()
      .max(60)
      .regex(/^[A-Za-z0-9._-]*$/),
    timeoutSeconds: z.number().int().min(5).max(600),
    customMapping: mapping.nullable(),
    declaredCapabilities: z
      .object({
        referenceImages: z.boolean(),
        referenceVideo: z.boolean(),
        streaming: z.boolean(),
        structuredOutput: z.boolean(),
      })
      .strict(),
    cost: z
      .object({
        unit: z.enum(['unknown', 'request', 'second', 'million-tokens']),
        currency: z.string().max(12),
        amount: z.number().finite().nonnegative().nullable(),
      })
      .strict(),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.role !== 'llm' && p.protocol !== 'custom-http')
      ctx.addIssue({
        code: 'custom',
        message: 'Gambar/video memakai mapping adapter media, bukan protokol chat.',
      });
    if ((p.protocol === 'custom-http') !== Boolean(p.customMapping))
      ctx.addIssue({
        code: 'custom',
        message:
          'Custom HTTP memerlukan mapping eksplisit; protokol lain memakai adapter tersendiri.',
      });
    if (
      p.role !== 'llm' &&
      p.customMapping &&
      !p.customMapping.output.mediaUrl &&
      !p.customMapping.output.jobId
    )
      ctx.addIssue({
        code: 'custom',
        message: 'Provider media wajib memetakan media URL atau job ID.',
      });
    if (p.role === 'llm' && p.customMapping && !p.customMapping.output.text)
      ctx.addIssue({ code: 'custom', message: 'Provider LLM wajib memetakan output teks.' });
    if (p.cost.unit === 'unknown' && p.cost.amount !== null)
      ctx.addIssue({ code: 'custom', message: 'Harga belum diketahui harus null.' });
  });
export const providerConfigSchema = z
  .object({
    schemaVersion: z.literal(1),
    profiles: z.array(providerProfileSchema),
    routing: z
      .object({ llm: z.uuid().nullable(), image: z.uuid().nullable(), video: z.uuid().nullable() })
      .strict(),
  })
  .strict()
  .superRefine((config, ctx) => {
    if (new Set(config.profiles.map((p) => p.id)).size !== config.profiles.length)
      ctx.addIssue({ code: 'custom', message: 'ID profil duplikat.' });
    for (const role of providerRoles) {
      const id = config.routing[role];
      if (id && !config.profiles.some((p) => p.id === id && p.role === role))
        ctx.addIssue({ code: 'custom', message: `Rute ${role} tidak cocok dengan profil.` });
    }
  });
export type ProviderProfile = z.infer<typeof providerProfileSchema>;
export type ProviderConfig = z.infer<typeof providerConfigSchema>;
export const emptyProviderConfig: ProviderConfig = {
  schemaVersion: 1,
  profiles: [],
  routing: { llm: null, image: null, video: null },
};
export function newProviderProfile(role: ProviderProfile['role']): ProviderProfile {
  return {
    id: crypto.randomUUID(),
    name: `API ${role.toUpperCase()}`,
    role,
    protocol: role === 'llm' ? 'chat-completions' : 'custom-http',
    baseUrl: 'https://api.example.com',
    endpoint: role === 'llm' ? '/v1/chat/completions' : '/REPLACE_WITH_DOCUMENTED_ENDPOINT',
    model: 'YOUR_MODEL_ID',
    auth: { type: 'bearer', secretRef: `providers/${role}/main` },
    apiVersion: '',
    timeoutSeconds: 60,
    customMapping:
      role === 'llm'
        ? null
        : {
            inputs: [
              { source: 'prompt', target: '/prompt' },
              { source: 'model', target: '/model' },
            ],
            output: { text: null, mediaUrl: '/REPLACE_WITH_MEDIA_POINTER', jobId: null },
            polling: null,
          },
    declaredCapabilities: {
      referenceImages: false,
      referenceVideo: false,
      streaming: false,
      structuredOutput: false,
    },
    cost: { unit: 'unknown', currency: '', amount: null },
  };
}
