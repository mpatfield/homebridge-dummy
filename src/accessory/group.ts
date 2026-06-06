import { DummyAccessory, DummyAccessoryDependency, GetHomeKit, GetMatter } from './base.js';
import { createDummyAccessory } from './helpers.js';

import { ConditionManager } from '../model/conditions.js';
import { History } from '../model/history.js';
import { DummyConfig, GroupConfig } from '../model/types.js';
import { WebhookManager } from '../model/webhook.js';

import { Log } from '../tools/log.js';
import { PLATFORM_NAME, PLUGIN_ALIAS } from '../homebridge/settings.js';
import getVersion from '../tools/version.js';

export type GroupAccessoryDependency = {
    getHomeKit: GetHomeKit,
    getMatter: GetMatter,
    conditionManager: ConditionManager,
    log: Log,
    history: History
}

export class GroupAccessory {

  public static identifier(groupName: string): string {
    return `${PLATFORM_NAME}:Group:${groupName.replace(/\s+/g,'')})}`;
  }

  private readonly accessories: (DummyAccessory<DummyConfig>)[] = [];

  constructor(dependency: GroupAccessoryDependency, config: GroupConfig, webhookManager: WebhookManager) {

    const homekit = dependency.getHomeKit();
    if (homekit === undefined) {
      throw new Error(`Unable to get HomeKit instance for group ${config.accessories[0].groupName}`);
    }

    homekit.accessory.getService(homekit.Service.AccessoryInformation)!
      .setCharacteristic(homekit.Characteristic.Manufacturer, PLUGIN_ALIAS)
      .setCharacteristic(homekit.Characteristic.Model, GroupAccessory.name)
      .setCharacteristic(homekit.Characteristic.SerialNumber, homekit.accessory.UUID)
      .setCharacteristic(homekit.Characteristic.FirmwareRevision, getVersion());

    const servicesToKeep = new Map<string, string>();

    for (const dummyConfig of config.accessories) {

      const accessoryDependency: DummyAccessoryDependency<DummyConfig> = {
        ...dependency,
        config: dummyConfig,
        isGrouped: true,
      };

      const dummyAccessory = createDummyAccessory(accessoryDependency);
      if (!dummyAccessory) {
        continue;
      }

      if (dummyConfig.enableWebhook === true || dummyConfig.enableWebook === true) {
        webhookManager.registerWebhooks(dummyAccessory.webhooks);
      }

      servicesToKeep.set(dummyAccessory.subtype!, dummyAccessory.service.UUID);
      this.accessories.push(dummyAccessory);
    };

    for (const service of [...homekit.accessory.services]) {
      if (service.subtype !== undefined && servicesToKeep.get(service.subtype) !== service.UUID) {
        homekit.accessory.removeService(service);
      }
    }
  }

  public teardown() {
    this.accessories.forEach( accessory => {
      accessory.teardown();
    });
  }
}