import { AccessoryConfig, AccessoryPlugin, API, Characteristic, CharacteristicValue, Logging, Service } from 'homebridge';

import { PLUGIN_ALIAS, PLUGIN_NAME } from './settings.js';

import { strings } from '../i18n/i18n.js';

import { storageGet, storageSet } from '../tools/storage.js';
import getVersion from '../tools/version.js';

const init = (api: API) => {
  api.registerAccessory(PLUGIN_NAME, PLUGIN_ALIAS, DummySwitch);
};

export default init;

export const SUFFIX_BRIGHTNESS = '_brightness';
export const SUFFIX_STATE = '_state';

class DummySwitch implements AccessoryPlugin {
  private readonly log: Logging | undefined;

  private readonly Service: typeof Service;
  private readonly Characteristic: typeof Characteristic;

  private readonly service: Service;
  private readonly infoService: Service;

  private readonly persistPath: string;

  private readonly name: string;

  private readonly isDimmer: boolean;
  private readonly isStateful: boolean;
  private readonly isReverse: boolean;
  private readonly isRandom: boolean;
  private readonly isResettable: boolean;

  private brightness: CharacteristicValue;

  private readonly timeout: number | undefined;
  private timer: NodeJS.Timeout | undefined = undefined;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.log = config.disableLogging ? undefined : log;

    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.persistPath = api.user.persistPath();

    this.name = config.name;
    this.isDimmer = config.dimmer ?? false;
    this.isReverse = config.reverse ?? false;
    this.isStateful = config.stateful ?? false;
    this.isRandom = config.random ?? false;
    this.isResettable = config.resettable ?? false;
    this.timeout = config.time;

    this.brightness = config.brightness ?? 0;

    let model;
    if (this.isDimmer) {
      this.service = new this.Service.Lightbulb(this.name);
      model = strings.info.dimmer;
    } else {
      this.service = new this.Service.Switch(this.name);
      model = strings.info.switch;
    }

    this.infoService = new this.Service.AccessoryInformation();
    this.infoService
      .setCharacteristic(this.Characteristic.Manufacturer, strings.info.homebridge)
      .setCharacteristic(this.Characteristic.Model, model)
      .setCharacteristic(this.Characteristic.FirmwareRevision, getVersion())
      .setCharacteristic(this.Characteristic.SerialNumber, 'Dummy-' + this.name.replace(/\s/g, '-'));

    this.finishSetup();
  }

  getServices(): Service[] {
    return [this.infoService, this.service];
  }

  private async finishSetup() {

    if (this.isReverse) {
      this.service.setCharacteristic(this.Characteristic.On, true);
    }

    if (this.isStateful) {
      const state = await storageGet(this.persistPath, this.storageKey(SUFFIX_STATE));
      if(!state) {
        this.service.setCharacteristic(this.Characteristic.On, false);
      } else {
        this.service.setCharacteristic(this.Characteristic.On, true);
      }
    }

    if (this.isDimmer) {

      const brightness = await storageGet(this.persistPath, this.storageKey(SUFFIX_BRIGHTNESS));
      if (brightness) {
        this.brightness = Number(brightness);
        this.service.setCharacteristic(this.Characteristic.Brightness, Number(this.brightness));
      } else {
        this.service.setCharacteristic(this.Characteristic.Brightness, 0);
      }

      this.service.getCharacteristic(this.Characteristic.Brightness)
        .onGet(this._getBrightness.bind(this))
        .onSet(this._setBrightness.bind(this));
    }

    this.service.getCharacteristic(this.Characteristic.On)
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
    this.log?.(strings.brightness.set, brightness);
    this.brightness = brightness;
    await storageSet(this.persistPath, this.storageKey(SUFFIX_BRIGHTNESS), brightness.toString());
  };

  private async _setOn(value: CharacteristicValue): Promise<void> {

    if (this.isDimmer) {
      this.log?.('%s / %s', value ? strings.switch.on : strings.switch.off, this.brightness);
    } else {
      this.log?.(value ? strings.switch.on : strings.switch.off);
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
      this.log?.(strings.switch.delay_s, delay / 1000);
    } else {
      this.log?.(strings.switch.delay_ms, delay);
    }

    this.timer = setTimeout(() => {
      this.service.setCharacteristic(this.Characteristic.On, this.isReverse as CharacteristicValue);
    }, delay);
  };
}
