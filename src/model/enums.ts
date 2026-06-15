import { isValid } from '../tools/validation.js';

export enum Protocol {
  HomeKit = 'HomeKit',
  Matter = 'Matter',
}

export enum SensorBehavior {
  MIRROR = 'MIRROR',
  TIMER = 'TIMER',
}

export enum NotificationAPI {
  PINGIE_NOTIFY = 'PINGIE_NOTIFY',
}

export enum ConditionOperator {
  AND = 'and',
  OR = 'or'
}

export enum OperandType {
  ACCESSORY = 'ACCESSORY',
  LOG = 'LOG',
  PING = 'PING',
}

export enum PingAvailability {
  AVAILABLE = 'AVAILABLE',
  NOT_AVAILABLE = 'NOT_AVAILABLE'
}

export enum OnState {
  ON = 'on',
  OFF = 'off',
}

export enum LockState {
  LOCKED = 'locked',
  UNLOCKED = 'unlocked',
}

export enum Position {
  OPEN = 'open',
  CLOSED = 'closed',
}

export type AccessoryState = OnState | Position | LockState;

type StringEnum = { [s: string]: string; }
export function getStateType(input: AccessoryState): StringEnum | undefined {

  if (isValid(OnState, input as OnState)) {
    return OnState;
  }

  if (isValid(Position, input as Position)) {
    return Position;
  }

  if (isValid(LockState, input as LockState)) {
    return LockState;
  }
}

export enum HumidifierType {
  DEHUMIDIFIER = 'dehumidifier',
  HUMIDIFIER = 'humidifier',
}

export enum ThermostatState {
  AUTO = 'auto',
  COOL = 'cool',
  HEAT = 'heat',
  OFF = 'off',
}

export enum TimePeriod {
  HOUR = 'HOUR',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

export enum TimeUnits {
  MILLISECONDS = 'MILLISECONDS',
  SECONDS = 'SECONDS',
  MINUTES = 'MINUTES',
  HOURS = 'HOURS',
}

export enum FadeOutType {
  INCREMENTAL = 'INCREMENTAL',
  FIXED = 'FIXED',
}

export enum ScheduleType {
  TIMEOUT = 'TIMEOUT',
  INTERVAL = 'INTERVAL',
  CRON = 'CRON',
  DAWN = 'DAWN',
  DUSK = 'DUSK',
  GOLDEN_HOUR = 'GOLDEN_HOUR',
  NIGHT = 'NIGHT',
  SUNRISE = 'SUNRISE',
  SUNSET = 'SUNSET',
}

export enum TemperatureUnits {
  CELSIUS = 'C',
  FAHRENHEIT = 'F',
}

export enum ValveType {
  FAUCET = 'faucet',
  GENERIC = 'generic',
  IRRIGATION = 'irrigation',
  SHOWER = 'shower',
}