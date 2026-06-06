import { CharacteristicValue } from 'homebridge';

import { DummyAccessory, DummyAccessoryDependency } from '../base.js';

import { strings } from '../../i18n/i18n.js';

import { AccessoryType, HKCharacteristicKey, TemperatureUnits } from '../../model/enums.js';
import { HistoryType } from '../../model/history.js';
import { TemperatureSensorConfig } from '../../model/types.js';
import { Range, Webhook } from '../../model/webhook.js';
import { fromCelsius, toCelsius } from '../../tools/temperature.js';
import { isValid, printableValues } from '../../tools/validation.js';

const MIN_TEMP = -270;
const MAX_TEMP = 100;

export class TemperatureSensorAccessory extends DummyAccessory<TemperatureSensorConfig> {

  private temperature: CharacteristicValue;

  constructor(dependency: DummyAccessoryDependency<TemperatureSensorConfig>) {
    super(dependency);

    if (!isValid(TemperatureUnits, dependency.config.temperatureUnits)) {
      this.log.warning(strings.sensor.badTemperatureUnits, this.displayName, `'${dependency.config.temperatureUnits}'`, printableValues(TemperatureUnits));
    }

    this.service.getCharacteristic(this.homekit.Characteristic.CurrentTemperature)
      .onGet(this.getTemperature.bind(this));

    this.temperature = (this.isStateful ? this.getProperty(HKCharacteristicKey.CurrentTemperature) : 0) ?? 0;
  }

  override getAccessoryType(): AccessoryType {
    return AccessoryType.TemperatureSensor;
  }

  override get webhooks(): Webhook[] {

    return [
      new Webhook(this, HKCharacteristicKey.CurrentTemperature,
        new Range(fromCelsius(MIN_TEMP, this.units), fromCelsius(MAX_TEMP, this.units)),
        () => this.temperature,
        (value, syncOnly) => {
          value = toCelsius(value as number, this.units);
          this.setTemperature(value, syncOnly);
          return this.temperatureLogTemplateForCV(value).replace('%s', this.displayName);
        },
        this.config.disableLogging),
    ];
  }

  private get units(): TemperatureUnits {
    return this.config.temperatureUnits ?? TemperatureUnits.CELSIUS;
  }

  private async getTemperature(): Promise<CharacteristicValue> {
    return this.temperature;
  }

  private async setTemperature(value: CharacteristicValue, syncOnly: boolean = false) {

    if (this.temperature !== value) {
      this.logTemperature(value);

      this.setProperty(HKCharacteristicKey.CurrentTemperature, value);

      if (!syncOnly) {
        if (this.config.commandTemperature) {
          this.executeCommand(this.config.commandTemperature);
        }
      }

      this.recordHistory(HistoryType.WEATHER, { temp: value as number } );
    }

    this.temperature = value;

    this.service.updateCharacteristic(this.Characteristic.CurrentTemperature, this.temperature);
  }

  override async trigger(): Promise<void> {
    throw new Error(`${this.trigger.name} is unsupported for ${TemperatureSensorAccessory.name}`);
  }

  override async reset(): Promise<void> {
    throw new Error(`${this.reset.name} is unsupported for ${TemperatureSensorAccessory.name}`);
  }

  private temperatureLogTemplateForCV(value: CharacteristicValue): string {
    const message = this.units === TemperatureUnits.FAHRENHEIT ? strings.sensor.temperatureF : strings.sensor.temperatureC;
    const temperature = fromCelsius(value as number, this.config.temperatureUnits);
    return message.replace('%d', temperature.toString());
  }

  protected logTemperature(value: CharacteristicValue) {
    this.logIfDesired(this.temperatureLogTemplateForCV(value));
  }
}