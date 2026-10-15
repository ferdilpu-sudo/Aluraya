import { projectSchema, type StudioProject } from '../domain/studio';
let connection: Promise<IDBDatabase> | undefined;
function database() {
  return (connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('aluraya-studio-drafts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('projects', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      connection = undefined;
      reject(new Error('Penyimpanan draf tidak tersedia.'));
    };
    request.onblocked = () => {
      connection = undefined;
      reject(new Error('Tutup jendela Aluraya lain untuk membuka penyimpanan.'));
    };
  }));
}
export async function loadProjects(): Promise<StudioProject[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction('projects').objectStore('projects').getAll();
    request.onsuccess = () => {
      const result = projectSchema.array().safeParse(request.result);
      if (result.success) resolve(result.data.sort((a, b) => b.updatedAt - a.updatedAt));
      else reject(new Error('Draf tersimpan tidak dapat dibaca. Data asli tidak ditimpa.'));
    };
    request.onerror = () => reject(new Error('Gagal membaca draf lokal.'));
  });
}
export async function saveProject(project: StudioProject): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    tx.objectStore('projects').put(projectSchema.parse(project));
    tx.oncomplete = () => resolve();
    tx.onabort = tx.onerror = () =>
      reject(
        new Error(
          'Draf belum tersimpan. Ruang penyimpanan mungkin penuh. Ekspor cadangan sebelum menutup.',
        ),
      );
  });
}
export function downloadDraft(project: StudioProject) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(projectSchema.parse(project), null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.name.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80)}.aluraya.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export async function importDraft(file: File): Promise<StudioProject> {
  if (file.size > 50 * 1024 * 1024) throw new Error('Cadangan terlalu besar (maksimal 50 MB).');
  const parsed = projectSchema.safeParse(JSON.parse(await file.text()));
  if (!parsed.success)
    throw new Error('Format cadangan Aluraya tidak valid. Proyek aktif tetap utuh.');
  return {
    ...parsed.data,
    id: crypto.randomUUID(),
    name: `${parsed.data.name.slice(0, 108)} (salinan)`,
    updatedAt: Date.now(),
  };
}
export async function readReference(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024)
    throw new Error('Pilih JPG, PNG, atau WebP maksimal 4 MB.');
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Gambar tidak dapat dibaca.'));
    reader.readAsDataURL(file);
  });
  const image = new Image();
  image.src = data;
  await image.decode().catch(() => {
    throw new Error('Berkas bukan gambar yang dapat dibuka.');
  });
  return data;
}
