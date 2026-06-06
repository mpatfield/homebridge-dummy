import { CharacteristicValue, Service } from 'homebridge';

import { DummyAddonDependency, GetHomeKit, OnRecordHistory } from '../base.js';

import { EveCharacteristicHost, incrementTimesOpened, setupTimesOpened } from '../characteristic/eve.js';

import { strings } from '../../i18n/i18n.js';

import { EveCharacteristicKey, SensorType, SensorCharacteristic, SensorBehavior }  from '../../model/enums.js';
import { HistoryType } from '../../model/history.js';
import { ServiceType, SensorConfig, HomeKitAccessory, CharacteristicType } from '../../model/types.js';

import { Timeout } from '../../timeout/timeout.js';

import { Storage } from '../../tools/storage.js';
import { assert, isValid, printableValues } from '../../tools/validation.js';

type SensorStrings = { active: string, inactive: string };
type SensorInfo = { characteristic: SensorCharacteristic, strings: SensorStrings };

const INFO_MAP: { [key in SensorType]: SensorInfo } = {
  [SensorType.CarbonDioxideSensor]: { characteristic: SensorCharacteristic.CarbonDioxideDetected, strings: strings.sensor.carbonDioxide },
  [SensorType.CarbonMonoxideSensor]: { characteristic: SensorCharacteristic.CarbonMonoxideDetected, strings: strings.sensor.carbonMonoxide },
  [SensorType.ContactSensor]: { characteristic: SensorCharacteristic.ContactSensorState, strings: strings.sensor.contact },
  [SensorType.LeakSensor]: { characteristic: SensorCharacteristic.LeakDetected, strings: strings.sensor.leak },
  [SensorType.MotionSensor]: { characteristic: SensorCharacteristic.MotionDetected, strings: strings.sensor.motion },
  [SensorType.OccupancySensor]: { characteristic: SensorCharacteristic.OccupancyDetected, strings: strings.sensor.occupancy },
  [SensorType.SmokeSensor]: { characteristic: SensorCharacteristic.SmokeDetected, strings: strings.sensor.smoke },
};

type SensorAccessoryDependency = DummyAddonDependency & {
  getHomeKit: GetHomeKit,
}

export class SensorAccessory extends Timeout implements EveCharacteristicHost {

  public readonly service: Service;

  private _active: number = 0;

  static new(dependency: SensorAccessoryDependency, historyRecorder: OnRecordHistory, sensor?: SensorConfig): SensorAccessory | undefined {

    if (sensor) {

      if (!assert(dependency.log, `${dependency.caller} \`sensor\``, sensor, 'type')) {
        return;
      }

      if (!isValid(SensorType, sensor.type)) {
        dependency.log.error(strings.sensor.badType, dependency.caller, `'${sensor.type}'`, printableValues(SensorType));
        return;
      }

      if (!isValid(SensorBehavior, sensor.behavior)) {
        dependency.log.error(strings.sensor.badBehavior, dependency.caller, `'${sensor.behavior}'`, printableValues(SensorBehavior));
        return;
      }

      return new SensorAccessory(sensor, dependency, historyRecorder);
    }

    const homekit = dependency.getHomeKit();
    if (homekit === undefined) {
      throw new Error(`${dependency.caller} sensor unable to get fetch HomeKit`);
    }

    SensorAccessory.removeUnwantedServices(homekit.Service, homekit.accessory);

    return;
  }

  private static removeUnwantedServices(Service: ServiceType, homekitAccessory: HomeKitAccessory, keep?: SensorType) {
    for (const type of Object.values(SensorType)) {
      if (type === keep) {
        continue;
      }

      const existingService = homekitAccessory.getService(Service[type]);
      if (existingService) {
        homekitAccessory.removeService(existingService);
      }
    }
  }

  private Characteristic: CharacteristicType;

  private constructor(private readonly config: SensorConfig, dependency: SensorAccessoryDependency, private readonly historyRecorder: OnRecordHistory) {
    super(dependency);

    const homekit = dependency.getHomeKit();
    if (homekit === undefined) {
      throw new Error(`${dependency.caller} sensor unable to get fetch HomeKit`);
    }

    this.Characteristic = homekit.Characteristic;

    this.service = homekit.accessory.getService(homekit.Service[config.type]) ||
      homekit.accessory.addService(homekit.Service[config.type]);

    const characteristicInstance = homekit.Characteristic[this.sensorInfo.characteristic];
    this.service.getCharacteristic(characteristicInstance)
      .onGet(this.onGet.bind(this));

    if (dependency.historyEnabled && this.sensorInfo.characteristic === SensorCharacteristic.ContactSensorState) {
      setupTimesOpened(this);
    }

    SensorAccessory.removeUnwantedServices(homekit.Service, homekit.accessory, config.type);
  }

  private async onGet(): Promise<CharacteristicValue> {
    return this._active;
  }

  private get sensorInfo(): SensorInfo {
    return INFO_MAP[this.config.type];
  }

  public get behavior(): SensorBehavior {

    if (this.config.timerControlled === true) {
      return SensorBehavior.TIMER;
    }

    return this.config.behavior ?? SensorBehavior.MIRROR;
  }

  public get active(): boolean {
    return this._active === 1;
  }

  public set active(isActive: boolean) {

    this.reset();

    if (this.active === isActive) {
      return;
    }

    this._active = isActive ? 1 : 0;

    if (this.sensorInfo.characteristic === SensorCharacteristic.ContactSensorState) {
      this.historyRecorder(HistoryType.DOOR, { status: isActive ? 1 : 0 }, true);
      if (this.dependency.historyEnabled && isActive) {
        incrementTimesOpened(this);
      }
    } else if (this.sensorInfo.characteristic === SensorCharacteristic.MotionDetected) {
      this.historyRecorder(HistoryType.MOTION, { status: isActive ? 1 : 0 }, true);
    }

    const characteristicInstance = this.Characteristic[this.sensorInfo.characteristic];
    this.service.updateCharacteristic(characteristicInstance, this._active);

    this.logIfDesired(isActive ? this.sensorInfo.strings.active :this.sensorInfo.strings.inactive);

    if (this.behavior === SensorBehavior.TIMER && this.active) {
      this.timeout = setTimeout( () => {
        this.active = false;
      }, 1000);
    }
  }

  public getProperty(key: EveCharacteristicKey): CharacteristicValue | undefined {
    return Storage.get(this.dependency.identifier, key);
  }

  public setProperty(key: EveCharacteristicKey, value: CharacteristicValue) {
    Storage.set(this.dependency.identifier, key, value);
  }
}