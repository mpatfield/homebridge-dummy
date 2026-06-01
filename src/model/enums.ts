import { isValid } from '../tools/validation.js';

export enum AccessoryType {
  Door = 'Door',
  GarageDoorOpener = 'GarageDoorOpener',
  HumidifierDehumidifier = 'HumidifierDehumidifier',
  HumiditySensor = 'HumiditySensor',
  Lightbulb = 'Lightbulb',
  LockMechanism = 'LockMechanism',
  Outlet = 'Outlet',
  StatelessProgrammableSwitch = 'StatelessProgrammableSwitch',
  Switch = 'Switch',
  TemperatureSensor = 'TemperatureSensor',
  Thermostat = 'Thermostat',
  Valve = 'Valve',
  Window = 'Window',
  WindowCovering = 'WindowCovering'
}

export type CharacteristicKey = HKCharacteristicKey | EveCharacteristicKey;

export enum HKCharacteristicKey {
  Brightness = 'Brightness',
  CurrentHeatingCoolingState = 'CurrentHeatingCoolingState',
  CurrentRelativeHumidity = 'CurrentRelativeHumidity',
  CurrentTemperature = 'CurrentTemperature',
  LockTargetState = 'LockTargetState',
  On = 'On',
  ProgrammableSwitchEvent = 'ProgrammableSwitchEvent',
  SetDuration = 'SetDuration',
  TargetHeatingCoolingState = 'TargetHeatingCoolingState',
  TargetDoorState = 'TargetDoorState',
  TargetPosition = 'TargetPosition',
  TargetRelativeHumidity = 'TargetRelativeHumidity',
  TargetTemperature = 'TargetTemperature',
}

export enum EveCharacteristicKey {
  ClosedDuration = 'ClosedDuration',
  LastActivation = 'LastActivation',
  OpenDuration = 'OpenDuration',
  ResetTotal = 'ResetTotal',
  TimesOpened = 'TimesOpened',
}

export enum SensorType {
  CarbonDioxideSensor = 'CarbonDioxideSensor',
  CarbonMonoxideSensor = 'CarbonMonoxideSensor',
  ContactSensor = 'ContactSensor',
  LeakSensor = 'LeakSensor',
  MotionSensor = 'MotionSensor',
  OccupancySensor = 'OccupancySensor',
  SmokeSensor = 'SmokeSensor',
}

export enum SensorBehavior {
  MIRROR = 'MIRROR',
  TIMER = 'TIMER',
}

export enum SensorCharacteristic {
  CarbonDioxideDetected = 'CarbonDioxideDetected',
  CarbonMonoxideDetected = 'CarbonMonoxideDetected',
  ContactSensorState = 'ContactSensorState',
  LeakDetected = 'LeakDetected',
  MotionDetected = 'MotionDetected',
  OccupancyDetected = 'OccupancyDetected',
  SmokeDetected = 'SmokeDetected',
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