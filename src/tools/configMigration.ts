import fs from 'fs';

import { Log } from './log.js';

import { LEGACY_ACCESSORY_NAME } from '../accessory/legacy.js';
import { PLATFORM_NAME } from '../homebridge/settings.js';

import { AccessoryConfig, DummyPlatformConfig, LegacyAccessoryConfig, PlatformConfig } from '../model/types.js';

export async function migrateAccessories(log: Log, configPath: string): Promise<LegacyAccessoryConfig[] | undefined> {

  try {
    const config = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf8' }));

    fs.writeFileSync(configPath + '.bak', JSON.stringify(config, null, 4));

    const toMigrate: LegacyAccessoryConfig[] = [];
    const others: AccessoryConfig[] = [];

    config.accessories.forEach( (accessoryConfig: AccessoryConfig) => {
      if (accessoryConfig.accessory === LEGACY_ACCESSORY_NAME) {
        toMigrate.push(accessoryConfig as LegacyAccessoryConfig);
      } else {
        others.push(accessoryConfig);
      }
    });
  
    config.accessories = others;

    config.platforms.forEach( (platformConfig: PlatformConfig) => {
      if (platformConfig.platform === PLATFORM_NAME) {
        const dummyPlatformConfig = platformConfig as DummyPlatformConfig;
        dummyPlatformConfig.legacyAccessories = toMigrate;
        delete dummyPlatformConfig.migrate;
      }
    });

    delete config.migrate;

    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

    // TODO inform user of migrated accessories and that if something went wrong there is a backup at configPath.bak

    return toMigrate;

  } catch (err) {
    log.error((err as Error).message); // TODO alert that config migration failed
    return undefined;
  }
}