import { exec, ExecException } from 'child_process';
import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { promisify } from 'util';

import { PLATFORM_NAME, PLUGIN_ALIAS } from '../homebridge/settings.js';

import { SensorAccessory } from './sensor/sensor.js';

import { strings } from '../i18n/i18n.js';

import { ConditionManager } from '../model/conditions.js';
import { AccessoryState, AccessoryType, CharacteristicKey, TimeUnits } from '../model/enums.js';
import { History, HistoryEntry, HistoryType } from '../model/history.js';
import { NotificationManager } from '../model/notification.js';
import { CharacteristicType, DummyConfig, ServiceType } from '../model/types.js';
import { Webhook } from '../model/webhook.js';

import Limiter from '../timeout/limiter.js';
import { Schedule } from '../timeout/schedule.js';

import { Log } from '../tools/log.js';
import { Storage } from '../tools/storage.js';
import { assert } from '../tools/validation.js';
import getVersion from '../tools/version.js';

export type DummyAccessoryDependency<C extends DummyConfig> = {
  Service: ServiceType,
  Characteristic: CharacteristicType,
  platformAccessory: PlatformAccessory,
  config: C,
  conditionManager: ConditionManager,
  log: Log,
  history: History
  isGrouped: boolean,
}

export type DummyAddonDependency = {
  Service: ServiceType,
  Characteristic: CharacteristicType,
  platformAccessory: PlatformAccessory,
  identifier: string,
  caller: string,
  log: Log,
  historyEnabled: boolean,
  disableLogging: boolean,
}

export type OnRecordHistory = (type: HistoryType, entry: HistoryEntry, updateLastActivation: boolean) => void

export abstract class DummyAccessory<C extends DummyConfig> {

  protected sensor?: SensorAccessory;

  public static identifier(config: DummyConfig): string {
    return config.id ?? `${PLATFORM_NAME}:${config.type}:${config.name.replace(/\s+/g,'')}`;
  }

  public readonly service: Service;

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

    this.sensor = SensorAccessory.new(this.addonDependency, this.recordHistory.bind(this), dependency.config.sensor);

    this._schedule = Schedule.new(this.addonDependency, dependency.config.schedule, strings.schedule, 'Schedule', this.trigger.bind(this));

    this._autoReset = Schedule.new(this.addonDependency, dependency.config.autoReset ?? dependency.config.timer,
      strings.autoReset, 'AutoReset', this.reset.bind(this));

    this._notification = NotificationManager.new(this.addonDependency, dependency.config.notification);

    this._limiter = Limiter.new(this.addonDependency, dependency.config.limiter);

    if (dependency.config.commandSync !== undefined && assert(dependency.log, dependency.config.name, dependency.config, 'syncSchedule')) {
      this._syncSchedule = Schedule.new(this.addonDependency, dependency.config.syncSchedule, strings.syncSchedule, 'SyncSchedule', this.onSync.bind(this));
    }

    dependency.conditionManager.register(name, this.identifier, dependency.config.conditions,
      this.trigger.bind(this), this._autoReset ? undefined : this.reset.bind(this), dependency.config.disableLogging === true);

    const serviceInstance = dependency.Service[this.getAccessoryType()];

    if (dependency.isGrouped) {

      let accessoryService = dependency.platformAccessory.getServiceById(serviceInstance, this.identifier);
      if (!accessoryService) {
        accessoryService = dependency.platformAccessory.addService(serviceInstance, name, this.identifier);
        accessoryService.addOptionalCharacteristic(dependency.Characteristic.ConfiguredName);
        accessoryService.setCharacteristic(dependency.Characteristic.ConfiguredName, name);
      }

      this.service = accessoryService;

      return;
    }

    dependency.platformAccessory.getService(dependency.Service.AccessoryInformation)!
      .setCharacteristic(dependency.Characteristic.Name, name)
      .setCharacteristic(dependency.Characteristic.ConfiguredName, name)
      .setCharacteristic(dependency.Characteristic.Manufacturer, PLUGIN_ALIAS)
      .setCharacteristic(dependency.Characteristic.Model, dependency.config.type)
      .setCharacteristic(dependency.Characteristic.SerialNumber, this.identifier)
      .setCharacteristic(dependency.Characteristic.FirmwareRevision, getVersion());

    this.service = dependency.platformAccessory.getService(serviceInstance) || dependency.platformAccessory.addService(serviceInstance);

    for (const type of Object.values(AccessoryType)) {
      const existingService = dependency.platformAccessory.getService(dependency.Service[type]);
      if (existingService && type !== this.getAccessoryType()) {
        dependency.platformAccessory.removeService(existingService);
      }
    }
  }

  protected abstract getAccessoryType(): AccessoryType;

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

  public abstract get webhooks(): Webhook[];

  protected get config(): C {
    return this.dependency.config;
  }

  protected get addonDependency(): DummyAddonDependency {
    return {
      Service: this.dependency.Service,
      Characteristic: this.dependency.Characteristic,
      platformAccessory: this.dependency.platformAccessory,
      identifier: this.identifier,
      caller: this.dependency.config.name,
      log: this.dependency.log,
      historyEnabled: this.dependency.config.enableHistory === true,
      disableLogging: this.dependency.config.disableLogging === true,
    };
  }

  public get historyEnabled(): boolean {
    return this.dependency.config.enableHistory === true;
  }

  public get identifier(): string {
    return DummyAccessory.identifier(this.config);
  }

  public get name(): string {
    return this.config.name;
  }

  public get platformAccessory(): PlatformAccessory {
    return this.dependency.platformAccessory;
  }

  protected get log(): Log {
    return this.dependency.log;
  }

  protected get Characteristic(): CharacteristicType {
    return this.dependency.Characteristic;
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
      this._notification?.notify();
    }

    this._limiter?.start(this.reset.bind(this));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onTimerStarted(_delay: number) {}

  protected onReset() {
    this._schedule?.startTimeout();
    this._autoReset?.cancel();
    this._limiter?.cancel();
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
      const { stdout } = await this.execAsync(command, execOptions);
      const output = stdout.trim();

      if (output !== undefined) {
        this.logIfDesired(`${strings.command.executed}: %s\n%s`, command, output);
      }

      return output;

    } catch (err) {

      if (!this.isExecException(err)) {
        const message = err instanceof Error ? err.message : JSON.stringify(err);
        this.log.error(`${strings.command.error}: %s`, this.name, message);
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
        this.log.error(`${strings.command.error}: %s (%s)`, this.name, command, exitCode, error ? `\n${error}` : undefined);
      }
    }
  }

  private async onSync(): Promise<void> {

    if (this.config.commandSync === undefined) {
      throw new Error(`Trying to run ${this.onSync.name} without a sync command`);
    }

    const result = await this.executeCommand(this.config.commandSync);
    if (!result) {
      this.log.error(strings.command.badSyncCommand, this.name);
      return;
    }

    try {

      const data = JSON.parse(result);

      Object.keys(data).forEach(key => {

        const webhook = this.webhooks.find(webhook => webhook.characteristic === key);
        if (webhook === undefined) {
          this.log.warning(strings.command.unsupportedCharacteristic, this.name, `'${key}'`);
          return;
        }

        const value = data[key];

        const result = webhook.validateValue(value);
        if (result instanceof Error) {
          this.log.error(`${this.name} - ${result.message}`);
          return;
        }

        const log = webhook.setter(value, true);
        this.logIfDesired(log);
      });

    } catch {
      this.log.error(strings.command.badSyncCommand, this.name);
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
    this.dependency.history.record(this, type, entry, updateLastActivation);
  }

  public logIfDesired(message: string, ...parameters: (string | number)[]) {

    if (this.config.disableLogging) {
      return;
    }

    this.log.always(message, this.name, ...parameters);
  }
}