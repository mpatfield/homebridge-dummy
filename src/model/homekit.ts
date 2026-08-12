export enum HomeKitType {
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
  TargetTemperature = 'TargetTemperature'
}

export enum EveCharacteristicKey {
  ClosedDuration = 'ClosedDuration',
  LastActivation = 'LastActivation',
  OpenDuration = 'OpenDuration',
  ResetTotal = 'ResetTotal',
  TimesOpened = 'TimesOpened'
}

export enum SensorType {
  CarbonDioxideSensor = 'CarbonDioxideSensor',
  CarbonMonoxideSensor = 'CarbonMonoxideSensor',
  ContactSensor = 'ContactSensor',
  LeakSensor = 'LeakSensor',
  MotionSensor = 'MotionSensor',
  OccupancySensor = 'OccupancySensor',
  SmokeSensor = 'SmokeSensor'
}

export enum SensorCharacteristicKey {
  CarbonDioxideDetected = 'CarbonDioxideDetected',
  CarbonMonoxideDetected = 'CarbonMonoxideDetected',
  ContactSensorState = 'ContactSensorState',
  LeakDetected = 'LeakDetected',
  MotionDetected = 'MotionDetected',
  OccupancyDetected = 'OccupancyDetected',
  SmokeDetected = 'SmokeDetected'
}