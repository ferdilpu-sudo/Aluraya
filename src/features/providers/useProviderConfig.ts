import { useState } from 'react';
import {
  emptyProviderConfig,
  providerConfigSchema,
  type ProviderConfig,
} from '../../contracts/providers';
const key = 'aluraya-provider-config-v1';
function read() {
  try {
    const raw = localStorage.getItem(key);
    return {
      config: raw ? providerConfigSchema.parse(JSON.parse(raw)) : emptyProviderConfig,
      error: '',
    };
  } catch {
    return {
      config: emptyProviderConfig,
      error:
        'Konfigurasi tersimpan gagal dibaca. Data asli tidak ditimpa; perbaiki atau impor konfigurasi.',
    };
  }
}
export function useProviderConfig() {
  const [state, setState] = useState(read);
  function save(value: ProviderConfig) {
    const config = providerConfigSchema.parse(value);
    try {
      localStorage.setItem(key, JSON.stringify(config));
      setState({ config, error: '' });
      return true;
    } catch {
      setState((current) => ({
        ...current,
        error: 'Konfigurasi belum tersimpan. Penyimpanan lokal tidak tersedia.',
      }));
      return false;
    }
  }
  return { ...state, save };
}
export type ProviderController = ReturnType<typeof useProviderConfig>;
