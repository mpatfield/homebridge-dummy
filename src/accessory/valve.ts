import { CharacteristicValue } from 'homebridge';

import { DummyAccessory, DummyAccessoryDependency } from './base.js';

import { strings } from '../i18n/i18n.js';

import { HKCharacteristicKey, HomeKitType, OnState, ScheduleType, TimeUnits, ValveType }  from '../model/enums.js';
import { ValveConfig } from '../model/types.js';
import { Values, Webhook } from '../model/webhook.js';

import { getDelay, SECOND } from '../timeout/timeout.js';

import { isValid, printableValues } from '../tools/validation.js';

const MIN_DURATION = 1;
const MAX_DURATION = 3600;

export class ValveAccessory extends DummyAccessory<ValveConfig> {

  override getHomeKitType(): HomeKitType {
    return HomeKitType.Valve;
  }

  private state: CharacteristicValue;

  private timerExpiration?: number;

  constructor(dependency: DummyAccessoryDependency<ValveConfig>) {
    super(dependency);

    if (!isValid(ValveType, dependency.config.valveType)) {
      this.log.warning(strings.valve.badType, this.displayName, `'${dependency.config.valveType}'`, printableValues(ValveType));
    }

    if (!isValid(OnState, this.config.defaultState)) {
      this.log.warning(strings.onOff.badDefault, this.displayName, `'${dependency.config.defaultState}'`, printableValues(OnState));
    }

    this.state = this.defaultState;

    this.service.getCharacteristic(this.homekit.Characteristic.ValveType)
      .onGet(this.getType.bind(this));

    this.service.getCharacteristic(this.homekit.Characteristic.Active)
      .onGet(this.getState.bind(this))
      .onSet(this.setState.bind(this));

    this.service.getCharacteristic(this.homekit.Characteristic.InUse)
      .onGet(this.getState.bind(this));

    this.service.getCharacteristic(this.homekit.Characteristic.IsConfigured)
      .onGet(() => this.homekit.Characteristic.IsConfigured.CONFIGURED);

    const autoReset = dependency.config.autoReset;
    if (autoReset !== undefined && autoReset.type === ScheduleType.TIMEOUT && autoReset.time !== undefined && autoReset.units !== undefined) {

      this.initializeDuration(autoReset.time, autoReset.units);

      this.service.getCharacteristic(this.homekit.Characteristic.SetDuration)
        .setProps({ minValue: MIN_DURATION, maxValue: MAX_DURATION })
        .onGet(this.getDuration.bind(this))
        .onSet(this.setDuration.bind(this));

      this.service.getCharacteristic(this.homekit.Characteristic.RemainingDuration)
        .onGet(this.getRemainingDuration.bind(this));
    }

    this.initializeValve();
  }

  override get webhooks(): Webhook[] {
    return [
      new Webhook(this, HKCharacteristicKey.On,
        new Values( [true, false], 'true, false'),
        () => this.state,
        (value, syncOnly) => {
          this.setState(value ? 1 : 0, syncOnly);
          return this.logMessageForState(value).replace('%s', this.displayName);
        },
        this.config.disableLogging),
    ];
  }

  private async initializeValve() {

    await new Promise(resolve => setImmediate(resolve));

    if (!this.isStateful) {
      this.service.updateCharacteristic(this.Characteristic.Active, this.state);
      this.service.updateCharacteristic(this.Characteristic.InUse, this.state);
      await this.registerStateChange();
      return;
    }

    const state = this.getProperty(HKCharacteristicKey.On);
    if (state === undefined) {
      await this.registerStateChange();
      return;
    }

    await this.setState(state);
  }

  private initializeDuration(rawTime: number, units: TimeUnits) {

    let duration = this.getProperty(HKCharacteristicKey.SetDuration);
    if (duration !== undefined) {
      return;
    }

    duration = Math.round(getDelay(rawTime, units) / SECOND);

    if (duration < MIN_DURATION) {
      this.log.warning(strings.valve.minDuration, this.displayName);
      duration = MIN_DURATION;
    } else if (duration > MAX_DURATION) {
      this.log.warning(strings.valve.maxDuration, this.displayName);
      duration = MAX_DURATION;
    }

    this.setProperty(HKCharacteristicKey.SetDuration, duration);
  }

  private get defaultState(): CharacteristicValue {
    return this.config.defaultState === OnState.ON ? 1 : 0;
  }

  private async registerStateChange() {
    await this.onStateChange(this.state === 1 ? OnState.ON : OnState.OFF);
  }

  protected async getType(): Promise<CharacteristicValue> {
    switch (this.config.valveType) {
    case ValveType.FAUCET:
      return this.Characteristic.ValveType.WATER_FAUCET;
    case ValveType.IRRIGATION:
      return this.Characteristic.ValveType.IRRIGATION;
    case ValveType.SHOWER:
      return this.Characteristic.ValveType.SHOWER_HEAD;
    case ValveType.GENERIC:
    default:
      return this.Characteristic.ValveType.GENERIC_VALVE;
    }
  }

  protected async getState(): Promise<CharacteristicValue> {
    return this.state;
  }

  private async getDuration(): Promise<CharacteristicValue> {
    return this.getProperty(HKCharacteristicKey.SetDuration) ?? MAX_DURATION;
  }

  private async setDuration(value: CharacteristicValue): Promise<void> {
    this.setProperty(HKCharacteristicKey.SetDuration, value);
    this.setAutoResetTimeout(value as number, TimeUnits.SECONDS);
  }

  override onTimerStarted(delay: number) {
    super.onTimerStarted(delay);
    this.timerExpiration = Date.now() + delay;
  }
  private async getRemainingDuration(): Promise<CharacteristicValue> {

    if (this.timerExpiration === undefined) {
      return 0;
    }

    const remainingMillis = this.timerExpiration - Date.now();
    return Math.round(remainingMillis / SECOND);
  }

  private async setState(value: CharacteristicValue, syncOnly: boolean = false) {

    const stateChanged = this.state !== value;
    if (stateChanged) {
      this.logIfDesired(this.logMessageForState(value));

      this.setProperty(HKCharacteristicKey.On, value);

      if (!syncOnly) {
        if (this.config.commandOn && value === 1) {
          this.executeCommand(this.config.commandOn);
        } else if (this.config.commandOff && value === 0) {
          this.executeCommand(this.config.commandOff);
        }
      }
    }

    this.state = value;

    if (this.state !== this.defaultState) {
      this.onTriggered(stateChanged);
    } else {
      this.timerExpiration = undefined;
      this.onReset();
    }

    this.service.updateCharacteristic(this.Characteristic.Active, this.state);
    this.service.updateCharacteristic(this.Characteristic.InUse, this.state);

    await this.registerStateChange();
  }

  override async trigger(): Promise<void> {
    const opposite = this.defaultState === 0 ? 1 : 0;
    await this.setState(opposite);
  }

  override async reset(): Promise<void> {
    if (this.state !== this.defaultState) {
      await this.setState(this.defaultState);
    }
  }

  protected logMessageForState(value: CharacteristicValue): string {
    return value ? strings.onOff.stateOn : strings.onOff.stateOff;
  }
}