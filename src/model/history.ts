import { F_OK } from 'constants';
import fakegato, { HistoryServiceProvider, HistoryService } from 'fakegato-history/fakegato-history.cjs';
import { access, unlink } from 'fs/promises';
import { API, CharacteristicValue, Nullable } from 'homebridge';
import path from 'path';

import { EveCharacteristicKey } from './enums.js';
import { DummyConfig, HomeKitAccessory } from './types.js';

import { DummyAccessory } from '../accessory/base.js';
import { EveCharacteristic } from '../accessory/characteristic/eve.js';

import { strings } from '../i18n/i18n.js';

import { Log } from '../tools/log.js';

export enum HistoryType {
  CUSTOM = 'custom',
  WEATHER = 'weather',
  DOOR = 'door',
  MOTION = 'motion',
}

export type HistoryEntry = {
  humidity?: number,
  power?: number,
  status?: number,
  temp?: number,
  time?: number,
}

type HistoryOptions = {
  disableRepeatLastData?: boolean,
  disableTimer?: boolean,
  filename?: string,
  path?: string,
  size?: number,
  storage?: 'fs',
}

type Accessory = DummyAccessory<DummyConfig>;

let ServiceProvider: HistoryServiceProvider | undefined;

const HISTORY_UUID = 'dbca6d94-6d1b-45e1-9feb-daf030819984';

function HistoryService(type: HistoryType, accessory: HomeKitAccessory, options?: HistoryOptions): HistoryService {

  if (!ServiceProvider) {
    throw new Error('HistoryServiceProvider not initialized');
  }

  return new ServiceProvider(type, accessory, options);
}

export class History {

  private static _instance: History | undefined;
  public static instance(api: API, log: Log) : History {
    if (History._instance === undefined) {
      History._instance = new History(api, log);
    }
    return History._instance;
  }

  private readonly historyServices = new Map<string, HistoryService>();
  private readonly persistPath: string;

  private readonly cleanedUp = new Set<string>();

  constructor(private readonly api: API, private readonly log: Log) {

    if (ServiceProvider) {
      throw new Error('HistoryServiceProvider already initialized');
    }

    ServiceProvider = fakegato(api);
    this.persistPath = api.user.persistPath();
  }

  public record(accessory: Accessory, type: HistoryType, entry: HistoryEntry, updateLastActivation: boolean = false) {

    if (!accessory.historyEnabled) {
      this.cleanup(accessory);
      return;
    }

    const historyService = this.historyServices.get(accessory.identifier)
      ?? this.createHistoryService(accessory, type, updateLastActivation);

    const time = Math.floor(Date.now() / 1000);
    entry = {
      time: time,
      ...entry,
    };

    this.log.ifVerbose(`${accessory.displayName} ${History.name}.${this.record.name}(${type}) — `, JSON.stringify(entry));

    historyService.addEntry(entry);

    if (updateLastActivation && !isNaN(historyService.getInitialTime()) && accessory.getProperty(EveCharacteristicKey.LastActivation) !== undefined) {
      const lastActivation = time - historyService.getInitialTime();
      accessory.setProperty(EveCharacteristicKey.LastActivation, lastActivation);
      accessory.service.updateCharacteristic(EveCharacteristic(EveCharacteristicKey.LastActivation), lastActivation);
    }
  }

  private createHistoryService(accessory: Accessory, type: HistoryType, addLastActivation: boolean): HistoryService {

    const options: HistoryOptions = {
      disableRepeatLastData: false,
      disableTimer: false,
      size: 4032,
      storage: 'fs',
      path: this.persistPath,
      filename: this.getFilename(accessory),
    };

    const historyService = HistoryService(type, accessory.homekitAccessory, options);
    this.historyServices.set(accessory.identifier, historyService);

    if (!addLastActivation) {
      return historyService;
    }

    setTimeout( () => {

      if (historyService.lastEntry === undefined || historyService.memorySize === undefined) {
        return;
      }

      const entry = historyService.history[ historyService.lastEntry % historyService.memorySize ];
      if (entry === undefined || entry.time === undefined) {
        return;
      }

      const lastActivation = entry.time - historyService.getInitialTime();
      accessory.setProperty(EveCharacteristicKey.LastActivation, lastActivation);

      accessory.service.addOptionalCharacteristic(EveCharacteristic(EveCharacteristicKey.LastActivation));

      const characteristic = accessory.service.getCharacteristic(EveCharacteristic(EveCharacteristicKey.LastActivation));
      characteristic.updateValue(lastActivation);

      characteristic.onGet(async (): Promise<Nullable<CharacteristicValue>> => {
        return accessory.getProperty(EveCharacteristicKey.LastActivation) ?? lastActivation;
      });

    }, 1000);

    return historyService;
  }

  private getFilename(accessory: Accessory): string {
    return this.api.hap.uuid.generate(accessory.identifier + HISTORY_UUID);
  }

  private async cleanup(accessory: Accessory) {

    if (this.cleanedUp.has(accessory.identifier)) {
      return;
    }

    this.cleanedUp.add(accessory.identifier);

    const filename = this.getFilename(accessory);
    const filePath = path.join(this.persistPath, filename);

    const fileExists = await this.fileExists(filePath);
    if (!fileExists) {
      return;
    }

    this.log.ifVerbose(strings.history.cleanup, accessory.displayName);

    try {
      await unlink(filePath);
    } catch (error) {

      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        return;
      }

      this.log.error(strings.history.cleanupFailed, accessory.displayName, filename);
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, F_OK);
      return true;
    } catch {
      return false;
    }
  }
}