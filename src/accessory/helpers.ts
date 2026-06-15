import { DummyAccessory, DummyAccessoryDependency } from './base.js';

import { ButtonAccessory } from './button.js';
import { HumidifierAccessory } from './climate/humidifier.js';
import { ThermostatAccessory } from './climate/thermostat.js';
import { LockAccessory } from './lock.js';
import { LightbulbAccessory } from './onoff/lightbulb.js';
import { OutletAccessory } from './onoff/outlet.js';
import { SwitchAccessory } from './onoff/switch.js';
import { BlindAccessory } from './position/blind.js';
import { DoorAccessory } from './position/door.js';
import { WindowAccessory } from './position/window.js';
import { GarageDoorAccessory } from './position/garage.js';
import { HumiditySensorAccessory } from './sensor/humidity.js';
import { TemperatureSensorAccessory } from './sensor/temperature.js';
import { ValveAccessory } from './valve.js';

import { strings } from '../i18n/i18n.js';

import { HomeKitType } from '../model/homekit.js';
import { DummyConfig } from '../model/types.js';

export function createDummyAccessory(dependency: DummyAccessoryDependency<DummyConfig>): DummyAccessory<DummyConfig> | null {

  switch(dependency.config.type) {
  case HomeKitType.Door:
    return new DoorAccessory(dependency);
  case HomeKitType.GarageDoorOpener:
    return new GarageDoorAccessory(dependency);
  case HomeKitType.HumidifierDehumidifier:
    return new HumidifierAccessory(dependency);
  case HomeKitType.HumiditySensor:
    return new HumiditySensorAccessory(dependency);
  case HomeKitType.Lightbulb:
    return new LightbulbAccessory(dependency);
  case HomeKitType.LockMechanism:
    return new LockAccessory(dependency);
  case HomeKitType.Outlet:
    return new OutletAccessory(dependency);
  case HomeKitType.StatelessProgrammableSwitch:
    return new ButtonAccessory(dependency);
  case HomeKitType.Switch:
    return new SwitchAccessory(dependency);
  case HomeKitType.TemperatureSensor:
    return new TemperatureSensorAccessory(dependency);
  case HomeKitType.Thermostat:
    return new ThermostatAccessory(dependency);
  case HomeKitType.Valve:
    return new ValveAccessory(dependency);
  case HomeKitType.Window:
    return new WindowAccessory(dependency);
  case HomeKitType.WindowCovering:
    return new BlindAccessory(dependency);
  default:
    dependency.log.error(strings.startup.unsupportedType, `'${dependency.config.type}'`);
    return null;
  }
}