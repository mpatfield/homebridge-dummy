import { PositionAccessory } from './position.js';

import { HomeKitType } from '../../model/homekit.js';
import { DoorConfig } from '../../model/types.js';

export class DoorAccessory extends PositionAccessory<DoorConfig> {

  override getHomeKitType(): HomeKitType {
    return HomeKitType.Door;
  }

}