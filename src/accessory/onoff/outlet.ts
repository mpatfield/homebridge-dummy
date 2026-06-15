import { OnOffAccessory } from './onoff.js';

import { HomeKitType } from '../../model/homekit.js';
import { MatterType } from '../../model/matter.js';
import { OutletConfig } from '../../model/types.js';

export class OutletAccessory extends OnOffAccessory<OutletConfig> {

  override getHomeKitType(): HomeKitType {
    return HomeKitType.Outlet;
  }

  override getMatterType(): MatterType {
    return MatterType.OnOffOutlet;
  }
}