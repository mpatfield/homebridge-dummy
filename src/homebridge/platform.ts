import { API, DynamicPlatformPlugin, Logger, PlatformAccessory } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

import { DummyAccessory, DummyAccessoryDependency } from '../accessory/base.js';
import { initEveCharacteristics } from '../accessory/characteristic/eve.js';
import { createDummyAccessory } from '../accessory/helpers.js';
import { GroupAccessory, GroupAccessoryDependency } from '../accessory/group.js';

import { setLanguage, strings } from '../i18n/i18n.js';

import { ConditionManager } from '../model/conditions.js';
import { History } from '../model/history.js';
import { DummyConfig, DummyPlatformConfig, GroupConfig } from '../model/types.js';
import { WebhookManager } from '../model/webhook.js';

import { Log } from '../tools/log.js';
import { Storage } from '../tools/storage.js';
import getVersion from '../tools/version.js';

export class HomebridgeDummyPlatform implements DynamicPlatformPlugin {
  private readonly log: Log;

  private readonly homekitAccessories: Map<string, PlatformAccessory> = new Map();

  private readonly dummyAccessories: (DummyAccessory<DummyConfig> | GroupAccessory)[] = [];

  private readonly webhookManager: WebhookManager;
  private readonly conditionManager: ConditionManager;

  constructor(
    logger: Logger,
    private readonly config: DummyPlatformConfig,
    private readonly api: API,
  ) {

    setLanguage(api.user.configPath());

    this.log = new Log(logger, config.verbose === true);
    this.webhookManager = new WebhookManager(this.log, this.api.user.configPath(), { port: config.webhookPort, ...config.webhookConfig });
    this.conditionManager = new ConditionManager(this.log, api.user.storagePath());

    this.log.ifVerbose(
      'v%s | System %s | Node %s | HB v%s | HAPNodeJS v%s',
      getVersion(),
      process.platform,
      process.version,
      api.serverVersion,
      api.hap.HAPLibraryVersion(),
    );

    initEveCharacteristics(api);

    api.on('didFinishLaunching', () => {
      this.setup();
    });

    api.on('shutdown', () => {
      this.teardown();
    });
  }

  configureAccessory(platformAccessory: PlatformAccessory): void {
    this.log.ifVerbose(strings.startup.restoringAccessory, platformAccessory.displayName);
    this.homekitAccessories.set(platformAccessory.context.identifier, platformAccessory);
  }

  private teardown() {
    this.dummyAccessories.forEach( accessory => {
      accessory.teardown();
    });
    this.webhookManager.teardown();
    this.conditionManager.teardown();
  }

  private async setup(): Promise<void> {

    await Storage.init(this.api.user.persistPath());

    const keepIdentifiers = new Set<string>();

    const accessories: DummyConfig[] = this.config.accessories || [];
    const groupAccessories = new Map<string, GroupConfig>();

    const history = new History(this.api, this.log);

    const getMatter = (caller: string) => {

      if (!this.api.matter) {
        throw new Error(strings.startup.matterDisabled.replace('%s', caller));
      }

      return this.api.matter;
    };

    for (const accessoryConfig of accessories) {

      if (accessoryConfig.groupName?.length) {
        const groupConfig: GroupConfig = groupAccessories.get(accessoryConfig.groupName) || { accessories: [] };
        groupConfig.accessories.push(accessoryConfig);
        groupAccessories.set(accessoryConfig.groupName, groupConfig);
        continue;
      }

      const id = DummyAccessory.identifier(accessoryConfig);
      keepIdentifiers.add(id);

      const platformAccessory = this.homekitAccessories.get(id) ?? this.createHomeKitAccessory(id, accessoryConfig.name);

      if (platformAccessory.displayName !== accessoryConfig.name) {
        platformAccessory.updateDisplayName(accessoryConfig.name);
      }

      const dependency: DummyAccessoryDependency<DummyConfig> = {
        Service: this.api.hap.Service,
        Characteristic: this.api.hap.Characteristic,
        getMatter,
        platformAccessory,
        config: accessoryConfig,
        conditionManager: this.conditionManager,
        log: this.log,
        history,
        isGrouped: false,
      };

      const dummyAccessory = createDummyAccessory(dependency);
      if (!dummyAccessory) {
        continue;
      }

      if (accessoryConfig.enableWebhook === true || accessoryConfig.enableWebook === true) {
        this.webhookManager.registerWebhooks(dummyAccessory.webhooks);
      }

      this.dummyAccessories.push(dummyAccessory);
    }

    for (const groupName of groupAccessories.keys()) {

      const groupConfig: GroupConfig = groupAccessories.get(groupName)!;

      const id = GroupAccessory.identifier(groupName);
      keepIdentifiers.add(id);

      const platformAccessory = this.homekitAccessories.get(id) ?? this.createHomeKitAccessory(id, groupName);

      const dependency: GroupAccessoryDependency = {
        Service: this.api.hap.Service,
        Characteristic: this.api.hap.Characteristic,
        getMatter,
        platformAccessory: platformAccessory,
        conditionManager: this.conditionManager,
        log: this.log,
        history,
      };

      const groupAccessory = new GroupAccessory(dependency, groupConfig, this.webhookManager);
      this.dummyAccessories.push(groupAccessory);
    }

    this.homekitAccessories.forEach(accessory => {
      if (!keepIdentifiers.has(accessory.context.identifier)) {
        this.removeHomeKitAccessory(accessory);
      }
    });

    this.webhookManager.startServer();

    this.log.always(strings.startup.setupComplete);
  }

  private createHomeKitAccessory(id: string, name: string): PlatformAccessory {

    this.log.always(strings.startup.newAccessory, name);

    const uuid = this.api.hap.uuid.generate(id);

    const accessory = new this.api.platformAccessory(name, uuid);
    accessory.context.identifier = id;

    this.homekitAccessories.set(id, accessory);

    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

    return accessory;
  }

  private removeHomeKitAccessory(platformAccessory: PlatformAccessory) {
    this.log.always(strings.startup.removeAccessory, platformAccessory.displayName);
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [platformAccessory]);
    this.homekitAccessories.delete(platformAccessory.context.identifier);
  }
}