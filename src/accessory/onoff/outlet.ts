import { OnOffAccessory } from './onoff.js';

import { HomeKitType } from '../../model/enums.js';
import { OutletConfig } from '../../model/types.js';

export class OutletAccessory extends OnOffAccessory<OutletConfig> {

  override getHomeKitType(): HomeKitType {
    return HomeKitType.Outlet;
  }
}