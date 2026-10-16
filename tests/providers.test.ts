import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  emptyProviderConfig,
  newProviderProfile,
  providerConfigSchema,
  providerProfileSchema,
} from '../src/contracts/providers';
import { newProject, newShot } from '../src/domain/studio';
import { productionGraph, SHOT_TOP } from '../src/features/canvas/productionGraph';

describe('provider configuration boundary', () => {
  it('loads example and defaults without secrets or a verified execution state', () => {
    const example = JSON.parse(readFileSync('examples/providers.example.json', 'utf8'));
    expect(providerConfigSchema.parse(example).profiles).toHaveLength(3);
    for (const role of ['llm', 'image', 'video'] as const)
      expect(providerProfileSchema.safeParse(newProviderProfile(role)).success).toBe(true);
    expect(providerConfigSchema.safeParse({ ...emptyProviderConfig, verified: true }).success).toBe(
      false,
    );
    const p = newProviderProfile('llm');
    expect(
      providerProfileSchema.safeParse({ ...p, auth: { ...p.auth, apiKey: 'secret' } }).success,
    ).toBe(false);
  });
  it('rejects routes to the wrong role and duplicate profile IDs', () => {
    const p = newProviderProfile('llm');
    expect(
      providerConfigSchema.safeParse({
        ...emptyProviderConfig,
        profiles: [p],
        routing: { ...emptyProviderConfig.routing, video: p.id },
      }).success,
    ).toBe(false);
    expect(
      providerConfigSchema.safeParse({ ...emptyProviderConfig, profiles: [p, p] }).success,
    ).toBe(false);
  });
  it('rejects credential URLs, insecure remote transport and endpoint escapes', () => {
    const p = newProviderProfile('llm');
    for (const baseUrl of [
      'not a URL',
      '',
      'http://api.example.com',
      'https://user:pass@example.com',
      'https://example.com?key=secret',
      'https://example.com#secret',
      'https://example.com/%2e%2e',
    ])
      expect(providerProfileSchema.safeParse({ ...p, baseUrl }).success).toBe(false);
    expect(
      providerProfileSchema.safeParse({ ...p, baseUrl: 'http://127.0.0.1:1234' }).success,
    ).toBe(true);
    for (const endpoint of [
      '//evil.example.com',
      '/../../key',
      '/%2e%2e/key',
      '/jobs?key=secret',
      '/{unknown}',
    ])
      expect(providerProfileSchema.safeParse({ ...p, endpoint }).success).toBe(false);
  });
  it('does not treat media as chat or accept missing custom output mapping', () => {
    const p = newProviderProfile('video');
    expect(
      providerProfileSchema.safeParse({ ...p, protocol: 'chat-completions', customMapping: null })
        .success,
    ).toBe(false);
    expect(
      providerProfileSchema.safeParse({
        ...p,
        customMapping: {
          ...p.customMapping,
          output: { text: '/text', mediaUrl: null, jobId: null },
        },
      }).success,
    ).toBe(false);
    expect(
      providerProfileSchema.safeParse({ ...p, cost: { unit: 'unknown', currency: '', amount: 0 } })
        .success,
    ).toBe(false);
  });
  it('requires polling for async jobs and disjoint terminal states', () => {
    const p = newProviderProfile('video');
    const customMapping = {
      ...p.customMapping!,
      output: { text: null, mediaUrl: null, jobId: '/id' },
    };
    expect(providerProfileSchema.safeParse({ ...p, customMapping }).success).toBe(false);
    const polling = {
      endpoint: '/jobs/{jobId}',
      statusPath: '/status',
      pending: ['queued'],
      done: ['done'],
      failed: ['failed'],
      mediaUrl: '/output/url',
      intervalSeconds: 3,
      timeoutSeconds: 600,
    };
    expect(
      providerProfileSchema.safeParse({ ...p, customMapping: { ...customMapping, polling } })
        .success,
    ).toBe(true);
    expect(
      providerProfileSchema.safeParse({
        ...p,
        customMapping: { ...customMapping, polling: { ...polling, failed: ['done'] } },
      }).success,
    ).toBe(false);
  });
});

describe('unified production graph', () => {
  it('keeps references and result slots bound to shots without inventing outputs', () => {
    const project = newProject();
    const asset = {
      id: crypto.randomUUID(),
      name: 'Karakter',
      kind: 'character' as const,
      description: '',
      image: null,
    };
    const shot = { ...newShot(0), references: [asset.id], position: { x: 50, y: 20 } };
    project.assets = [asset];
    project.shots = [shot];
    const graph = productionGraph(project, shot.id);
    expect(graph.nodes.find((n) => n.id === shot.id)?.position).toEqual({
      x: 50,
      y: 20 + SHOT_TOP,
    });
    expect(graph.edges.some((e) => e.source === asset.id && e.target === shot.id)).toBe(true);
    expect(graph.edges.some((e) => e.source === shot.id && e.target === `output-${shot.id}`)).toBe(
      true,
    );
    const output = graph.nodes.find((n) => n.id === `output-${shot.id}`);
    expect(output?.type === 'workspace' && output.data.kind).toBe('output');
    expect(output?.data).not.toHaveProperty('downloadUrl');
    expect(shot.position).toEqual({ x: 50, y: 20 });
  });
});
