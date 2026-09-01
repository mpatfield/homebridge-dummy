import { exec, ExecException } from 'child_process';
import { CharacteristicValue, EndpointType, MatterAccessory, MatterAPI, Service } from 'homebridge';
import { promisify } from 'util';

import { PLATFORM_NAME, PLUGIN_ALIAS } from '../homebridge/settings.js';

import { SensorAddon } from './sensor/addon.js';

import { ConditionManager } from '../conditions/conditions.js';

import { strings } from '../i18n/i18n.js';

import { AccessoryState, Protocol, TimeUnits } from '../model/enums.js';
import { CharacteristicKey, HomeKitType } from '../model/homekit.js';
import { History, HistoryEntry, HistoryType } from '../model/history.js';
import { MATTER_SERIAL_MAX_LEN, MatterClusterKey, MatterType, MatterValue, MatterValueKey } from '../model/matter.js';
import { NotificationManager, NotificationType } from '../model/notification.js';
import { CharacteristicType, DummyConfig, HomeKitAccessory, ServiceType } from '../model/types.js';
import { Webhook } from '../model/webhook.js';

import Limiter from '../timeout/limiter.js';
import { Schedule } from '../timeout/schedule.js';

import { Log } from '../tools/log.js';
import { Storage } from '../tools/storage.js';
import { assert } from '../tools/validation.js';
import getVersion from '../tools/version.js';

type HomeKit = { Service: ServiceType, Characteristic: CharacteristicType, accessory: HomeKitAccessory}

export type GetHomeKit = () => HomeKit | undefined;
export type GetMatter = () => MatterAPI | undefined;

export type DummyAccessoryDependency<C extends DummyConfig> = {
  protocol: Protocol,
  getHomeKit: GetHomeKit;
  getMatter: GetMatter,
  config: C,
  conditionManager: ConditionManager,
  log: Log,
  history?: History
  isGrouped: boolean,
}

export type DummyAddonDependency = {
  identifier: string,
  caller: string,
  log: Log,
  historyEnabled: boolean,
  disableLogging: boolean,
}

export type OnRecordHistory = (type: HistoryType, entry: HistoryEntry, updateLastActivation: boolean) => void

export abstract class DummyAccessory<C extends DummyConfig> implements MatterAccessory {

  private _UUID?: string;

  public readonly manufacturer = PLATFORM_NAME;
  public readonly model: string;
  public readonly serialNumber: string;
  public readonly softwareVersion: string = getVersion();

  protected sensor?: SensorAddon;

  public static identifier(config: DummyConfig): string {
    return config.id ?? `${PLATFORM_NAME}:${config.type}:${config.name.replace(/\s+/g,'')}`;
  }

  private readonly _service?: Service;

  private readonly _schedule?: Schedule;
  private readonly _autoReset?: Schedule;
  private readonly _notification?: NotificationManager;
  private readonly _limiter?: Limiter;
  private readonly _syncSchedule?: Schedule;

  private readonly execAsync = promisify(exec);

  constructor(
    private readonly dependency: DummyAccessoryDependency<C>,
  ) {

    const name = dependency.config.name;

    this.model = dependency.config.type;
    this.serialNumber = this.identifier.length <= MATTER_SERIAL_MAX_LEN ? this.identifier : this.identifier.substring(0, MATTER_SERIAL_MAX_LEN - 1) + '…';

    if (dependency.protocol === Protocol.HomeKit) {
      const sensorDependency = { ...this.addonDependency, getHomeKit: dependency.getHomeKit };
      this.sensor = SensorAddon.new(sensorDependency, this.recordHistory.bind(this), dependency.config.sensor);
    }

    this._schedule = Schedule.new(this.addonDependency, dependency.config.schedule, strings.schedule, 'Schedule', this.trigger.bind(this));

    this._autoReset = Schedule.new(this.addonDependency, dependency.config.autoReset, strings.autoReset, 'AutoReset', this.reset.bind(this));

    this._notification = NotificationManager.new(this.addonDependency, dependency.config.notification);

    this._limiter = Limiter.new(this.addonDependency, dependency.config.limiter);

    if (dependency.config.commandSync !== undefined && assert(dependency.log, dependency.config.name, dependency.config, 'syncSchedule')) {
      this._syncSchedule = Schedule.new(this.addonDependency, dependency.config.syncSchedule, strings.syncSchedule, 'SyncSchedule', this.onSync.bind(this));
    }

    dependency.conditionManager.register(name, this.identifier, dependency.config.conditions,
      this.trigger.bind(this), this._autoReset ? undefined : this.reset.bind(this), dependency.config.disableLogging === true);


    if (dependency.protocol !== Protocol.HomeKit) {
      return;
    }

    const serviceInstance = this.homekit.Service[this.getHomeKitType()];

    if (dependency.isGrouped) {

      let accessoryService = this.homekit.accessory.getServiceById(serviceInstance, this.identifier);
      if (!accessoryService) {
        accessoryService = this.homekit.accessory.addService(serviceInstance, name, this.identifier);
        accessoryService.addOptionalCharacteristic(this.homekit.Characteristic.ConfiguredName);
        accessoryService.setCharacteristic(this.homekit.Characteristic.ConfiguredName, name);
      }

      this._service = accessoryService;

      return;
    }

    this.homekit.accessory.getService(this.homekit.Service.AccessoryInformation)!
      .setCharacteristic(this.homekit.Characteristic.Name, name)
      .setCharacteristic(this.homekit.Characteristic.ConfiguredName, name)
      .setCharacteristic(this.homekit.Characteristic.Manufacturer, PLUGIN_ALIAS)
      .setCharacteristic(this.homekit.Characteristic.Model, dependency.config.type)
      .setCharacteristic(this.homekit.Characteristic.SerialNumber, this.identifier)
      .setCharacteristic(this.homekit.Characteristic.FirmwareRevision, getVersion());

    this._service = this.homekit.accessory.getService(serviceInstance) || this.homekit.accessory.addService(serviceInstance);

    for (const type of Object.values(HomeKitType)) {
      const existingService = this.homekit.accessory.getService(this.homekit.Service[type]);
      if (existingService && type !== this.getHomeKitType() && type !== this.config.sensor?.type) {
        this.homekit.accessory.removeService(existingService);
      }
    }
  }

  protected abstract getHomeKitType(): HomeKitType;

  public get service(): Service {
    if (this._service === undefined) {
      throw new Error(`${this.displayName} unable to get fetch Service instance`);
    }
    return this._service;
  }

  protected getMatterType(): MatterType | undefined {
    return undefined;
  };

  public get UUID(): string {
    if (!this._UUID) {
      this._UUID = this.matter.uuid.generate(this.identifier);
    }
    return this._UUID;
  }

  public get deviceType(): EndpointType {

    const type = this.getMatterType();
    if (type !== undefined) {
      return this.matter.deviceTypes[type];
    }

    throw new Error(`${this.getMatterType.name} not implemented for ${this.getHomeKitType()}`);
  }

  public get clusters(): MatterAccessory['clusters'] | undefined {
    return undefined;
  }

  public get handlers(): MatterAccessory['handlers'] | undefined {
    return undefined;
  }

  public get parts(): MatterAccessory['parts'] | undefined {
    return undefined; // Use this for sensors and groups
  }

  public get context(): Record<string, unknown> {
    return {
      UUID: this.UUID,
      deviceType: this.deviceType,
      displayName: this.displayName,
      serialNumber: this.serialNumber,
      manufacturer: this.manufacturer,
      model: this.model,
      softwareVersion: this.softwareVersion,
      clusters: this.clusters,
      handlers: this.handlers,
      parts: this.parts,
    };
  }

  public toMatterAccessory(): MatterAccessory {
    return {
      UUID: this.UUID,
      displayName: this.displayName,
      deviceType: this.deviceType,
      serialNumber: this.serialNumber,
      manufacturer: this.manufacturer,
      model: this.model,
      context: this.context,
      clusters: this.clusters,
      handlers: this.handlers,
      parts: this.parts,
    };
  }

  protected abstract trigger(): Promise<void>;

  protected abstract reset(): Promise<void>;

  public get subtype(): string | undefined {
    return this.service.subtype;
  }

  public teardown() {
    this._schedule?.teardown();
    this._autoReset?.teardown();
    this._limiter?.teardown();
    this._syncSchedule?.teardown();
  }

  protected ifHomeKit(perform: () => (void)) {
    if (this.dependency.protocol === Protocol.HomeKit) {
      perform();
    }
  }

  protected bifurcate(homekit?: () => (void), matter?: () => (void)) {
    switch (this.dependency.protocol) {
    case Protocol.HomeKit:
      return homekit?.();
    case Protocol.Matter:
      return matter?.();
    }
  }

  protected get homekit(): HomeKit {
    const homekit = this.dependency.getHomeKit();
    if (homekit === undefined) {
      throw new Error(`${this.displayName} unable to get HomeKit instance`);
    }
    return homekit;
  }

  private get matter(): MatterAPI {
    const matter = this.dependency.getMatter();
    if (matter === undefined) {
      throw new Error(`${this.displayName} unable to get MatterAPI instance`);
    }
    return matter;
  }

  protected updateMatter(clusterKey: MatterClusterKey, valueKey: MatterValueKey, value: MatterValue) {
    this.matter.updateAccessoryState(this.UUID, clusterKey, { [valueKey]: value });
  }

  public abstract get webhooks(): Webhook[];

  protected get config(): C {
    return this.dependency.config;
  }

  protected get addonDependency(): DummyAddonDependency {
    return {
      identifier: this.identifier,
      caller: this.dependency.config.name,
      log: this.dependency.log,
      historyEnabled: this.dependency.config.enableHistory === true,
      disableLogging: this.dependency.config.disableLogging === true,
    };
  }

  public get historyEnabled(): boolean {
    return this.dependency.history !== undefined && this.dependency.config.enableHistory === true;
  }

  public get identifier(): string {
    return DummyAccessory.identifier(this.config);
  }

  public get displayName(): string {
    return this.config.name;
  }

  public get homekitAccessory(): HomeKitAccessory {
    return this.homekit.accessory;
  }

  protected get log(): Log {
    return this.dependency.log;
  }

  protected get Characteristic(): CharacteristicType {
    return this.homekit.Characteristic;
  }

  protected get isStateful(): boolean {
    return this.config.resetOnRestart !== true;
  }

  public getProperty(key: CharacteristicKey): CharacteristicValue | undefined {
    return Storage.get(this.identifier, key);
  }

  public setProperty(key: CharacteristicKey, value: CharacteristicValue) {
    Storage.set(this.identifier, key, value);
  }

  protected setAutoResetTimeout(rawTime: number, units: TimeUnits) {
    this._autoReset?.setTimeout(rawTime, units);
  }

  protected onTriggered(stateChanged: boolean = true) {

    const delay = this._autoReset?.startTimeout();
    if (delay !== undefined) {
      this.onTimerStarted(delay);
    }

    if (stateChanged) {
      this._notification?.notify(NotificationType.TRIGGER);
    }

    this._limiter?.start(this.reset.bind(this));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onTimerStarted(_delay: number) {}

  protected onReset(stateChanged: boolean = true) {
    this._schedule?.startTimeout();
    this._autoReset?.cancel();
    this._limiter?.cancel();

    if (stateChanged) {
      this._notification?.notify(NotificationType.RESET);
    }
  }

  protected async executeCommand(command: string): Promise<string | undefined> {

    const propertiesEnv = Storage.copy().reduce((accumulator, [identifier, values]) => {
      values.forEach(([key, value]) => {
        identifier = identifier.replace(/[^a-zA-Z0-9]/g, '');
        if (identifier.length) {
          const envKey = `Dummy_${identifier}_${key}`;
          accumulator[envKey] = String(value);
        }
      });
      return accumulator;
    }, {} as { [key: string]: string });

    const execOptions = {
      env: {
        ...process.env,
        ...propertiesEnv,
      },
    };

    try {
      const result = await this.execAsync(command, execOptions);

      if (result.stdout === undefined) {
        this.log.ifVerbose(`execAsync(): typeof=${typeof result}, keys=${result && Object.keys(result)}, stdout=${JSON.stringify(result?.stdout)}`);
      }

      const output = result.stdout ? result.stdout.trim() : '';
      this.logIfDesired(`${strings.command.executed}: %s\n%s`, command, output);

      return output;

    } catch (err) {

      if (!this.isExecException(err)) {
        const message = err instanceof Error ? err.message : JSON.stringify(err);
        this.log.error(`${strings.command.error}: %s`, this.displayName, message);
        return;
      }

      const exitCode = err.code ?? -1;

      const output = (err.stdout ?? '').trim();
      const error = (err.stderr ?? '').trim();

      if (exitCode === 0) {
        if (output) {
          this.logIfDesired(`${strings.command.executed}: %s\n%s`, command, output);
        }
      } else {
        this.log.error(`${strings.command.error}: %s (%s)`, this.displayName, command, exitCode, error ? `\n${error}` : undefined);
      }
    }
  }

  private async onSync(): Promise<void> {

    if (this.config.commandSync === undefined) {
      throw new Error(`Trying to run ${this.onSync.name} without a sync command`);
    }

    const result = await this.executeCommand(this.config.commandSync);
    if (!result) {
      this.log.error(strings.command.badSyncCommand, this.displayName);
      return;
    }

    try {

      const data = JSON.parse(result);

      Object.keys(data).forEach(key => {

        const webhook = this.webhooks.find(webhook => webhook.characteristic === key);
        if (webhook === undefined) {
          this.log.warning(strings.command.unsupportedCharacteristic, this.displayName, `'${key}'`);
          return;
        }

        const value = data[key];

        const result = webhook.validateValue(value);
        if (result instanceof Error) {
          this.log.error(`${this.displayName} - ${result.message}`);
          return;
        }

        webhook.setter(value, true);
      });

    } catch {
      this.log.error(strings.command.badSyncCommand, this.displayName);
    }
  }

  private isExecException(err: unknown): err is ExecException {
    return err instanceof Error &&
      'code' in err &&
      typeof err.code === 'number' &&
      'stdout' in err &&
      typeof err.stdout === 'string' &&
      'stderr' in err &&
      typeof err.stderr === 'string';
  }

  protected async onStateChange(state: AccessoryState) {
    await this.dependency.conditionManager.onStateChange(this.identifier, state);
  }

  protected recordHistory(type: HistoryType, entry: HistoryEntry, updateLastActivation: boolean = false) {
    this.dependency.history?.record(this, type, entry, updateLastActivation);
  }

  public logIfDesired(message: string, ...parameters: (string | number)[]) {

    if (this.config.disableLogging) {
      return;
    }

    this.log.always(message, this.displayName, ...parameters);
  }
}