import { CharacteristicValue } from 'homebridge';

import { DummyAccessory, DummyAccessoryDependency } from '../base.js';

import { HomeKitType, SensorCharacteristicKey, SensorType } from '../../model/homekit.js';
import { sensorInfoForType } from '../../model/sensor.js';
import { SensorConfig } from '../../model/types.js';
import { Values, Webhook } from '../../model/webhook.js';
import { HistoryType } from '../../model/history.js';
import { incrementTimesOpened } from '../characteristic/eve.js';

export class SensorAccessory extends DummyAccessory<SensorConfig> {

  private active: CharacteristicValue = 0;

  constructor(dependency: DummyAccessoryDependency<SensorConfig>) {
    super(dependency);

    this.service.getCharacteristic(this.sensorCharacteristic)
      .onGet(this.getActive.bind(this));

    this.active = (this.isStateful ? this.getProperty(this.sensorInfo.characteristic) : 0) ?? 0;
  }

  private get sensorCharacteristic() {
    return this.homekit.Characteristic[this.sensorInfo.characteristic];
  }

  private get sensorInfo() {
    return sensorInfoForType(this.config.type as SensorType);
  }

  override getHomeKitType(): HomeKitType {
    return this.config.type;
  }

  override get webhooks(): Webhook[] {

    const values = this.config.type === SensorType.MotionSensor ? [true, false] : [1, 0];

    return [
      new Webhook(this, this.sensorInfo.characteristic,
        new Values(values, `${values[0]} (${this.sensorInfo.strings.labelActive}), ${values[1]} (${this.sensorInfo.strings.labelInactive})`),
        () => this.active,
        (value, syncOnly) => {
          this.setActive(value, syncOnly);
          return value ? this.sensorInfo.strings.active :this.sensorInfo.strings.inactive;
        },
        this.config.disableLogging),
    ];
  }

  private async getActive(): Promise<CharacteristicValue> {
    return this.active;
  }

  private async setActive(active: CharacteristicValue, syncOnly: boolean = false) {

    if (this.active !== active) {
      this.logIfDesired(active ? this.sensorInfo.strings.active :this.sensorInfo.strings.inactive);

      this.setProperty(this.sensorInfo.characteristic, active);

      if (!syncOnly) {
        if (this.config.commandActive && active) {
          this.executeCommand(this.config.commandActive);
        } else if (this.config.commandInactive && !active) {
          this.executeCommand(this.config.commandInactive);
        }
      }

      if (this.sensorInfo.characteristic === SensorCharacteristicKey.ContactSensorState) {
        this.recordHistory(HistoryType.DOOR, { status: active ? 1 : 0 }, true);
        if (this.historyEnabled && active) {
          incrementTimesOpened(this);
        }
      } else if (this.sensorInfo.characteristic === SensorCharacteristicKey.MotionDetected) {
        this.recordHistory(HistoryType.MOTION, { status: active ? 1 : 0 }, true);
      }
    }

    this.active = active;

    this.service.updateCharacteristic(this.sensorCharacteristic, this.active);
  }

  override async trigger(): Promise<void> {
    throw new Error(`${this.trigger.name} is unsupported for ${SensorAccessory.name}`);
  }

  override async reset(): Promise<void> {
    throw new Error(`${this.reset.name} is unsupported for ${SensorAccessory.name}`);
  }
}