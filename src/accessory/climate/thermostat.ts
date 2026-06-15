import { CharacteristicValue } from 'homebridge';

import { DummyAccessory, DummyAccessoryDependency } from '../base.js';

import { strings } from '../../i18n/i18n.js';

import { ThermostatState, TemperatureUnits }  from '../../model/enums.js';
import { HKCharacteristicKey, HomeKitType } from '../../model/homekit.js';
import { HistoryType } from '../../model/history.js';
import { ThermostatConfig } from '../../model/types.js';
import { Range, Values, Webhook } from '../../model/webhook.js';

import { fromCelsius, toCelsius } from '../../tools/temperature.js';
import { isValid, printableValues } from '../../tools/validation.js';

const DEFAULT_TEMPERATURE = 20;
const DEFAULT_MINIMUM = 10;
const DEFAULT_MAXIMUM = 38;

export class ThermostatAccessory extends DummyAccessory<ThermostatConfig> {

  private readonly STATE_AUTO: CharacteristicValue;
  private readonly STATE_COOL: CharacteristicValue;
  private readonly STATE_HEAT: CharacteristicValue;
  private readonly STATE_OFF: CharacteristicValue;

  private validCurrentStates: number[];
  private validTargetStates: number[];

  private _currentState?: CharacteristicValue;
  private targetState: CharacteristicValue;

  private _currentTemperature?: CharacteristicValue;
  private targetTemperature: CharacteristicValue;

  private minTemp: number;
  private maxTemp: number;

  constructor(dependency: DummyAccessoryDependency<ThermostatConfig>) {
    super(dependency);

    this.STATE_AUTO = this.homekit.Characteristic.TargetHeatingCoolingState.AUTO;
    this.STATE_COOL = this.homekit.Characteristic.TargetHeatingCoolingState.COOL;
    this.STATE_HEAT = this.homekit.Characteristic.TargetHeatingCoolingState.HEAT;
    this.STATE_OFF = this.homekit.Characteristic.TargetHeatingCoolingState.OFF;

    if (!isValid(TemperatureUnits, dependency.config.temperatureUnits)) {
      this.log.warning(strings.sensor.badTemperatureUnits, this.displayName, `'${dependency.config.temperatureUnits}'`, printableValues(TemperatureUnits));
    }

    if (!isValid(ThermostatState, dependency.config.defaultThermostatState)) {
      this.log.warning(strings.thermostat.badDefault, this.displayName, `'${dependency.config.defaultThermostatState}'`, printableValues(ThermostatState));
    }

    this.targetState = this.defaultTargetState;
    this.targetTemperature = this.defaultTemperature;

    this.service.getCharacteristic(this.homekit.Characteristic.TemperatureDisplayUnits)
      .onGet(this.getUnits.bind(this));

    let validStates: number[] = [this.STATE_OFF, this.STATE_HEAT, this.STATE_COOL, this.STATE_AUTO];
    if (this.config.validStates !== undefined) {
      if (!Array.isArray(this.config.validStates)) {
        this.log.warning(strings.thermostat.badValidStatesType, this.displayName, '`validStates`');
      } else {
        try {
          validStates = this.config.validStates.map( (state) => {
            const value = this.cvForState(state);
            if (value === undefined) {
              throw new Error();
            }
            return value as number;
          }).sort();
        } catch {
          this.log.warning(strings.thermostat.badValidStates, this.displayName, '`validStates`', printableValues(ThermostatState));
        }
      }
    }

    this.validCurrentStates = validStates.filter( value => value !== this.STATE_AUTO);
    this.validTargetStates = validStates;

    this.service.getCharacteristic(this.homekit.Characteristic.CurrentHeatingCoolingState)
      .setProps({
        validValues: this.validCurrentStates,
      })
      .onGet(this.getCurrentState.bind(this));

    this.service.getCharacteristic(this.homekit.Characteristic.TargetHeatingCoolingState)
      .setProps({
        validValues: this.validTargetStates,
      })
      .onGet(this.getTargetState.bind(this))
      .onSet(this.setTargetState.bind(this));

    this.minTemp = dependency.config.minimumTemperature !== undefined ? toCelsius(dependency.config.minimumTemperature, this.units) : DEFAULT_MINIMUM;
    this.maxTemp = dependency.config.maximumTemperature !== undefined ? toCelsius(dependency.config.maximumTemperature, this.units) : DEFAULT_MAXIMUM;

    this.service.getCharacteristic(this.homekit.Characteristic.CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this))
      .setProps({ minValue: this.minTemp, maxValue: this.maxTemp });

    this.service.getCharacteristic(this.homekit.Characteristic.TargetTemperature)
      .onGet(this.getTargetTemperature.bind(this))
      .onSet(this.setTargetTemperature.bind(this))
      .setProps({ minValue: this.minTemp, maxValue: this.maxTemp });

    this.initializeThermostat();
  }

  private async initializeThermostat() {

    if (!this.isStateful) {
      this.service.updateCharacteristic(this.Characteristic.CurrentHeatingCoolingState, this.defaultCurrentState);
      this.service.updateCharacteristic(this.Characteristic.TargetHeatingCoolingState, this.targetState);

      this.service.updateCharacteristic(this.Characteristic.CurrentTemperature, this.currentTemperature);
      this.service.updateCharacteristic(this.Characteristic.TargetTemperature, this.targetTemperature);

      return;
    }

    const currentState = this.getProperty(HKCharacteristicKey.CurrentHeatingCoolingState);
    if (currentState !== undefined) {
      await this.setCurrentState(currentState);
    }

    const targetState = this.getProperty(HKCharacteristicKey.TargetHeatingCoolingState);
    if (targetState !== undefined) {
      await this.setTargetState(targetState);
    }

    const currentTemperature = this.getProperty(HKCharacteristicKey.CurrentTemperature);
    if (currentTemperature !== undefined) {
      await this.setCurrentTemperature(currentTemperature);
    }

    const targetTemperature = this.getProperty(HKCharacteristicKey.TargetTemperature);
    if (targetTemperature !== undefined) {
      await this.setTargetTemperature(targetTemperature);
    }
  }

  override getHomeKitType(): HomeKitType {
    return HomeKitType.Thermostat;
  }

  override get webhooks(): Webhook[] {

    const stateStrings = new Map<number, string>([
      [0, `0 (${strings.config.enumNames.off})`],
      [1, `1 (${strings.config.enumNames.heat})`],
      [2, `2 (${strings.config.enumNames.cool})`],
      [3, `3 (${strings.config.enumNames.auto})`],
    ]);

    return [

      new Webhook(this, HKCharacteristicKey.CurrentHeatingCoolingState,
        new Values(this.validCurrentStates, this.validCurrentStates.map(state => stateStrings.get(state)).join(', ')),
        () => this.currentState,
        (value, syncOnly) => {
          this.setCurrentState(value, syncOnly);
          return this.stateLogTemplateForCV(value, false).replace('%s', this.displayName);
        },
        this.config.disableLogging),

      new Webhook(this, HKCharacteristicKey.TargetHeatingCoolingState,
        new Values(this.validTargetStates, this.validTargetStates.map(state => stateStrings.get(state)).join(', ')),
        () => this.targetState,
        (value, syncOnly) => {
          this.setTargetState(value, syncOnly);
          return this.stateLogTemplateForCV(value, true).replace('%s', this.displayName);
        },
        this.config.disableLogging),

      new Webhook(this, HKCharacteristicKey.CurrentTemperature,
        new Range(fromCelsius(this.minTemp, this.units), fromCelsius(this.maxTemp, this.units)),
        () => this.currentTemperature,
        (value) => {
          value = toCelsius(value as number, this.units);
          this.setCurrentTemperature(value);
          return this.temperatureLogTemplateForCV(value, strings.sensor.temperatureF, strings.sensor.temperatureC).replace('%s', this.displayName);
        },
        this.config.disableLogging),

      new Webhook(this, HKCharacteristicKey.TargetTemperature,
        new Range(fromCelsius(this.minTemp, this.units), fromCelsius(this.maxTemp, this.units)),
        () => this.targetTemperature,
        (value, syncOnly) => {
          value = toCelsius(value as number, this.units);
          this.setTargetTemperature(value, syncOnly);
          return this.temperatureLogTemplateForCV(value, strings.thermostat.targetF, strings.thermostat.targetC).replace('%s', this.displayName);
        },
        this.config.disableLogging),
    ];
  }

  private cvForState(state: ThermostatState | undefined): CharacteristicValue | undefined {

    switch (state) {
    case ThermostatState.AUTO:
      return this.STATE_AUTO;
    case ThermostatState.COOL:
      return this.STATE_COOL;
    case ThermostatState.HEAT:
      return this.STATE_HEAT;
    case ThermostatState.OFF:
      return this.STATE_OFF;
    }

    return undefined;
  }

  private get defaultCurrentState(): CharacteristicValue {
    const defaultThermostatState = this.cvForState(this.config.defaultThermostatState);
    return defaultThermostatState !== undefined && defaultThermostatState !== this.STATE_AUTO ? defaultThermostatState : this.STATE_OFF;
  }

  private get defaultTargetState(): CharacteristicValue {
    return this.cvForState(this.config.defaultThermostatState) ?? this.STATE_OFF;
  }

  private get defaultTemperature(): CharacteristicValue {
    return this.config.defaultTemperature ? toCelsius(this.config.defaultTemperature, this.config.temperatureUnits) : DEFAULT_TEMPERATURE;
  }

  private get units(): TemperatureUnits {
    return this.config.temperatureUnits ?? TemperatureUnits.CELSIUS;
  }

  private async getUnits(): Promise<CharacteristicValue> {
    return this.units === TemperatureUnits.FAHRENHEIT
      ? this.Characteristic.TemperatureDisplayUnits.FAHRENHEIT : this.Characteristic.TemperatureDisplayUnits.CELSIUS;
  }

  private get currentState(): CharacteristicValue {

    if (this._currentState !== undefined) {
      return this._currentState;
    }

    return this.getProperty(HKCharacteristicKey.CurrentHeatingCoolingState) ?? this.defaultCurrentState;
  }

  protected async getCurrentState(): Promise<CharacteristicValue> {
    return this.currentState;
  }

  private async getTargetState(): Promise<CharacteristicValue> {
    return this.targetState;
  }

  private async setCurrentState(value: CharacteristicValue, syncOnly: boolean = false) {

    if (this._currentState !== value) {
      this.logState(value, false);

      this.setProperty(HKCharacteristicKey.CurrentHeatingCoolingState, value);

      if (!syncOnly) {
        this.executeStateCommand(this.currentState, value);
      }
    }

    this._currentState = value;

    this.service.updateCharacteristic(this.Characteristic.CurrentHeatingCoolingState, this.currentState);
  }

  private async setTargetState(value: CharacteristicValue, syncOnly: boolean = false) {

    if (this.targetState !== value) {
      this.logState(value, true);

      this.setProperty(HKCharacteristicKey.TargetHeatingCoolingState, value);

      if (!syncOnly && this._currentState === undefined) {
        this.executeStateCommand(this.targetState, value);
      }
    }

    this.targetState = value;

    this.service.updateCharacteristic(this.Characteristic.TargetHeatingCoolingState, this.targetState);

    if (this._currentState === undefined) {

      if (this.targetState !== this.STATE_AUTO) {
        this.setProperty(HKCharacteristicKey.CurrentHeatingCoolingState, this.targetState);
      }

      this.service.updateCharacteristic(this.Characteristic.CurrentHeatingCoolingState, this.currentState);
    }
  }

  private executeStateCommand(oldValue: CharacteristicValue, newValue: CharacteristicValue) {
    if (this.config.commandOff && newValue === this.STATE_OFF) {
      this.executeCommand(this.config.commandOff);
    } else if (this.config.commandOn && oldValue === this.STATE_OFF && newValue !== this.STATE_OFF) {
      this.executeCommand(this.config.commandOn);
    }
  }

  private get currentTemperature(): CharacteristicValue {
    return this._currentTemperature ?? this.targetTemperature;
  }

  private async getCurrentTemperature(): Promise<CharacteristicValue> {
    return this.currentTemperature;
  }

  private async getTargetTemperature(): Promise<CharacteristicValue> {
    return this.targetTemperature;
  }

  private async setCurrentTemperature(value: CharacteristicValue) {

    if (this._currentTemperature !== value) {
      this.logCurrentTemperature(value);
      this.setProperty(HKCharacteristicKey.CurrentTemperature, value);
      this.recordHistory(HistoryType.WEATHER, { temp: value as number } );
    }

    this._currentTemperature = value;

    this.service.updateCharacteristic(this.Characteristic.CurrentTemperature, this.currentTemperature);
  }

  private async setTargetTemperature(value: CharacteristicValue, syncOnly: boolean = false) {

    if (this.targetTemperature !== value) {
      this.logTargetTemperature(value);

      this.setProperty(HKCharacteristicKey.TargetTemperature, value);

      if (!syncOnly) {
        if (this.config.commandTemperature) {
          this.executeCommand(this.config.commandTemperature);
        }
      }
    }

    this.targetTemperature = value;

    this.service.updateCharacteristic(this.Characteristic.TargetTemperature, this.targetTemperature);
    this.service.updateCharacteristic(this.Characteristic.CurrentTemperature, this.currentTemperature);
  }

  override async trigger(): Promise<void> {
    throw new Error(`${this.trigger.name} is unsupported for ${ThermostatAccessory.name}`);
  }

  override async reset(): Promise<void> {
    throw new Error(`${this.reset.name} is unsupported for ${ThermostatAccessory.name}`);
  }

  private stateLogTemplateForCV(value: CharacteristicValue, future: boolean): string {
    future = future && this._currentState !== undefined;
    switch(value) {
    case this.STATE_AUTO:
      return future ? strings.thermostat.autoFuture : strings.thermostat.auto;
    case this.STATE_COOL:
      return future ? strings.thermostat.coolFuture : strings.thermostat.cool;
    case this.STATE_HEAT:
      return future ? strings.thermostat.heatFuture : strings.thermostat.heat;
    default:
      return future ? strings.thermostat.offFuture : strings.thermostat.off;
    }
  }

  protected logState(value: CharacteristicValue, future: boolean) {
    this.logIfDesired(this.stateLogTemplateForCV(value, future));
  }

  private temperatureLogTemplateForCV(value: CharacteristicValue, logF: string, logC: string): string {
    const message = this.units === TemperatureUnits.FAHRENHEIT ? logF : logC;
    const temperature = fromCelsius(value as number, this.config.temperatureUnits);
    return message.replace('%d', temperature.toString());
  }

  protected logCurrentTemperature(value: CharacteristicValue) {
    this.logIfDesired(this.temperatureLogTemplateForCV(value, strings.sensor.temperatureF, strings.sensor.temperatureC));
  }

  protected logTargetTemperature(value: CharacteristicValue) {
    this.logIfDesired(this.temperatureLogTemplateForCV(value, strings.thermostat.targetF, strings.thermostat.targetC));
  }
}