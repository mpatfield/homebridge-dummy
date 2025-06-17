import { AccessoryConfig, AccessoryPlugin, API, CharacteristicValue, Logging, Service } from 'homebridge';

import { PLUGIN_ALIAS, PLUGIN_NAME } from './settings.js';

import { STORAGE_KEY_SUFFIX_BRIGHTNESS, STORAGE_KEY_SUFFIX_STATE, storageGet, storageSet } from '../tools/storage.js';
import getVersion from '../tools/version.js';

const init = (api: API) => {
  api.registerAccessory(PLUGIN_NAME, PLUGIN_ALIAS, DummySwitch);
};

export default init;

class DummySwitch implements AccessoryPlugin {
  private log: Logging | undefined;

  private service: Service;
  private infoService: Service;

  private persistPath: string;

  private name: string;

  private isDimmer: boolean | undefined;
  private isStateful: boolean | undefined;
  private isReverse: boolean | undefined;
  private brightness: CharacteristicValue | undefined;
  private isRandom: boolean | undefined;
  private isResettable: boolean | undefined;
  private timeout: number | undefined;
  
  private timer: NodeJS.Timeout | undefined = undefined;

  constructor(log: Logging, config: AccessoryConfig, private readonly api: API) {

    this.persistPath = api.user.persistPath();

    this.name = config.name;
    this.isDimmer = config.dimmer;
    this.isReverse = config.reverse;
    this.isStateful = config.stateful;
    this.brightness = config.brightness;
    this.isRandom = config.random;
    this.isResettable = config.resettable;
    this.timeout = config.time;

    this.log = config.disableLogging ? undefined : log;

    let modelString;
    if (this.isDimmer) {
      this.service = new api.hap.Service.Lightbulb(this.name);
      modelString = 'Dummy Dimmer';
    } else {
      this.service = new api.hap.Service.Switch(this.name);
      modelString = 'Dummy Switch';
    }

    this.infoService = new api.hap.Service.AccessoryInformation();
    this.infoService
      .setCharacteristic(api.hap.Characteristic.Manufacturer, 'Homebridge')
      .setCharacteristic(api.hap.Characteristic.Model, modelString)
      .setCharacteristic(api.hap.Characteristic.FirmwareRevision, getVersion())
      .setCharacteristic(api.hap.Characteristic.SerialNumber, 'Dummy-' + this.name.replace(/\s/g, '-'));

    this.service.getCharacteristic(this.api.hap.Characteristic.On)
      .onSet(this._setOn.bind(this));
    if (this.isDimmer) {
      this.service.getCharacteristic(this.api.hap.Characteristic.Brightness)
        .onGet(this._getBrightness.bind(this))
        .onSet(this._setBrightness.bind(this));
    }

    if (this.isReverse) {
      this.service.setCharacteristic(this.api.hap.Characteristic.On, true);
    }

    if (this.isStateful) {
      storageGet(this.persistPath, this.storageKey(STORAGE_KEY_SUFFIX_STATE)).then( (cachedState) => {
        if(!cachedState) {
          this.service.setCharacteristic(this.api.hap.Characteristic.On, false);
        } else {
          this.service.setCharacteristic(this.api.hap.Characteristic.On, true);
        }
      });
    }

    if (this.isDimmer) {
      storageGet(this.persistPath, this.storageKey(STORAGE_KEY_SUFFIX_BRIGHTNESS)).then((cachedBrightness) => {
        if (!cachedBrightness) {
          this.service.setCharacteristic(this.api.hap.Characteristic.On, false);
          this.service.setCharacteristic(this.api.hap.Characteristic.Brightness, 0);
        } else {
          this.service.setCharacteristic(this.api.hap.Characteristic.On, true);
          this.service.setCharacteristic(this.api.hap.Characteristic.Brightness, Number(cachedBrightness));
        }
      });
    }
  }

  getServices(): Service[] {
    return [this.infoService, this.service];
  }

  private storageKey(suffix: string): string {
    return this.name.replace(/\s/g, '_').toLowerCase() + suffix;
  }

  private randomize(timeout: number | undefined): number | undefined {
    if (!timeout) {
      return;
    }
    
    return Math.floor(Math.random() * (timeout + 1));
  }

  private async _getBrightness(): Promise<CharacteristicValue> {
    this.log?.('Getting ' + 'brightness: ' + this.brightness);
    return this.brightness || 0;
  }

  private async _setBrightness(brightness: CharacteristicValue): Promise<void> {

    const msg = 'Setting brightness: ' + brightness;
    this.log?.(msg);

    this.brightness = brightness;
    await storageSet(this.persistPath, this.storageKey(STORAGE_KEY_SUFFIX_BRIGHTNESS), brightness.toString());
  };

  private async _setOn(value: CharacteristicValue): Promise<void> {

    const delay = this.isRandom ? this.randomize(this.timeout) : this.timeout;
    let msg = 'Setting switch to ' + value;
    if (this.isRandom && !this.isStateful) {
      if (value && !this.isReverse || !value && this.isReverse) {
        msg = msg + ' (random delay ' + delay + 'ms)';
      }
    }

    this.log?.(msg);

    if (value && !this.isReverse && !this.isStateful) {
      if (this.isResettable && this.timer) {
        clearTimeout(this.timer);
        this.timer = undefined;
      }
      if (delay) {
        this.timer = setTimeout(() => {
          this.service.setCharacteristic(this.api.hap.Characteristic.On, false);
        }, delay);
      }
    } else if (!value && this.isReverse && !this.isStateful) {
      if (this.isResettable && this.timer) {
        clearTimeout(this.timer);
        this.timer = undefined;
      }
      if (delay) {
        this.timer = setTimeout(() => {
          this.service.setCharacteristic(this.api.hap.Characteristic.On, true);
        }, delay);
      }
    }
  
    if (this.isStateful) {
      storageSet(this.persistPath, this.storageKey(STORAGE_KEY_SUFFIX_STATE), value.toString());
    }
  };
}
