import { describe, expect, it } from 'vitest';
import { applyPlan, createPlanSource, parsePlan, planIssues } from '../src/domain/planning';
import { readPlanReply } from '../src/domain/planReply';
import { commitProjectUpdate } from '../src/domain/projectUpdate';
import { newProject, newShot, projectSchema } from '../src/domain/studio';
import { importDraft } from '../src/infrastructure/studioStorage';
function fixture() {
  const project = newProject('Cerita');
  project.script = 'Rani membuka pintu. "Aku pulang." Ia masuk ke rumah.';
  project.assets = [
    {
      id: crypto.randomUUID(),
      name: 'Rani',
      kind: 'character',
      description: 'Jaket merah',
      image: 'data:image/png;base64,YQ==',
    },
  ];
  project.shots = [
    { ...newShot(0), action: 'Menunggu.', review: 'reviewed', references: [project.assets[0]!.id] },
  ];
  const source = createPlanSource(
    project,
    project.script,
    'full',
    crypto.randomUUID(),
    'model-pilihan',
  );
  const content = {
    schemaVersion: 1,
    summary: 'Adegan kedatangan',
    warnings: ['Cuaca belum ditentukan.'],
    assets: [{ key: 'home', kind: 'location', name: 'Rumah', description: 'Pintu kayu' }],
    shots: [
      {
        title: 'Masuk rumah',
        scene: 'Adegan 1',
        action: 'Rani membuka pintu.',
        dialogue: 'Aku pulang.',
        sound: 'Pintu berderit',
        camera: 'Medium statis',
        seconds: 8,
        references: ['new:home', `asset:${project.assets[0]!.id}`],
      },
    ],
  };
  const requestId = crypto.randomUUID();
  const proposal = parsePlan(JSON.stringify(content), source, requestId);
  return { project, source, content, requestId, proposal };
}
describe('reviewable planner proposals', () => {
  it('uses explicit source and text metadata without sending images or silently truncating', () => {
    const { project } = fixture();
    const source = createPlanSource(
      project,
      'Rani membuka pintu.',
      'excerpt',
      crypto.randomUUID(),
      'local',
    );
    const context = JSON.parse(source.prompt.split('DATA PROYEK:\n')[1]!);
    expect(context.sourceText).toBe('Rani membuka pintu.');
    expect(context.sourceKind).toBe('excerpt');
    expect(context.assets[0]).toMatchObject({ name: 'Rani', description: 'Jaket merah' });
    expect(context.assets[0]).not.toHaveProperty('image');
    expect(source.prompt).not.toContain('data:image');
    expect(() =>
      createPlanSource(project, 'Naskah lain', 'excerpt', source.providerId, 'local'),
    ).toThrow('berasal');
    expect(() =>
      createPlanSource(project, 'Rani membuka pintu.', 'full', source.providerId, 'local'),
    ).toThrow('seluruh');
    expect(() =>
      createPlanSource(
        { ...project, script: 'x'.repeat(6000) },
        'x'.repeat(6000),
        'full',
        source.providerId,
        'local',
      ),
    ).toThrow('dipotong');
  });
  it('rejects malformed, truncated, privileged or unresolved model content', () => {
    const { content, source, requestId } = fixture();
    const parse = (value: unknown) => parsePlan(JSON.stringify(value), source, requestId);
    for (const invalid of [
      { ...content, approvalId: requestId },
      { ...content, assets: [{ ...content.assets[0], image: 'https://example.com/a.png' }] },
      { ...content, shots: [{ ...content.shots[0], review: 'reviewed' }] },
      { ...content, assets: [content.assets[0], content.assets[0]] },
      { ...content, shots: [{ ...content.shots[0], references: ['new:missing'] }] },
      { ...content, shots: [{ ...content.shots[0], references: ['new:home', 'new:home'] }] },
      { ...content, assets: [], shots: [] },
    ])
      expect(() => parse(invalid)).toThrow('schema');
    expect(() => parsePlan('{"schemaVersion":1', source, requestId)).toThrow();
    expect(() => parsePlan('x'.repeat(6001), source, requestId)).toThrow('batas');
    expect(
      parsePlan('```json\n' + JSON.stringify(content) + '\n```', source, requestId).content,
    ).toEqual(content);
  });
  it('appends application IDs, reference edges and draft shots without modifying existing content', () => {
    const { project, proposal } = fixture();
    const before = JSON.stringify(project);
    const result = commitProjectUpdate(project, (current) => applyPlan(current, proposal));
    expect(JSON.stringify(project)).toBe(before);
    expect(result.assets[0]).toEqual(project.assets[0]);
    expect(result.shots[0]).toEqual(project.shots[0]);
    expect(result.assets[1]?.image).toBeNull();
    expect(result.assets[1]?.id).not.toBe('home');
    expect(result.shots[1]?.references).toEqual([result.assets[1]?.id, project.assets[0]?.id]);
    expect(result.shots[1]?.review).toBe('draft');
    expect(result.shots[1]!.position.y).toBeGreaterThan(project.shots[0]!.position.y);
    expect(result.revision).toBe(project.revision + 1);
    expect(result.planReceipts[0]).toMatchObject({
      requestId: proposal.requestId,
      sourceRevision: project.revision,
      assetIds: [result.assets[1]?.id],
      shotIds: [result.shots[1]?.id],
    });
    expect(() => applyPlan(result, proposal)).toThrow();
    // Replay receipt also protects a draft whose revision was manually restored.
    expect(() => applyPlan({ ...result, revision: project.revision }, proposal)).toThrow(
      'sudah diterapkan',
    );
  });
  it('invalidates old proposals on every project edit, project switch and double click', () => {
    const { project, proposal } = fixture();
    for (const candidate of [
      { ...project, script: project.script + ' Hujan.' },
      { ...project, assets: [] },
      { ...project, shots: project.shots.map((s) => ({ ...s, position: { x: 42, y: 60 } })) },
    ]) {
      // Removing an asset also requires dropping references, as in the editor.
      if (!candidate.assets.length) candidate.shots = [];
      const next = commitProjectUpdate(project, candidate);
      expect(() => applyPlan(next, proposal)).toThrow('berubah');
    }
    expect(() => applyPlan({ ...project, id: crypto.randomUUID() }, proposal)).toThrow('berubah');
    expect(() => commitProjectUpdate(project, newProject())).toThrow('aktif berubah');
    let latest = project;
    const click = () => {
      latest = commitProjectUpdate(latest, (current) => applyPlan(current, proposal));
    };
    click();
    expect(click).toThrow();
    expect(latest.shots).toHaveLength(2);
  });
  it('enforces preserve dialogue and resolves existing assets at application time', () => {
    const { project, proposal } = fixture();
    proposal.content.shots[0]!.dialogue = 'Dialog baru dari model.';
    expect(() => applyPlan(project, proposal)).toThrow('verbatim');
    expect(planIssues({ ...project, adaptation: 'adapt' }, proposal)).toEqual([]);
    proposal.content.shots[0]!.dialogue = 'Aku\n pulang.';
    expect(planIssues(project, proposal)).toEqual([]);
    proposal.content.shots[0]!.references = [`asset:${crypto.randomUUID()}`];
    expect(() => applyPlan(project, proposal)).toThrow('Referensi');
    proposal.source.sourceText = 'Naskah asing';
    expect(planIssues(project, proposal).some((x) => x.includes('Teks sumber'))).toBe(true);
  });
  it('requires a matching completed response before presenting any apply action', () => {
    const { source, requestId, content } = fixture();
    const binding = { source, requestId };
    const reply = {
      requestId,
      text: JSON.stringify(content),
      state: 'completed' as const,
      inputTokens: 12,
      outputTokens: 100,
    };
    expect(readPlanReply(null, reply).proposal).toBeNull();
    expect(
      readPlanReply(binding, { ...reply, requestId: crypto.randomUUID() }).proposal,
    ).toBeNull();
    expect(readPlanReply(binding, { ...reply, state: 'incomplete' })).toMatchObject({
      proposal: null,
      responseError: expect.stringContaining('terpotong'),
    });
    expect(readPlanReply(binding, { ...reply, text: 'Jawaban bebas' }).proposal).toBeNull();
    expect(readPlanReply(binding, reply).proposal?.source).toEqual(source);
  });
  it('keeps old version-one backups loadable and preserves replay history across import', async () => {
    const { project, proposal } = fixture();
    const old = JSON.parse(JSON.stringify(project));
    delete old.revision;
    delete old.planReceipts;
    expect(projectSchema.parse(old)).toMatchObject({ revision: 0, planReceipts: [] });
    const result = applyPlan(project, proposal);
    const restored = projectSchema.parse(JSON.parse(JSON.stringify(result)));
    expect(() => applyPlan(restored, proposal)).toThrow();
    const copy = await importDraft(new File([JSON.stringify(result)], 'draft.json'));
    expect(copy.planReceipts).toEqual(result.planReceipts);
    expect(() => applyPlan(copy, proposal)).toThrow();
    expect(
      projectSchema.safeParse({
        ...result,
        planReceipts: [...result.planReceipts, ...result.planReceipts],
      }).success,
    ).toBe(false);
  });
});
