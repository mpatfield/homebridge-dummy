import { OnOffAccessory } from './onoff.js';

import { HomeKitType } from '../../model/enums.js';
import { SwitchConfig } from '../../model/types.js';

export class SwitchAccessory extends OnOffAccessory<SwitchConfig> {

  override getHomeKitType(): HomeKitType {
    return HomeKitType.Switch;
  }
}