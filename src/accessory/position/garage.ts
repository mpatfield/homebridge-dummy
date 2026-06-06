import { CharacteristicValue } from 'homebridge';

import { DEFAULT_OPEN_CLOSE_DURATION, PositionAccessory } from './position.js';

import { DummyAccessoryDependency } from '../base.js';

import { TimeUnits } from '../../model/enums.js';
import { HKCharacteristicKey, HomeKitType } from '../../model/homekit.js';
import { GarageDoorConfig } from '../../model/types.js';
import { Values } from '../../model/webhook.js';

import { getDelay } from '../../timeout/timeout.js';

import { assert } from '../../tools/validation.js';

export class GarageDoorAccessory extends PositionAccessory<GarageDoorConfig> {

  private _currentPosition?: CharacteristicValue;

  private intervalTimeout?: NodeJS.Timeout;

  constructor(dependency: DummyAccessoryDependency<GarageDoorConfig>) {
    super(dependency);

    this.service.getCharacteristic(this.homekit.Characteristic.ObstructionDetected)
      .onGet( async () => false );
  }

  override getHomeKitType(): HomeKitType {
    return HomeKitType.GarageDoorOpener;
  }

  override get hasPositionState() {
    return false;
  }

  override get positionClosed() {
    return this.Characteristic.TargetDoorState.CLOSED;
  }

  override get positionOpen() {
    return this.Characteristic.TargetDoorState.OPEN;
  }

  override get stateStorageKey() {
    return HKCharacteristicKey.TargetDoorState;
  }

  override get targetCharacteristic() {
    return this.Characteristic.TargetDoorState;
  }

  override get currentCharacteristic() {
    return this.Characteristic.CurrentDoorState;
  }

  override get webhookCommand() {
    return HKCharacteristicKey.TargetDoorState;
  }

  override get webhookValidValues(): Values {
    return new Values([this.Characteristic.TargetDoorState.OPEN, this.Characteristic.TargetDoorState.CLOSED], '0 (OPEN), 1 (CLOSED)');
  }

  protected get currentPosition(): CharacteristicValue {
    return this._currentPosition ?? super.currentPosition;
  }

  override onTargetPositionChanged(_oldValue: number, newValue: number) {

    if (this.config.simulation === undefined
      || !assert(this.log, this.displayName, this.config.simulation, 'enabled')
      || this.config.simulation.enabled !== true) {
      return;
    }

    this.clearTimeout();

    this._currentPosition = newValue === this.positionClosed ? this.currentCharacteristic.CLOSING : this.currentCharacteristic.OPENING;

    const delay = getDelay(this.config.simulation.time ?? DEFAULT_OPEN_CLOSE_DURATION, this.config.simulation.units ?? TimeUnits.SECONDS);
    this.intervalTimeout = setInterval( () => {
      this.clearTimeout();
      this.service.updateCharacteristic(this.currentCharacteristic, this.currentPosition);
    }, delay);
  }

  override teardown(): void {
    super.teardown();
    this.clearTimeout();
  }

  private clearTimeout() {
    this._currentPosition = undefined;

    clearInterval(this.intervalTimeout);
    this.intervalTimeout = undefined;
  }
}