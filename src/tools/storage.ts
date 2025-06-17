import storage from 'node-persist';

import { PLUGIN_NAME } from '../homebridge/settings.js';

export const STORAGE_KEY_SUFFIX_BRIGHTNESS = '_brightness';
export const STORAGE_KEY_SUFFIX_STATE = '_state';

async function init(dir: string) {
  await storage.init({ dir: dir, forgiveParseErrors: true });
}

export async function storageGet(dir: string, key: string): Promise<string | null> {
  try {
    await init(dir);
    return await storage.get(`${PLUGIN_NAME}:${key}`);
  } catch (err) {
    return null;
  }
}

export async function storageSet(dir: string, key: string, value: string): Promise<void> {
  try {
    await init(dir);
    storage.set(`${PLUGIN_NAME}:${key}`, value);
  } catch {
    // Nothing
  }
}
