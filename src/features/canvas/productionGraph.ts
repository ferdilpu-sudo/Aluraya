import type { Edge } from '@xyflow/react';
import type { StudioProject } from '../../domain/studio';
import type { ShotCanvasNode } from './ShotNode';
import type { WorkspaceCanvasNode } from './WorkspaceNode';
export type ProductionNode = ShotCanvasNode | WorkspaceCanvasNode;
export const SHOT_TOP = 480;
export function productionGraph(project: StudioProject, selectedId: string) {
  const nodes: ProductionNode[] = [];
  const edges: Edge[] = [];
  const card = (
    id: string,
    kind: WorkspaceCanvasNode['data']['kind'],
    x: number,
    y: number,
    title: string,
    description: string,
    label: string,
    image?: string | null,
  ) =>
    nodes.push({
      id,
      type: 'workspace',
      position: { x, y },
      draggable: false,
      selectable: kind !== 'lane',
      selected: id === selectedId,
      data: { kind, title, description, label, image },
    });
  card(
    'lane-assets',
    'lane',
    0,
    0,
    'Dunia cerita',
    'Naskah dan referensi yang menjadi dasar setiap adegan.',
    '01 / NASKAH & ASET',
  );
  card(
    'script',
    'script',
    0,
    110,
    project.name,
    project.script.trim().slice(0, 240) ||
      'Masukkan ide atau naskah untuk mulai menyusun rencana bersama Copilot.',
    'SUMBER CERITA',
  );
  project.assets.forEach((asset, i) =>
    card(
      asset.id,
      'asset',
      (i + 1) * 350,
      110,
      asset.name,
      asset.description || 'Referensi lokal · pilih untuk mengedit',
      asset.kind === 'character' ? 'KARAKTER' : asset.kind === 'location' ? 'LOKASI' : 'PROPERTI',
      asset.image,
    ),
  );
  if (!project.assets.length)
    card(
      'empty-assets',
      'empty',
      350,
      110,
      'Karakter, lokasi, properti',
      'Aset usulan Copilot akan ditinjau di sini. Anda juga dapat menambahkan referensi sendiri.',
      'REFERENSI CERITA',
    );
  card(
    'lane-shots',
    'lane',
    0,
    370,
    'Storyboard per adegan',
    'Pilih shot untuk meninjau aksi, kamera, dialog, dan referensinya.',
    '02 / RENCANA SHOT',
  );
  project.shots.forEach((shot, i) => {
    nodes.push({
      id: shot.id,
      type: 'shot',
      position: { x: shot.position.x, y: shot.position.y + SHOT_TOP },
      selected: shot.id === selectedId,
      data: {
        shot,
        number: i + 1,
        image: project.assets.find((a) => shot.references.includes(a.id) && a.image)?.image ?? null,
        referenceCount: shot.references.length,
      },
    });
    shot.references.forEach((ref) =>
      edges.push({
        id: `ref-${ref}-${shot.id}`,
        source: ref,
        target: shot.id,
        label: 'referensi',
        type: 'smoothstep',
      }),
    );
    if (i > 0)
      edges.push({
        id: `sequence-${shot.id}`,
        source: project.shots[i - 1]!.id,
        target: shot.id,
        label: 'urutan',
        type: 'smoothstep',
      });
  });
  if (!project.shots.length)
    card(
      'empty-shots',
      'empty',
      0,
      SHOT_TOP,
      'Usulan shot akan muncul di sini',
      'Copilot akan mengusulkan rencana untuk Anda tinjau. Eksekutor LLM belum tersambung.',
      'MENUNGGU RENCANA',
    );
  const outputTop = Math.max(
    SHOT_TOP + 360,
    ...project.shots.map((s) => s.position.y + SHOT_TOP + 360),
  );
  card(
    'lane-output',
    'lane',
    0,
    outputTop,
    'Hasil & review',
    'Hasil akan melekat ke shot dan versinya setelah generasi selesai.',
    '03 / KLIP PRODUKSI',
  );
  project.shots.forEach((shot, i) => {
    const id = `output-${shot.id}`;
    card(
      id,
      'output',
      i * 350,
      outputTop + 110,
      shot.title,
      'Slot hasil shot. Menunggu adapter media, persetujuan biaya, dan generasi.',
      'HASIL VIDEO',
    );
    edges.push({
      id: `result-${shot.id}`,
      source: shot.id,
      target: id,
      label: 'hasil shot',
      type: 'smoothstep',
    });
  });
  if (!project.shots.length)
    card(
      'empty-output',
      'empty',
      0,
      outputTop + 110,
      'Hasil produksi',
      'Gambar dan klip akan masuk ke canvas yang sama. Belum ada request API.',
      'BELUM ADA MEDIA',
    );
  return {
    nodes,
    edges: edges.map((edge) => ({
      ...edge,
      style: { stroke: '#a2b296' },
      labelStyle: { fontSize: 10, fill: '#52664a' },
    })),
  };
}
