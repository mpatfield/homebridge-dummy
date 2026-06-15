import { OnOffAccessory } from './onoff.js';

import { HomeKitType } from '../../model/homekit.js';
import { MatterType } from '../../model/matter.js';
import { SwitchConfig } from '../../model/types.js';

export class SwitchAccessory extends OnOffAccessory<SwitchConfig> {

  override getHomeKitType(): HomeKitType {
    return HomeKitType.Switch;
  }

  override getMatterType(): MatterType {
    return MatterType.OnOffSwitch;
  }
}