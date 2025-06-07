import {
  AccessoryConfig, AccessoryPlugin, API,
  CharacteristicEventTypes, CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue,
  Logging, Service,
} from 'homebridge';

import storage from 'node-persist';

import getVersion from './tools/version.js';

const init = (api: API) => {
  api.registerAccessory('homebridge-dummy', 'DummySwitch', DummySwitch);
};

export default init;

class DummySwitch implements AccessoryPlugin {
  private name: string;

  private api: API;
  private service: Service;
  private infoService: Service;

  private dimmer: boolean;
  private stateful: boolean;
  private reverse: boolean;
  private brightness: CharacteristicValue;
  private random: boolean;
  private resettable: boolean;
  private time: number;

  private brightnessStorageKey: string; 
  
  private disableLogging: boolean;

  private timer: NodeJS.Timeout | null = null;

  constructor(readonly log: Logging, config: AccessoryConfig, api: API) {
    this.name = config.name;
    this.dimmer = config.dimmer;
    this.reverse = config.reverse;
    this.stateful = config.stateful;
    this.brightness = config.brightness;
    this.random = config.random;
    this.resettable = config.resettable;
    this.time = config.time ? config.time : 1000;

    this.brightnessStorageKey = this.name + 'Brightness';

    this.disableLogging = config.disableLogging;
    
    this.api = api;
    let modelString;
    if (this.dimmer) {
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
  
    const cacheDirectory = api.user.persistPath();
    storage.init({ dir: cacheDirectory, forgiveParseErrors: true }).then(() => {

      this.service.getCharacteristic(this.api.hap.Characteristic.On)
        .on(CharacteristicEventTypes.SET, this._setOn.bind(this));
      if (this.dimmer) {
        this.service.getCharacteristic(this.api.hap.Characteristic.Brightness)
          .on(CharacteristicEventTypes.GET, this._getBrightness.bind(this))
          .on(CharacteristicEventTypes.SET, this._setBrightness.bind(this));
      }

      if (this.reverse) {
        this.service.setCharacteristic(this.api.hap.Characteristic.On, true);
      }

      if (this.stateful) {
        storage.getItem(this.name).then( (cachedState) => {
          if((cachedState === undefined) || (cachedState === false)) {
            this.service.setCharacteristic(this.api.hap.Characteristic.On, false);
          } else {
            this.service.setCharacteristic(this.api.hap.Characteristic.On, true);
          }
        });
      }

      if (this.dimmer) {
        storage.getItem(this.brightnessStorageKey).then((cachedBrightness) => {
          if ((cachedBrightness === undefined) || cachedBrightness === 0) {
            this.service.setCharacteristic(this.api.hap.Characteristic.On, false);
            this.service.setCharacteristic(this.api.hap.Characteristic.Brightness, 0);
          } else {
            this.service.setCharacteristic(this.api.hap.Characteristic.On, true);
            this.service.setCharacteristic(this.api.hap.Characteristic.Brightness, cachedBrightness);
          }
        });
      }
    });  
  }

  getServices(): Service[] {
    return [this.infoService, this.service];
  }

  private randomize(time: number) {
    return Math.floor(Math.random() * (time + 1));
  }

  private _getBrightness(callback: CharacteristicGetCallback) {

    if ( ! this.disableLogging ) {
      this.log('Getting ' + 'brightness: ' + this.brightness);
    }

    callback(null, this.brightness);
  }

  private _setBrightness(brightness: CharacteristicValue, callback: CharacteristicSetCallback) {

    if ( ! this.disableLogging ) {
      const msg = 'Setting brightness: ' + brightness;
      this.log(msg);
    }

    this.brightness = brightness;
    storage.setItem(this.brightnessStorageKey, brightness).then( () => {
      callback();
    });
  };

  private _setOn(on: CharacteristicValue, callback: CharacteristicSetCallback) {

    const delay = this.random ? this.randomize(this.time) : this.time;
    let msg = 'Setting switch to ' + on;
    if (this.random && !this.stateful) {
      if (on && !this.reverse || !on && this.reverse) {
        msg = msg + ' (random delay ' + delay + 'ms)';
      }
    }
    if( ! this.disableLogging ) {
      this.log(msg);
    }

    if (on && !this.reverse && !this.stateful) {
      if (this.resettable && this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.service.setCharacteristic(this.api.hap.Characteristic.On, false);
      }, delay);
    } else if (!on && this.reverse && !this.stateful) {
      if (this.resettable && this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.service.setCharacteristic(this.api.hap.Characteristic.On, true);
      }, delay);
    }
  
    if (this.stateful) {
      storage.setItem(this.name, on).then(() => {
        callback();
      });
    } else {
      callback();
    }
  };
}
