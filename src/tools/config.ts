import { readFileSync } from 'fs';
import path from 'path';

import { Log } from './log.js';

type SSL = {
  key?: string,
  cert?: string,
  pfx?: string,
  passphrase?: string,
  selfSigned?: boolean,
};

type HBPlatformConfig = {
  platform?: string,
  lang?: string,
  ssl?: SSL,
};

export class HBUIConfig {

  private static _instance?: HBUIConfig;

  private static instance(): HBUIConfig | undefined {
    return HBUIConfig._instance;
  }

  public static init(log: Log, configPath: string) {
    HBUIConfig._instance = new HBUIConfig(log, configPath);
  }

  public static get lang(): string | undefined {
    return HBUIConfig.instance()?._lang;
  }

  public static get ssl(): SSL | undefined {
    return HBUIConfig.instance()?._ssl;
  }

  private _lang?: string;
  private _ssl?: SSL;

  private constructor(log: Log, configPath: string) {

    let parsed: { lang?: string, ssl?: SSL } | undefined;
    try {
      parsed = JSON.parse(readFileSync(configPath, { encoding: 'utf8' }), (key: string, value: unknown) => {

        if (key === 'platforms' && Array.isArray(value)) {
          const configPlatform = (value as HBPlatformConfig[]).find(v => v?.platform === 'config');
          return configPlatform ? { lang: configPlatform.lang, ssl: configPlatform.ssl } : undefined;
        }

        if (key === '' && value && typeof value === 'object' && 'platforms' in value) {
          return (value as { platforms?: unknown }).platforms;
        }

        return value;
      });

    } catch (err) {
      log.warning('An error occurred while trying to fetch language and ssl details from Homebridge UI Config', err);
      return;
    }

    this._lang = parsed?.lang;
    this._ssl = parsed?.ssl;

    if (this._ssl?.selfSigned === true) {
      this._ssl.key = this._ssl.key ?? path.join(configPath, '../ssl-certs/private-key.pem');
      this._ssl.cert = this._ssl.cert ?? path.join(configPath, '../ssl-certs/certificate.pem');
    }
  }
}