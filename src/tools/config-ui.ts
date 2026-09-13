import { readFileSync } from 'fs';
import path from 'path';

export type ConfigUiSsl = {
  key?: string,
  cert?: string,
  pfx?: string,
  passphrase?: string,
  selfSigned?: boolean,
};

export type ConfigUiSettings = {
  language?: string,
  ssl?: ConfigUiSsl,
};

const SSL_STRING_KEYS = ['key', 'cert', 'pfx', 'passphrase'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPlatformEntry(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && typeof value.platform === 'string';
}

function isConfigUiPlatform(value: unknown): value is Record<string, unknown> {
  return isPlatformEntry(value) && value.platform === 'config';
}

function slimSsl(value: unknown): ConfigUiSsl | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const ssl: ConfigUiSsl = {};
  for (const key of SSL_STRING_KEYS) {
    if (typeof value[key] === 'string') {
      ssl[key] = value[key];
    }
  }

  if (typeof value.selfSigned === 'boolean') {
    ssl.selfSigned = value.selfSigned;
  }

  return Object.keys(ssl).length > 0 ? ssl : undefined;
}

function slimPlatform(value: Record<string, unknown>): Record<string, unknown> {
  if (value.platform !== 'config') {
    return { platform: value.platform };
  }

  return {
    platform: 'config',
    lang: value.lang,
    ssl: slimSsl(value.ssl),
  };
}

function slimHomebridgeConfig(key: string, value: unknown): unknown {
  if (isPlatformEntry(value)) {
    return slimPlatform(value);
  }

  // Keep platforms only. Bridge PIN, accessory secrets, and other root keys must not stay in memory.
  if (key === '' && isRecord(value)) {
    return { platforms: Array.isArray(value.platforms) ? value.platforms : [] };
  }

  return value;
}

export function extractConfigUiSettings(raw: string): ConfigUiSettings {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw, slimHomebridgeConfig);
  } catch {
    return {};
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.platforms)) {
    return {};
  }

  const configUi = parsed.platforms.find(isConfigUiPlatform);
  if (configUi === undefined) {
    return {};
  }

  const settings: ConfigUiSettings = {};
  if (typeof configUi.lang === 'string') {
    settings.language = configUi.lang;
  }

  const ssl = slimSsl(configUi.ssl);
  if (ssl !== undefined) {
    settings.ssl = ssl;
  }

  return settings;
}

export function readConfigUiSettings(configPath: string): ConfigUiSettings {
  try {
    return extractConfigUiSettings(readFileSync(configPath, { encoding: 'utf8' }));
  } catch {
    return {};
  }
}

export function resolveConfigUiSsl(ssl: ConfigUiSsl | undefined, configPath: string): ConfigUiSsl | undefined {
  if (ssl === undefined) {
    return undefined;
  }

  if (ssl.selfSigned !== true) {
    return ssl;
  }

  return {
    ...ssl,
    key: ssl.key ?? path.join(configPath, '../ssl-certs/private-key.pem'),
    cert: ssl.cert ?? path.join(configPath, '../ssl-certs/certificate.pem'),
  };
}
