import { CharacteristicValue } from 'homebridge';

import { DummyAccessory, DummyAccessoryDependency } from '../base.js';

import { strings } from '../../i18n/i18n.js';

import { OnState, SensorBehavior } from '../../model/enums.js';
import { HistoryType } from '../../model/history.js';
import { HKCharacteristicKey } from '../../model/homekit.js';
import { MatterClusterKey, MatterValueKey } from '../../model/matter.js';
import { OnOffConfig } from '../../model/types.js';
import { Values, Webhook } from '../../model/webhook.js';

import { isValid, printableValues } from '../../tools/validation.js';

export abstract class OnOffAccessory<C extends OnOffConfig = OnOffConfig> extends DummyAccessory<C> {

  private on: CharacteristicValue;

  constructor(dependency: DummyAccessoryDependency<C>) {
    super(dependency);

    if (!isValid(OnState, this.config.defaultState)) {
      this.log.warning(strings.onOff.badDefault, this.displayName, `'${dependency.config.defaultState}'`, printableValues(OnState));
    }

    this.on = this.defaultState;

    this.ifHomeKit(() => {
      this.service.getCharacteristic(this.homekit.Characteristic.On)
        .onGet(this.getOn.bind(this))
        .onSet(this.setOn.bind(this));
    });

    this.initializeOn();
  }

  override get webhooks(): Webhook[] {
    return [
      new Webhook(this, HKCharacteristicKey.On,
        new Values( [true, false], 'true, false'),
        () => this.on,
        (value, syncOnly) => {
          this.setOn(value, syncOnly);
          return this.logMessageForOnState(value).replace('%s', this.displayName);
        },
        this.config.disableLogging),
    ];
  }

  private async initializeOn() {

    await new Promise(resolve => setImmediate(resolve));

    if (!this.isStateful) {
      this.ifHomeKit(() => {
        this.service.updateCharacteristic(this.Characteristic.On, this.on);
      });
      await this.registerStateChange();
      return;
    }

    const on = this.getProperty(HKCharacteristicKey.On);
    if (on === undefined) {
      await this.registerStateChange();
      return;
    }

    await this.setOn(on);
  }

  private get defaultState(): CharacteristicValue {
    return this.config.defaultState === OnState.ON ? true : false;
  }

  private async registerStateChange() {
    await this.onStateChange(this.on ? OnState.ON : OnState.OFF);
  }

  private async getOn(): Promise<CharacteristicValue> {
    return this.on;
  }

  protected async setOn(value: CharacteristicValue, syncOnly: boolean = false): Promise<void> {

    const stateChanged = this.on !== value;
    if (stateChanged) {
      this.logIfDesired(this.logMessageForOnState(value));

      this.setProperty(HKCharacteristicKey.On, value);

      if (!syncOnly) {
        if (this.config.commandOn && value) {
          this.executeCommand(this.config.commandOn);
        } else if (this.config.commandOff && !value) {
          this.executeCommand(this.config.commandOff);
        }
      }

      this.recordHistory(HistoryType.CUSTOM, { status: value ? 1 : 0 }, true);
    }

    this.on = value;

    if (this.on !== this.defaultState) {
      this.onTriggered(stateChanged);
    } else {
      this.onReset();
    }

    this.bifurcate(
      () => {
        this.service.updateCharacteristic(this.Characteristic.On, this.on);
      },
      () => {
        this.updateMatter(MatterClusterKey.onOff, MatterValueKey.onOff, this.on === true);
      },
    );

    if (this.sensor) {
      if (this.sensor.behavior === SensorBehavior.MIRROR) {
        this.sensor.active = this.on !== this.defaultState;
      } else if (this.sensor.behavior === SensorBehavior.TIMER && this.on !== this.defaultState) {
        this.sensor.active = false;
      }
    }

    await this.registerStateChange();
  }

  override get clusters() {
    return {
      onOff: {
        onOff: this.getProperty(HKCharacteristicKey.On) as boolean ?? this.defaultState,
      },
    };
  }

  override get handlers() {
    return {
      onOff: {
        on: async () => this.setOn(true),
        off: async () => this.setOn(false),
      },
    };
  }

  override async trigger(): Promise<void> {
    await this.setOn(!this.defaultState);
  }

  override async reset(): Promise<void> {
    if (this.on !== this.defaultState) {
      await this.setOn(this.defaultState);
      if (this.sensor?.behavior === SensorBehavior.TIMER) {
        this.sensor.active = true;
      }
    }
  }

  protected logMessageForOnState(value: CharacteristicValue): string {
    return value ? strings.onOff.stateOn : strings.onOff.stateOff;
  }
}
