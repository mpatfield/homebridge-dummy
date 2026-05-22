import { AccessoryConfig, CharacteristicValue, PlatformConfig } from 'homebridge';

export type ServiceType = typeof import('homebridge').Service;
export type CharacteristicType = typeof import('homebridge').Characteristic;

import {
  AccessoryState, AccessoryType, ConditionOperator, FadeOutType, HumidifierType, LockState, NotificationAPI, OnState, OperandType,
  PingAvailability, Position, ScheduleType, SensorBehavior, SensorType, ThermostatState, TemperatureUnits, TimePeriod, TimeUnits, ValveType,
} from './enums.js';

export type LegacyAccessoryConfig = AccessoryConfig & {
  name: string,
  dimmer?: boolean,
  brightness?: number,
  stateful?: boolean,
  reverse?: boolean,
  time?: number,
  resettable?: boolean,
  random?: boolean,
  disableLogging?: boolean,
}

export type WebhookConfig = {
  port?: number
  disableSSL?: boolean,
  key?: string,
  cert?: string,
  pfx?: string,
  passphrase?: string,
}

export type DummyPlatformConfig = PlatformConfig & {
  accessories?: DummyConfig[],
  webhookConfig?: WebhookConfig,
  /**
   * @deprecated
   */
  webhookPort?: number,
  verbose?: boolean,
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Assertable = {
}

export type ScheduleConfig = Assertable & {
  type: ScheduleType,
  time?: number,
  units?: TimeUnits,
  random?: boolean,
  cron?: string,
  cronCustom?: string,
  offset?: number,
  latitude?: number,
  longitude?: number,
}

export type SensorConfig = Assertable & {
  type: SensorType,
  /**
   * @deprecated
   */
  timerControlled?: boolean,
  behavior?: SensorBehavior,
}

export type HumiditySensorConfig = DummyConfig & {
  commandHumidity?: string,
}

export type TemperatureSensorConfig = DummyConfig & {
  temperatureUnits?: TemperatureUnits
  commandTemperature?: string,
}

export type Notification = Assertable & {
  api: NotificationAPI,
  token: string,
  id: string,
  title?: string,
  text: string,
  groupType?: string,
  iconURL?: string,
}

export type LimiterConfig = Assertable & {
  /**
   * @deprecated
   */
  id?: string,
  limit: number,
  units: TimeUnits,
  period: TimePeriod,
  resetOnRestart?: boolean,
}

export type Operand = Assertable & {
  type: OperandType,
  accessoryId?: string,
  accessoryState?: AccessoryState,
  pattern?: string,
  pingHost?: string,
  pingAvailability?: PingAvailability,
  pingInterval?: number,
  pingUnits?: TimeUnits,
}

export type ConditionsConfig = Assertable & {
  operator: ConditionOperator,
  operands: Operand[],
}

export type SimulationConfig = Assertable & {
  enabled: boolean,
  time?: number,
  units?: TimeUnits,
}

export type FadeOutConfig = Assertable & {
  type: FadeOutType
  time: number,
  units: TimeUnits,
}

export type DummyConfig = {
  id: string,
  name: string,
  type: AccessoryType,
  groupName?: string,
  sensor?: SensorConfig,
  schedule?: ScheduleConfig,
  autoReset?: ScheduleConfig,
  notification?: Notification,
  limiter?: LimiterConfig,
  conditions?: ConditionsConfig,
  simulation?: SimulationConfig,
  resetOnRestart?: boolean,
  /**
   * @deprecated
   */
  enableWebook?: boolean
  enableWebhook?: boolean,
  enableHistory?: boolean,
  disableLogging?: boolean,
  commandSync?: string,
  syncSchedule?: ScheduleConfig,
}

export type OnOffConfig = DummyConfig & {
  defaultState?: OnState,
  commandOn?: string,
  commandOff?: string,
  /**
   * @deprecated
   */
  defaultOn?: CharacteristicValue,
}

export type OutletConfig = OnOffConfig & {
}

export type LightbulbConfig = OnOffConfig & {
  /**
   * @deprecated
   */
  defaultBrightness?: CharacteristicValue,
  isDimmer?: boolean,
  fadeOut?: FadeOutConfig,
}

export type SwitchConfig = OnOffConfig & {
}

export type ButtonConfig = DummyConfig & {
  commandOn?: string,
}

export type LockConfig = DummyConfig & {
  defaultLockState?: LockState,
  commandLock?: string,
  commandUnlock?: string,
}

export type HumidifierConfig = OnOffConfig & {
  humidifierType?: HumidifierType,
}

export type ThermostatConfig = DummyConfig & {
  temperatureUnits?: TemperatureUnits,
  defaultThermostatState?: ThermostatState,
  validStates?: [ThermostatState],
  defaultTemperature?: number;
  minimumTemperature?: number,
  maximumTemperature?: number,
  commandOn?: string,
  commandOff?: string,
  commandTemperature?: string,
}

export type ValveConfig = OnOffConfig & {
  valveType?: ValveType,
}

export type PositionConfig = DummyConfig & {
  defaultPosition?: Position,
  commandOpen?: string,
  commandClose?: string,
}

export type GarageDoorConfig = PositionConfig & {
}

export type DoorConfig = PositionConfig & {
}

export type WindowConfig = PositionConfig & {
}

export type BlindConfig = PositionConfig & {
}

export type GroupConfig = {
  accessories: DummyConfig[],
}