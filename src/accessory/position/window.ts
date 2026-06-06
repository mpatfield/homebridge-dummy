import { PositionAccessory } from './position.js';

import { HomeKitType } from '../../model/enums.js';
import { WindowConfig } from '../../model/types.js';

export class WindowAccessory extends PositionAccessory<WindowConfig> {

  override getHomeKitType(): HomeKitType {
    return HomeKitType.Window;
  }

}