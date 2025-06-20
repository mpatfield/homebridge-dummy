import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';

import { strings } from '../i18n/i18n.js';

import { LegacyAccessoryConfig } from '../model/types.js';

import { Log } from '../tools/log.js';
import { storageGet, storageSet } from '../tools/storage.js';
import getVersion from '../tools/version.js';

export const SUFFIX_BRIGHTNESS = '_brightness';
export const SUFFIX_STATE = '_state';

export const LEGACY_ACCESSORY_NAME = 'DummySwitch';

export class LegacyAccessory {
  private readonly log: Log | undefined;

  private readonly accessoryService: Service;

  private readonly name: string;

  private readonly isDimmer: boolean;
  private readonly isStateful: boolean;
  private readonly isReverse: boolean;
  private readonly isRandom: boolean;
  private readonly isResettable: boolean;

  private brightness: CharacteristicValue;

  private readonly timeout: number | undefined;
  private timer: NodeJS.Timeout | undefined = undefined;

  constructor(
    log: Log,
    accessory: PlatformAccessory,
    config: LegacyAccessoryConfig,
    readonly Service: typeof import('homebridge').Service,
    readonly Characteristic: typeof import('homebridge').Characteristic,
    readonly persistPath: string,
  ) {
    this.log = config.disableLogging ? undefined : log;

    this.name = config.name;

    this.isDimmer = config.dimmer ?? false;
    this.brightness = config.brightness ?? 0;

    this.isStateful = config.stateful ?? false;
    this.isReverse = config.reverse ?? false;

    this.timeout = config.time;
    this.isResettable = config.resettable ?? false;
    this.isRandom = config.random ?? false;

    const model = this.isDimmer ? strings.info.dimmer : strings.info.switch;
    const serviceType = this.isDimmer ? Service.Lightbulb : Service.Switch;

    this.accessoryService = accessory.getService(serviceType) || accessory.addService(serviceType);

    accessory.getService(this.Service.AccessoryInformation)!
      .setCharacteristic(this.Characteristic.Name, this.name)
      .setCharacteristic(this.Characteristic.ConfiguredName, this.name)
      .setCharacteristic(this.Characteristic.Manufacturer, 'Homebridge')
      .setCharacteristic(this.Characteristic.SerialNumber, 'Dummy-' + this.name.replace(/\s/g, '-'))
      .setCharacteristic(this.Characteristic.Model, model)
      .setCharacteristic(this.Characteristic.FirmwareRevision, getVersion());

    this.finishSetup();
  }

  public static identifier(config: LegacyAccessoryConfig): string {
    return `DummySwitch:${config.name}`;
  }

  private async finishSetup() {

    if (this.isReverse) {
      this.accessoryService.setCharacteristic(this.Characteristic.On, true);
    }

    if (this.isStateful) {
      const state = await storageGet(this.persistPath, this.storageKey(SUFFIX_STATE));
      if(!state) {
        this.accessoryService.setCharacteristic(this.Characteristic.On, false);
      } else {
        this.accessoryService.setCharacteristic(this.Characteristic.On, true);
      }
    }

    if (this.isDimmer) {

      const brightness = await storageGet(this.persistPath, this.storageKey(SUFFIX_BRIGHTNESS));
      if (brightness) {
        this.brightness = Number(brightness);
        this.accessoryService.setCharacteristic(this.Characteristic.Brightness, Number(this.brightness));
      } else {
        this.accessoryService.setCharacteristic(this.Characteristic.Brightness, 0);
      }

      this.accessoryService.getCharacteristic(this.Characteristic.Brightness)
        .onGet(this._getBrightness.bind(this))
        .onSet(this._setBrightness.bind(this));
    }

    this.accessoryService.getCharacteristic(this.Characteristic.On)
      .onSet(this._setOn.bind(this));
  }

  private storageKey(suffix: string): string {
    return this.name.replace(/\s/g, '_').toLowerCase() + suffix;
  }

  private randomize(timeout: number | undefined): number | undefined {
    return timeout ? Math.floor(Math.random() * (timeout + 1)) : undefined;
  }

  private async _getBrightness(): Promise<CharacteristicValue> {
    return this.brightness;
  }

  private async _setBrightness(brightness: CharacteristicValue): Promise<void> {
    this.log?.always(strings.brightness.set, brightness);
    this.brightness = brightness;
    await storageSet(this.persistPath, this.storageKey(SUFFIX_BRIGHTNESS), brightness.toString());
  };

  private async _setOn(value: CharacteristicValue): Promise<void> {

    if (this.isDimmer) {
      this.log?.always('%s / %s', value ? strings.switch.on : strings.switch.off, this.brightness);
    } else {
      this.log?.always(value ? strings.switch.on : strings.switch.off);
    }

    if (this.isStateful) {
      await storageSet(this.persistPath, this.storageKey(SUFFIX_STATE), value.toString());
      return;
    }

    if (value === this.isReverse) {
      return;
    }

    if (this.isResettable) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    const delay = this.isRandom ? this.randomize(this.timeout) : this.timeout;
    if (!delay) {
      return;
    }

    if (delay % 1000 === 0) {
      this.log?.always(strings.switch.delay_s, delay / 1000);
    } else {
      this.log?.always(strings.switch.delay_ms, delay);
    }

    this.timer = setTimeout(() => {
      this.accessoryService.setCharacteristic(this.Characteristic.On, this.isReverse as CharacteristicValue);
    }, delay);
  };
}
