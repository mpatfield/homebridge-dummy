import { CharacteristicValue } from 'homebridge';

import { OnOffAccessory } from './onoff.js';

import { DummyAccessoryDependency } from '../base.js';

import { strings } from '../../i18n/i18n.js';

import { AccessoryType, FadeOutType, HKCharacteristicKey, ScheduleType } from '../../model/enums.js';
import { LightbulbConfig } from '../../model/types.js';
import { Range, Webhook } from '../../model/webhook.js';

import { Fader } from '../../timeout/fader.js';

import { DelayLogStrings, getDelay } from '../../timeout/timeout.js';
import { assert } from '../../tools/validation.js';

const DEFAULT_BRIGHTNESS = 100;

export class LightbulbAccessory extends OnOffAccessory<LightbulbConfig> {

  private brightness: CharacteristicValue;

  private fader?: Fader;

  constructor(dependency: DummyAccessoryDependency<LightbulbConfig>) {

    if (typeof dependency.config.fadeOut === 'boolean') {
      const autoReset = dependency.config.autoReset;
      if (autoReset?.type === ScheduleType.TIMEOUT && autoReset?.time !== undefined && autoReset.units !== undefined) {
        dependency.config.fadeOut = {
          type: FadeOutType.FIXED,
          time: autoReset.time,
          units: autoReset.units,
        };
        dependency.config.autoReset = undefined;
      } else {
        dependency.config.fadeOut = undefined;
      }
    }

    super(dependency);

    this.brightness = this.getProperty(HKCharacteristicKey.Brightness) ?? DEFAULT_BRIGHTNESS;

    if (this.isDimmer) {

      if (dependency.config.fadeOut !== undefined) {
        if (!assert(dependency.log, dependency.config.name, dependency.config.fadeOut, 'type', 'time', 'units')) {
          dependency.config.fadeOut = undefined;
        } else {
          this.fader = new Fader(this.addonDependency);
        }
      }

      this.service.getCharacteristic(this.homekit.Characteristic.Brightness)
        .onGet(this.getBrightness.bind(this))
        .onSet(this.setBrightness.bind(this));

      this.initializeBrightness();

    } else {

      const brightnessCharacteristic = this.service.getCharacteristic(this.homekit.Characteristic.Brightness);

      if (brightnessCharacteristic) {
        this.service.removeCharacteristic(brightnessCharacteristic);
      }
    }
  }

  private get isDimmer(): boolean {
    return this.config.isDimmer ?? this.config.defaultBrightness !== undefined;
  }

  override getAccessoryType(): AccessoryType {
    return AccessoryType.Lightbulb;
  }

  override get webhooks(): Webhook[] {
    return [
      ...super.webhooks,
      new Webhook(this, HKCharacteristicKey.Brightness,
        new Range(0, 100),
        () => this.brightness,
        (value) => {
          this.setBrightness(value);
          return strings.lightbulb.brightness.replace('%s', this.displayName).replace('%d', value.toString());
        },
        this.config.disableLogging),
    ];
  }

  private async initializeBrightness() {

    if (!this.isStateful) {
      this.service.updateCharacteristic(this.Characteristic.Brightness, this.brightness);
      return;
    }

    const brightness = this.getProperty(HKCharacteristicKey.Brightness);
    if (brightness === undefined) {
      return;
    }

    await this.setBrightness(brightness);
  }

  override logMessageForOnState(value: CharacteristicValue): string {
    if (this.isDimmer && value && this.brightness !== undefined) {
      return strings.lightbulb.stateOn.replace('%d', this.brightness.toLocaleString());
    } else {
      return super.logMessageForOnState(value);
    }
  }

  override async setOn(value: CharacteristicValue, syncOnly: boolean = false): Promise<void> {
    super.setOn(value, syncOnly);

    if (this.isDimmer && !value) {
      this.service.updateCharacteristic(this.Characteristic.Brightness, this.brightness);
    }
  }

  private async getBrightness(): Promise<CharacteristicValue> {
    return this.fader?.value ?? this.brightness;
  }

  private async setBrightness(value: CharacteristicValue) {

    if (this.brightness === value) {
      return;
    }

    this.brightness = value;
    if (this.fader?.isFading === true) {
      this.onTriggered(false);
    }

    this.logIfDesired(strings.lightbulb.brightness, this.brightness.toString());

    this.setProperty(HKCharacteristicKey.Brightness, this.brightness);

    this.service.updateCharacteristic(this.Characteristic.Brightness, this.brightness);
  }

  override onTriggered(stateChanged: boolean) {
    super.onTriggered(stateChanged);

    if (this.config.fadeOut === undefined) {
      return;
    }

    let rawTime: number;
    switch (this.config.fadeOut.type) {
    case FadeOutType.INCREMENTAL:
      rawTime = this.config.fadeOut.time * Number(this.brightness);
      break;
    case FadeOutType.FIXED:
      rawTime = this.config.fadeOut.time;
      break;
    }

    const logStrings = DelayLogStrings(
      strings.lightbulb.fadeMilliseconds,
      strings.lightbulb.fadeSeconds,
      strings.lightbulb.fadeMinutes,
      strings.lightbulb.fadeHours,
    );

    const delay: number = getDelay(rawTime, this.config.fadeOut.units, undefined, logStrings, this.log, this.displayName);

    this.fader?.start(Number(this.brightness), 0, delay, (value) => {
      if (value === 0) {
        this.setOn(false);
      } else {
        this.service.updateCharacteristic(this.Characteristic.Brightness, value);
      }
    });
  }

  override onReset() {
    this.fader?.cancel();
    super.onReset();
  }

  override teardown(): void {
    this.fader?.teardown();
    super.teardown();
  }
}