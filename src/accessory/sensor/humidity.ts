import { CharacteristicValue } from 'homebridge';

import { DummyAccessory, DummyAccessoryDependency } from '../base.js';

import { strings } from '../../i18n/i18n.js';

import { HistoryType } from '../../model/history.js';
import { HKCharacteristicKey, HomeKitType } from '../../model/homekit.js';
import { HumiditySensorConfig } from '../../model/types.js';
import { Range, Webhook } from '../../model/webhook.js';

export class HumiditySensorAccessory extends DummyAccessory<HumiditySensorConfig> {

  private humidity: CharacteristicValue;

  constructor(dependency: DummyAccessoryDependency<HumiditySensorConfig>) {
    super(dependency);

    this.service.getCharacteristic(this.homekit.Characteristic.CurrentRelativeHumidity)
      .onGet(this.getHumidity.bind(this));

    this.humidity = (this.isStateful ? this.getProperty(HKCharacteristicKey.CurrentRelativeHumidity) : 0) ?? 0;
  }

  override getHomeKitType(): HomeKitType {
    return HomeKitType.HumiditySensor;
  }

  override get webhooks(): Webhook[] {

    return [
      new Webhook(this, HKCharacteristicKey.CurrentRelativeHumidity,
        new Range(0, 100),
        () => this.humidity,
        (value, syncOnly) => {
          this.setHumidity(value, syncOnly);
          return strings.sensor.humidity.replace('%s', this.displayName).replace('%d', value.toString());
        },
        this.config.disableLogging),
    ];
  }

  private async getHumidity(): Promise<CharacteristicValue> {
    return this.humidity;
  }

  private async setHumidity(value: CharacteristicValue, syncOnly: boolean = false) {

    if (this.humidity !== value) {
      this.logIfDesired(strings.sensor.humidity, value.toString());

      this.setProperty(HKCharacteristicKey.CurrentRelativeHumidity, value);

      if (!syncOnly) {
        if (this.config.commandHumidity) {
          this.executeCommand(this.config.commandHumidity);
        }
      }

      this.recordHistory(HistoryType.WEATHER, { humidity: value as number } );
    }

    this.humidity = value;

    this.service.updateCharacteristic(this.Characteristic.CurrentRelativeHumidity, this.humidity);
  }

  override async trigger(): Promise<void> {
    throw new Error(`${this.trigger.name} is unsupported for ${HumiditySensorAccessory.name}`);
  }

  override async reset(): Promise<void> {
    throw new Error(`${this.reset.name} is unsupported for ${HumiditySensorAccessory.name}`);
  }
}