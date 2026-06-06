import { CharacteristicValue } from 'homebridge';

import { DummyAccessory, DummyAccessoryDependency } from './base.js';

import { strings } from '../i18n/i18n.js';

import { AccessoryType, LockState, HKCharacteristicKey, SensorBehavior }  from '../model/enums.js';
import { LockConfig } from '../model/types.js';
import { Values, Webhook } from '../model/webhook.js';

import { isValid, printableValues } from '../tools/validation.js';

export class LockAccessory extends DummyAccessory<LockConfig> {

  private state: CharacteristicValue;

  constructor(dependency: DummyAccessoryDependency<LockConfig>) {
    super(dependency);

    if (!isValid(LockState, this.config.defaultLockState)) {
      this.log.warning(strings.lock.badDefault, this.displayName, `'${dependency.config.defaultLockState}'`, printableValues(LockState));
    }

    this.state = this.defaultLockState;

    this.service.getCharacteristic(this.homekit.Characteristic.LockTargetState)
      .onGet(this.getState.bind(this))
      .onSet(this.setState.bind(this));

    this.service.getCharacteristic(this.homekit.Characteristic.LockCurrentState)
      .onGet(this.getState.bind(this));

    this.initializeState();
  }

  private async initializeState() {

    if (!this.isStateful) {
      this.service.updateCharacteristic(this.Characteristic.LockTargetState, this.state);
      this.service.updateCharacteristic(this.Characteristic.LockCurrentState, this.state);
      await this.registerStateChange();
      return;
    }

    const state = this.getProperty(HKCharacteristicKey.LockTargetState);
    if (state === undefined) {
      await this.registerStateChange();
      return;
    }

    await this.setState(state);
  }

  override getAccessoryType(): AccessoryType {
    return AccessoryType.LockMechanism;
  }

  override get webhooks(): Webhook[] {
    return [
      new Webhook(this, HKCharacteristicKey.LockTargetState,
        new Values(
          [this.Characteristic.LockTargetState.UNSECURED, this.Characteristic.LockTargetState.SECURED],
          `0 (${strings.config.enumNames.unsecured}), 1 (${strings.config.enumNames.secured})`,
        ),
        () => this.state,
        (value, syncOnly) => {
          this.setState(value, syncOnly);
          return this.logTemplateForCV(value).replace('%s', this.displayName);
        },
        this.config.disableLogging),
    ];
  }

  private get defaultLockState(): CharacteristicValue {
    return this.config.defaultLockState === LockState.UNLOCKED ?
      this.Characteristic.LockTargetState.UNSECURED : this.Characteristic.LockTargetState.SECURED;
  }

  private async registerStateChange() {
    await this.onStateChange(this.state === this.Characteristic.LockTargetState.SECURED ? LockState.LOCKED : LockState.UNLOCKED);
  }

  protected async getState(): Promise<CharacteristicValue> {
    return this.state;
  }

  protected async setState(value: CharacteristicValue, syncOnly: boolean = false): Promise<void> {

    const stateChanged = this.state !== value;
    if (stateChanged) {
      this.logLockState(value);

      this.setProperty(HKCharacteristicKey.LockTargetState, value);

      if (!syncOnly) {
        if (this.config.commandLock && value === this.Characteristic.LockTargetState.SECURED) {
          this.executeCommand(this.config.commandLock);
        } else if (this.config.commandUnlock && value === this.Characteristic.LockTargetState.UNSECURED) {
          this.executeCommand(this.config.commandUnlock);
        }
      }
    }

    this.state = value;

    if (this.state !== this.defaultLockState) {
      this.onTriggered(stateChanged);
    } else {
      this.onReset();
    }

    this.service.updateCharacteristic(this.Characteristic.LockTargetState, this.state);
    this.service.updateCharacteristic(this.Characteristic.LockCurrentState, this.state);

    if (this.sensor) {
      if (this.sensor.behavior === SensorBehavior.MIRROR) {
        this.sensor.active = this.state !== this.defaultLockState;
      } else if (this.sensor.behavior === SensorBehavior.TIMER && this.state !== this.defaultLockState) {
        this.sensor.active = false;
      }
    }

    await this.registerStateChange();
  }

  override async trigger(): Promise<void> {
    const opposite = this.defaultLockState === this.Characteristic.LockTargetState.SECURED ?
      this.Characteristic.LockTargetState.UNSECURED : this.Characteristic.LockTargetState.SECURED;
    await this.setState(opposite);
  }

  override async reset(): Promise<void> {
    if (this.state !== this.defaultLockState) {
      await this.setState(this.defaultLockState);
      if (this.sensor?.behavior === SensorBehavior.TIMER) {
        this.sensor.active = true;
      }
    }
  }

  private logTemplateForCV(value: CharacteristicValue): string {
    return value === this.Characteristic.LockTargetState.SECURED ? strings.lock.secured : strings.lock.unsecured;
  }


  protected logLockState(value: CharacteristicValue) {
    this.logIfDesired(this.logTemplateForCV(value));
  }
}
