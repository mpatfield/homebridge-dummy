import { CharacteristicValue } from 'homebridge';

import { incrementTimesOpened } from '../characteristic/eve.js';

import { DummyAccessory, DummyAccessoryDependency } from '../base.js';

import { strings } from '../../i18n/i18n.js';

import { HistoryType } from '../../model/history.js';
import { HomeKitType, SensorCharacteristicKey, SensorType } from '../../model/homekit.js';
import { sensorInfoForType } from '../../model/sensor.js';
import { SensorConfig } from '../../model/types.js';
import { Values, Webhook } from '../../model/webhook.js';

export class SensorAccessory extends DummyAccessory<SensorConfig> {

  private active: CharacteristicValue;

  constructor(dependency: DummyAccessoryDependency<SensorConfig>) {
    super(dependency);

    if (this.config.schedule === undefined && this.config.enableWebhook !== true) {
      this.log.warning(strings.sensor.doa, this.displayName);
    }

    this.service.getCharacteristic(this.sensorCharacteristic)
      .onGet(this.getActive.bind(this));

    this.active = (this.isStateful ? this.getProperty(this.sensorInfo.characteristic) : this.defaultState) ?? this.defaultState;
  }

  private get sensorCharacteristic() {
    return this.homekit.Characteristic[this.sensorInfo.characteristic];
  }

  private get sensorInfo() {
    return sensorInfoForType(this.config.type as SensorType);
  }

  private get defaultState() {
    return this.config.type === SensorType.MotionSensor ? false : 0;
  }

  private get activeState() {
    return this.config.type === SensorType.MotionSensor ? true : 1;
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
          return (value ? this.sensorInfo.strings.active :this.sensorInfo.strings.inactive).replace('%s', this.displayName);
        },
        this.config.disableLogging),
    ];
  }

  private async getActive(): Promise<CharacteristicValue> {
    return this.active;
  }

  private async setActive(active: CharacteristicValue, syncOnly: boolean = false) {

    const stateChanged = this.active !== active;
    if (stateChanged) {
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

    if (this.active !== this.defaultState) {
      this.onTriggered(stateChanged);
    } else {
      this.onReset(stateChanged);
    }

    this.service.updateCharacteristic(this.sensorCharacteristic, this.active);
  }

  override async trigger(): Promise<void> {
    await this.setActive(this.activeState);
  }

  override async reset(): Promise<void> {
    if (this.active !== this.defaultState) {
      await this.setActive(this.defaultState);
    }
  }
}