export type AccessoryConfig = {
  accessory: string;
}

export type LegacyAccessoryConfig = AccessoryConfig & {
  name: string;
  dimmer?: boolean;
  brightness?: number;
  stateful?: boolean;
  reverse?: boolean;
  time?: number;
  resettable?: boolean;
  random?: boolean;
  disableLogging?: boolean;
}

export type PlatformConfig = {
  platform: string;
}

export type DummyPlatformConfig = PlatformConfig & {
  legacyAccessories: LegacyAccessoryConfig[];
  migrate?: boolean;
}