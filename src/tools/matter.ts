import { DeviceClassification } from '@matter/model';
import { DeviceTypeId } from '@matter/types';

import { EndpointType, MatterAPI } from 'homebridge';

export type GetMatter = (caller: string) => MatterAPI;

export const MatterUnsupportedDeviceType: EndpointType = {
  name: 'MatterUnsupportedDeviceType',
  deviceType: DeviceTypeId(-1),
  deviceRevision: -1,
  deviceClass: DeviceClassification.Base,
  behaviors: {},
  clientClusters: {},
  requirements:  {},
};

export type MatterClusterPath = { characteristicKey: MatterCharacteristicKey, valueKey: MatterValueKey };

export function MatterClusterPath(characteristicKey: MatterCharacteristicKey, valueKey: MatterValueKey): MatterClusterPath {
  return { characteristicKey, valueKey };
}

export enum MatterType {
}

export enum MatterCharacteristicKey {
}

export enum MatterValueKey {
}

export type MatterValue = {
  unknown: unknown,
}