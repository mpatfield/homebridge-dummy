import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import { extractConfigUiSettings, readConfigUiSettings, resolveConfigUiSsl } from './config-ui.js';

const HOMEBRIDGE_CONFIG = JSON.stringify({
  bridge: {
    name: 'Homebridge',
    username: 'AA:BB:CC:DD:EE:FF',
    pin: '031-45-154',
  },
  platforms: [
    {
      platform: 'Nest',
      password: 'nest-secret',
      googleAuth: {
        cookies: 'cookie-secret',
        issueToken: 'https://example.invalid/token',
      },
    },
    {
      platform: 'config',
      lang: 'de',
      token: 'config-ui-token',
      ssl: {
        key: '/etc/ssl/key.pem',
        cert: '/etc/ssl/cert.pem',
        extra: 'not-used',
      },
    },
  ],
  accessories: [
    {
      accessory: 'OtherPlugin',
      key: 'accessory-secret',
    },
  ],
});

describe('extractConfigUiSettings', () => {
  it('returns only Config UI language and SSL', () => {
    assert.deepEqual(extractConfigUiSettings(HOMEBRIDGE_CONFIG), {
      language: 'de',
      ssl: {
        key: '/etc/ssl/key.pem',
        cert: '/etc/ssl/cert.pem',
      },
    });
  });

  it('does not keep other plugins, bridge, or accessory secrets', () => {
    const serialized = JSON.stringify(extractConfigUiSettings(HOMEBRIDGE_CONFIG));

    assert.equal(serialized.includes('nest-secret'), false);
    assert.equal(serialized.includes('cookie-secret'), false);
    assert.equal(serialized.includes('031-45-154'), false);
    assert.equal(serialized.includes('AA:BB:CC:DD:EE:FF'), false);
    assert.equal(serialized.includes('accessory-secret'), false);
    assert.equal(serialized.includes('config-ui-token'), false);
    assert.equal(serialized.includes('not-used'), false);
  });

  it('returns empty settings for invalid JSON', () => {
    assert.deepEqual(extractConfigUiSettings('{'), {});
  });

  it('returns empty settings when Config UI is missing', () => {
    assert.deepEqual(extractConfigUiSettings(JSON.stringify({
      platforms: [{ platform: 'Nest', password: 'nest-secret' }],
    })), {});
  });

  it('keeps passphrase and pfx when present', () => {
    assert.deepEqual(extractConfigUiSettings(JSON.stringify({
      platforms: [{
        platform: 'config',
        ssl: {
          pfx: '/certs/homebridge.pfx',
          passphrase: 'pfx-pass',
          selfSigned: false,
        },
      }],
    })), {
      ssl: {
        pfx: '/certs/homebridge.pfx',
        passphrase: 'pfx-pass',
        selfSigned: false,
      },
    });
  });
});

describe('readConfigUiSettings', () => {
  it('reads language from a config file', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'homebridge-dummy-'));
    const configPath = path.join(dir, 'config.json');
    writeFileSync(configPath, HOMEBRIDGE_CONFIG);

    assert.equal(readConfigUiSettings(configPath).language, 'de');
  });

  it('returns empty settings when the file is missing', () => {
    assert.deepEqual(readConfigUiSettings(path.join(tmpdir(), 'homebridge-dummy-missing', 'config.json')), {});
  });
});

describe('resolveConfigUiSsl', () => {
  it('fills default self-signed cert paths', () => {
    const configPath = '/var/lib/homebridge/config.json';

    assert.deepEqual(resolveConfigUiSsl({ selfSigned: true }, configPath), {
      selfSigned: true,
      key: path.join(configPath, '../ssl-certs/private-key.pem'),
      cert: path.join(configPath, '../ssl-certs/certificate.pem'),
    });
  });

  it('leaves explicit cert paths in place', () => {
    assert.deepEqual(resolveConfigUiSsl({
      selfSigned: true,
      key: '/custom/key.pem',
      cert: '/custom/cert.pem',
    }, '/var/lib/homebridge/config.json'), {
      selfSigned: true,
      key: '/custom/key.pem',
      cert: '/custom/cert.pem',
    });
  });
});
