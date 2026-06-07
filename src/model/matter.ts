export const MATTER_SERIAL_MAX_LEN = 32;

export enum MatterClusterKey {
  onOff = 'onOff',
}

export enum MatterValueKey {
  onOff = 'onOff',
}

export enum MatterType {
  OnOffOutlet = 'OnOffOutlet',
  OnOffSwitch = 'OnOffSwitch',
}

export type MatterValue = boolean;