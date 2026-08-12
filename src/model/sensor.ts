import { SensorCharacteristic, SensorType } from './homekit.js';

import { strings } from '../i18n/i18n.js';

type SensorStrings = { active: string, inactive: string };
export type SensorInfo = { characteristic: SensorCharacteristic, strings: SensorStrings };

const INFO_MAP: { [key in SensorType]: SensorInfo } = {
  [SensorType.CarbonDioxideSensor]: { characteristic: SensorCharacteristic.CarbonDioxideDetected, strings: strings.sensor.carbonDioxide },
  [SensorType.CarbonMonoxideSensor]: { characteristic: SensorCharacteristic.CarbonMonoxideDetected, strings: strings.sensor.carbonMonoxide },
  [SensorType.ContactSensor]: { characteristic: SensorCharacteristic.ContactSensorState, strings: strings.sensor.contact },
  [SensorType.LeakSensor]: { characteristic: SensorCharacteristic.LeakDetected, strings: strings.sensor.leak },
  [SensorType.MotionSensor]: { characteristic: SensorCharacteristic.MotionDetected, strings: strings.sensor.motion },
  [SensorType.OccupancySensor]: { characteristic: SensorCharacteristic.OccupancyDetected, strings: strings.sensor.occupancy },
  [SensorType.SmokeSensor]: { characteristic: SensorCharacteristic.SmokeDetected, strings: strings.sensor.smoke },
};

export function sensorInfoForType(type: SensorType) {
  return INFO_MAP[type];
}