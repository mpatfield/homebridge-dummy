import { SensorCharacteristicKey, SensorType } from './homekit.js';

import { strings } from '../i18n/i18n.js';

type SensorStrings = { active: string, inactive: string };
export type SensorInfo = { characteristic: SensorCharacteristicKey, strings: SensorStrings };

const INFO_MAP: { [key in SensorType]: SensorInfo } = {
  [SensorType.CarbonDioxideSensor]: { characteristic: SensorCharacteristicKey.CarbonDioxideDetected, strings: strings.sensor.carbonDioxide },
  [SensorType.CarbonMonoxideSensor]: { characteristic: SensorCharacteristicKey.CarbonMonoxideDetected, strings: strings.sensor.carbonMonoxide },
  [SensorType.ContactSensor]: { characteristic: SensorCharacteristicKey.ContactSensorState, strings: strings.sensor.contact },
  [SensorType.LeakSensor]: { characteristic: SensorCharacteristicKey.LeakDetected, strings: strings.sensor.leak },
  [SensorType.MotionSensor]: { characteristic: SensorCharacteristicKey.MotionDetected, strings: strings.sensor.motion },
  [SensorType.OccupancySensor]: { characteristic: SensorCharacteristicKey.OccupancyDetected, strings: strings.sensor.occupancy },
  [SensorType.SmokeSensor]: { characteristic: SensorCharacteristicKey.SmokeDetected, strings: strings.sensor.smoke },
};

export function sensorInfoForType(type: SensorType) {
  return INFO_MAP[type];
}