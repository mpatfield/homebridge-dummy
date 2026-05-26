/* eslint-disable @typescript-eslint/no-explicit-any */
 declare module 'fakegato-history/fakegato-history.cjs' {

  import { API, PlatformAccessory } from 'homebridge';

  export interface HistoryService {
    lastEntry: number;
    memorySize: number;
    history: [any];
    addEntry(entry: object): void;
    getInitialTime(): number;
  }

  export interface HistoryServiceProvider {
    new(type: string, accessory: PlatformAccessory, options?: object): HistoryService;
  }

  function fakegato(api: API): HistoryServiceProvider;
  export default fakegato;
}