import { PositionAccessory } from './position.js';

import { HomeKitType } from '../../model/homekit.js';
import { BlindConfig } from '../../model/types.js';

export class BlindAccessory extends PositionAccessory<BlindConfig> {

  override getHomeKitType(): HomeKitType {
    return HomeKitType.WindowCovering;
  }

}