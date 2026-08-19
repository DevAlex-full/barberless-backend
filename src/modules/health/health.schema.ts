import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const readyResponseSchema = z.object({
  status: z.enum(['ready', 'not_ready']),
  checks: z.object({
    database: z.enum(['ok', 'skipped', 'error']),
  }),
  timestamp: z.string(),
});

export type ReadyResponse = z.infer<typeof readyResponseSchema>;

export const versionResponseSchema = z.object({
  name: z.string(),
  version: z.string(),
  nodeEnv: z.string(),
  commit: z.string().nullable(),
});

export type VersionResponse = z.infer<typeof versionResponseSchema>;
