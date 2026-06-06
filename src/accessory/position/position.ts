import { CharacteristicValue } from 'homebridge';

import { DummyAccessory, DummyAccessoryDependency } from '../base.js';

import { EveCharacteristicHost, incrementTimesOpened, setupTimesOpened } from '../characteristic/eve.js';

import { strings } from '../../i18n/i18n.js';

import { Position, HKCharacteristicKey, TimeUnits, SensorBehavior } from '../../model/enums.js';
import { PositionConfig } from '../../model/types.js';
import { Range, Values, Webhook } from '../../model/webhook.js';

import { Fader } from '../../timeout/fader.js';
import { getDelay } from '../../timeout/timeout.js';

import { assert, isValid, printableValues } from '../../tools/validation.js';

export const DEFAULT_OPEN_CLOSE_DURATION = 15;

export abstract class PositionAccessory<C extends PositionConfig = PositionConfig> extends DummyAccessory<PositionConfig> implements EveCharacteristicHost {

  private targetPosition: CharacteristicValue;

  private fader?: Fader;

  constructor(dependency: DummyAccessoryDependency<C>) {
    super(dependency);

    if (!isValid(Position, dependency.config.defaultPosition)) {
      this.log.warning(strings.position.badDefault, this.displayName, `'${dependency.config.defaultPosition}'`, printableValues(Position));
    }

    this.targetPosition = this.defaultPosition;

    if (this.config.simulation !== undefined) {
      if (!assert(this.log, this.displayName, this.config.simulation, 'enabled')) {
        this.config.simulation = undefined;
      } else if (this.config.simulation.enabled === true) {
        this.fader = new Fader(this.addonDependency);
      }
    }

    if (this.hasPositionState) {
      this.service.getCharacteristic(this.homekit.Characteristic.PositionState)
        .onGet(this.getState.bind(this));
    }

    this.service.getCharacteristic(this.targetCharacteristic)
      .onGet(this.getTargetPosition.bind(this))
      .onSet(this.setTargetPosition.bind(this));

    this.service.getCharacteristic(this.currentCharacteristic)
      .onGet(this.getCurrentPosition.bind(this));

    if (this.historyEnabled) {
      setupTimesOpened(this);
    }

    this.initializePosition();
  }

  protected get hasPositionState() {
    return true;
  }

  protected get positionClosed() {
    return 0;
  }

  protected get positionOpen() {
    return 100;
  }

  protected get currentPosition(): CharacteristicValue {
    return this.fader?.value ?? this.targetPosition;
  }

  protected get stateStorageKey() {
    return HKCharacteristicKey.TargetPosition;
  }

  protected get targetCharacteristic() {
    return this.Characteristic.TargetPosition;
  }

  protected get currentCharacteristic() {
    return this.Characteristic.CurrentPosition;
  }

  protected get webhookCommand() {
    return HKCharacteristicKey.TargetPosition;
  }

  protected get webhookValidValues(): Range | Values {
    return new Range(0, 100);
  }

  override get webhooks(): Webhook[] {
    return [
      new Webhook(this, this.webhookCommand,
        this.webhookValidValues,
        () => this.targetPosition,
        (value, syncOnly) => {
          this.setTargetPosition(value, syncOnly);
          return this.logTemplateForCV(value).replace('%s', this.displayName);
        },
        this.config.disableLogging),
    ];
  }

  private async initializePosition() {

    if (!this.isStateful) {
      this.service.updateCharacteristic(this.targetCharacteristic, this.targetPosition);
      this.service.updateCharacteristic(this.currentCharacteristic, this.currentPosition);
      await this.registerStateChange();
      return;
    }

    const position = this.getProperty(this.stateStorageKey);
    if (position === undefined) {
      await this.registerStateChange();
      return;
    }

    await this.setTargetPosition(position);
  }

  private get defaultPosition(): CharacteristicValue {
    return this.config.defaultPosition === Position.OPEN ? this.positionOpen : this.positionClosed;
  }

  private async getState(): Promise<CharacteristicValue> {
    return this.Characteristic.PositionState.STOPPED;
  }

  private async registerStateChange() {
    await this.onStateChange(this.targetPosition === this.positionClosed ? Position.CLOSED : Position.OPEN);
  }

  private async getTargetPosition(): Promise<CharacteristicValue> {
    return this.targetPosition;
  }

  private async setTargetPosition(value: CharacteristicValue, syncOnly: boolean = false): Promise<void> {

    const targetPosition = value === this.positionClosed ? this.positionClosed : this.positionOpen;

    const stateChanged = this.targetPosition !== targetPosition;
    if (stateChanged) {
      this.logPosition(targetPosition);

      this.setProperty(this.stateStorageKey, targetPosition);

      if (!syncOnly) {
        if (this.config.commandOpen && targetPosition !== this.positionClosed) {
          this.executeCommand(this.config.commandOpen);
        } else if (this.config.commandClose && targetPosition === this.positionClosed) {
          this.executeCommand(this.config.commandClose);
        }
      }

      if (this.historyEnabled && targetPosition === this.positionOpen) {
        incrementTimesOpened(this);
      }

      this.onTargetPositionChanged(this.targetPosition as number, targetPosition);
    }

    this.targetPosition = targetPosition;

    if (this.targetPosition !== this.defaultPosition) {
      this.onTriggered(stateChanged);
    } else {
      this.onReset();
    }

    this.service.updateCharacteristic(this.targetCharacteristic, this.targetPosition);
    this.service.updateCharacteristic(this.currentCharacteristic, this.currentPosition);

    if (this.sensor) {
      if (this.sensor.behavior === SensorBehavior.MIRROR) {
        this.sensor.active = this.targetPosition !== this.defaultPosition;
      } else if (this.sensor.behavior === SensorBehavior.TIMER && this.targetPosition !== this.defaultPosition) {
        this.sensor.active = false;
      }
    }

    await this.registerStateChange();
  }

  protected onTargetPositionChanged(oldValue: number, newValue: number) {

    if (this.fader === undefined || this.config.simulation === undefined) {
      return;
    }

    this.fader.cancel();

    const delay = getDelay(this.config.simulation.time ?? DEFAULT_OPEN_CLOSE_DURATION, this.config.simulation.units ?? TimeUnits.SECONDS);
    this.fader.start(oldValue, newValue, delay, (value) => {
      this.service.updateCharacteristic(this.currentCharacteristic, value);
    });
  }

  private async getCurrentPosition(): Promise<CharacteristicValue> {
    return this.currentPosition;
  }

  override async trigger(): Promise<void> {
    const opposite = this.defaultPosition === this.positionClosed ? this.positionOpen : this.positionClosed;
    await this.setTargetPosition(opposite);
  }

  override async reset(): Promise<void> {
    if (this.targetPosition !== this.defaultPosition) {
      await this.setTargetPosition(this.defaultPosition);
      if (this.sensor?.behavior === SensorBehavior.TIMER) {
        this.sensor.active = true;
      }
    }
  }

  private logTemplateForCV(value: CharacteristicValue): string {
    return value === this.positionClosed ? strings.position.closed : strings.position.open;
  }

  protected logPosition(value: CharacteristicValue) {
    this.logIfDesired(this.logTemplateForCV(value));
  }

  override teardown(): void {
    this.fader?.teardown();
    super.teardown();
  }
}
