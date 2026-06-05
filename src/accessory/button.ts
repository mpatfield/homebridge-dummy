import { CharacteristicValue } from 'homebridge';

import { DummyAccessory } from './base.js';

import { strings } from '../i18n/i18n.js';

import { AccessoryType, HKCharacteristicKey } from '../model/enums.js';
import { ButtonConfig } from '../model/types.js';
import { Values, Webhook } from '../model/webhook.js';

export class ButtonAccessory extends DummyAccessory<ButtonConfig> {

  protected getAccessoryType(): AccessoryType {
    return AccessoryType.StatelessProgrammableSwitch;
  }

  override async trigger(): Promise<void> {
    this.onPress(this.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS);
  }

  override async reset(): Promise<void> {
  }

  public get webhooks(): Webhook[] {

    return [
      new Webhook(this, HKCharacteristicKey.ProgrammableSwitchEvent,
        new Values(
          [
            this.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
            this.Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS,
            this.Characteristic.ProgrammableSwitchEvent.LONG_PRESS,
          ], `0 (${strings.button.singlePressTitle}), 1 (${strings.button.doublePressTitle}), 2 (${strings.button.longPressTitle})`),
        () => undefined,
        (value) => {
          this.onPress(value);
          return this.stringForValue(value).replace('%s', this.displayName);
        },
        this.config.disableLogging),
    ];
  }

  private onPress(value: CharacteristicValue) {
    this.logIfDesired(this.stringForValue(value));

    if (this.config.commandOn) {
      this.executeCommand(this.config.commandOn);
    }

    this.onTriggered();
    this.onReset();

    this.service.updateCharacteristic(this.Characteristic.ProgrammableSwitchEvent, value);
  }

  private stringForValue(value: CharacteristicValue): string {
    switch(value) {
    case this.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS:
      return strings.button.singlePress;
    case this.Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS:
      return strings.button.doublePress;
    case this.Characteristic.ProgrammableSwitchEvent.LONG_PRESS:
      return strings.button.longPress;
    }

    throw new Error(`Trying to get button press string for value '${value}'`);
  }
}