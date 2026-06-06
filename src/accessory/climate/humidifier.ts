import { CharacteristicValue } from 'homebridge';

import { DummyAccessory, DummyAccessoryDependency } from '../base.js';

import { strings } from '../../i18n/i18n.js';

import { HumidifierType, OnState }  from '../../model/enums.js';
import { HKCharacteristicKey, HomeKitType } from '../../model/homekit.js';
import { HistoryType } from '../../model/history.js';
import { HumidifierConfig } from '../../model/types.js';
import { Range, Values, Webhook } from '../../model/webhook.js';

import { isValid, printableValues } from '../../tools/validation.js';

const DEFAULT_HUMIDITY = 50;

export class HumidifierAccessory extends DummyAccessory<HumidifierConfig> {

  private state: CharacteristicValue;

  private _currentHumidity?: CharacteristicValue;
  private targetHumidity: CharacteristicValue;

  constructor(dependency: DummyAccessoryDependency<HumidifierConfig>) {
    super(dependency);

    if (!isValid(HumidifierType, dependency.config.humidifierType)) {
      this.log.warning(strings.humidifier.badType, this.displayName, `'${dependency.config.humidifierType}'`, printableValues(HumidifierType));
    }

    if (!isValid(OnState, this.config.defaultState)) {
      this.log.warning(strings.onOff.badDefault, this.displayName, `'${dependency.config.defaultState}'`, printableValues(OnState));
    }

    this.state = this.defaultState;
    this.targetHumidity = DEFAULT_HUMIDITY;

    this.service.getCharacteristic(this.Characteristic.TargetHumidifierDehumidifierState)
      .setProps({
        minStep: 1,
        validValues: [this.targetState as number],
      })
      .onGet(async () => this.targetState)
      .onSet(async () => undefined );

    this.service.getCharacteristic(this.homekit.Characteristic.CurrentHumidifierDehumidifierState)
      .onGet(async () => this.currentState);

    this.service.getCharacteristic(this.homekit.Characteristic.Active)
      .onGet(async () => this.state)
      .onSet(this.setState.bind(this));

    this.service.getCharacteristic(this.homekit.Characteristic.CurrentRelativeHumidity)
      .onGet(async () => this.currentHumidity);

    this.service.getCharacteristic(this.TargetHumidityCharacteristic)
      .onGet(async () => this.targetHumidity)
      .onSet(this.setTargetHumidity.bind(this));

    this.initializeHumidifier();
  }

  private async initializeHumidifier() {

    if (!this.isStateful) {
      this.service.updateCharacteristic(this.Characteristic.TargetHumidifierDehumidifierState, this.targetState);
      this.service.updateCharacteristic(this.Characteristic.CurrentHumidifierDehumidifierState, this.currentState);

      this.service.updateCharacteristic(this.Characteristic.Active, this.state);

      this.service.updateCharacteristic(this.Characteristic.CurrentRelativeHumidity, this.currentHumidity);
      this.service.updateCharacteristic(this.TargetHumidityCharacteristic, this.targetHumidity);

      return;
    }

    const state = this.getProperty(HKCharacteristicKey.On);
    if (state !== undefined) {
      await this.setState(state);
    }

    const currentHumidity = this.getProperty(HKCharacteristicKey.CurrentRelativeHumidity);
    if (currentHumidity !== undefined) {
      await this.setCurrentHumidity(currentHumidity);
    }

    const targetHumidity = this.getProperty(HKCharacteristicKey.TargetRelativeHumidity);
    if (targetHumidity !== undefined) {
      await this.setTargetHumidity(targetHumidity);
    }
  }

  override getHomeKitType(): HomeKitType {
    return HomeKitType.HumidifierDehumidifier;
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

      new Webhook(this, HKCharacteristicKey.CurrentRelativeHumidity,
        new Range(0, 100),
        () => this.currentHumidity,
        (value) => {
          this.setCurrentHumidity(value);
          return strings.sensor.humidity.replace('%s', this.displayName).replace('%d', value.toString());
        },
        this.config.disableLogging),

      new Webhook(this, HKCharacteristicKey.TargetRelativeHumidity,
        new Range(0, 100),
        () => this.targetHumidity,
        (value) => {
          this.setTargetHumidity(value);
          return strings.humidifier.targetHumidity.replace('%s', this.displayName).replace('%d', value.toString());
        },
        this.config.disableLogging),
    ];
  }

  private get defaultState(): CharacteristicValue {
    return this.config.defaultState === OnState.ON ? 1 : 0;
  }

  private get targetState(): CharacteristicValue {
    return this.config.humidifierType === HumidifierType.DEHUMIDIFIER ?
      this.Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER :
      this.Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER;
  }

  private get currentState(): CharacteristicValue {

    if (this.state === this.Characteristic.Active.INACTIVE) {
      return this.Characteristic.CurrentHumidifierDehumidifierState.INACTIVE;
    }

    return this.config.humidifierType === HumidifierType.DEHUMIDIFIER ?
      this.Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING :
      this.Characteristic.CurrentHumidifierDehumidifierState.HUMIDIFYING;
  }

  private get TargetHumidityCharacteristic():
  typeof this.Characteristic.RelativeHumidityDehumidifierThreshold | typeof this.Characteristic.RelativeHumidityHumidifierThreshold {
    return this.config.humidifierType === HumidifierType.DEHUMIDIFIER ?
      this.Characteristic.RelativeHumidityDehumidifierThreshold :
      this.Characteristic.RelativeHumidityHumidifierThreshold;
  }

  private get currentHumidity(): CharacteristicValue {
    return this._currentHumidity ?? this.targetHumidity;
  }

  private async registerStateChange() {
    await this.onStateChange(this.state === 1 ? OnState.ON : OnState.OFF);
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
      this.onReset();
    }

    this.service.updateCharacteristic(this.Characteristic.CurrentHumidifierDehumidifierState, this.currentState);
    this.service.updateCharacteristic(this.Characteristic.Active, this.state);

    await this.registerStateChange();
  }

  private async setCurrentHumidity(value: CharacteristicValue) {

    if (this._currentHumidity !== value) {
      this.logIfDesired(strings.sensor.humidity, value.toString());
      this.setProperty(HKCharacteristicKey.CurrentRelativeHumidity, value);
      this.recordHistory(HistoryType.WEATHER, { humidity: value as number } );
    }

    this._currentHumidity = value;

    this.service.updateCharacteristic(this.Characteristic.CurrentRelativeHumidity, this.currentHumidity);
  }

  private async setTargetHumidity(value: CharacteristicValue) {

    if (this.targetHumidity !== value) {
      this.logIfDesired(strings.humidifier.targetHumidity, value.toString());
      this.setProperty(HKCharacteristicKey.TargetRelativeHumidity, value);
    }

    this.targetHumidity = value;

    this.service.updateCharacteristic(this.TargetHumidityCharacteristic, this.targetHumidity);
    this.service.updateCharacteristic(this.Characteristic.CurrentRelativeHumidity, this.currentHumidity);
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