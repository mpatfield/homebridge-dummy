import ARPPing from 'arpping';
import ping from 'ping';

import { strings } from '../i18n/i18n.js';

import { TimeUnits } from '../model/enums.js';

import { DAY, getDelay } from '../timeout/timeout.js';

import { Log } from '../tools/log.js';

type ReachabilityCallback = (reachable: boolean) => (void);

const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

export class Reachability {

  private macAddress?: string;
  private networkAddress?: string;

  private networkAddressExpiry?: number;

  private arpping?: ARPPing;

  protected timeout?: NodeJS.Timeout;

  private _alive?: boolean;

  constructor(
    private readonly log: Log,
    host: string,
    private interval: number | undefined,
    private units: TimeUnits | undefined,
    private readonly callback: ReachabilityCallback,
  ) {

    if (MAC_REGEX.test(host)) {
      this.macAddress = host.toLowerCase().replaceAll('-', ':');
    } else {
      try {
        const url = new URL(host.includes('://') ? host : `http://${host}`);
        this.networkAddress = url.hostname;
      } catch {
        this.networkAddress = host;
      }
    }

    this.startInterval();
  }

  public teardown() {
    clearInterval(this.timeout);
    this.timeout = undefined;
  }

  private get alive(): boolean {
    return this._alive === true;
  }

  private set alive(value: boolean) {

    if (this._alive !== value) {
      this.log.ifVerbose(value ? strings.reachability.reachable : strings.reachability.unreachable, `'${this.macAddress ?? this.networkAddress}'`);
    }

    this._alive = value;
    this.callback(value);
  }

  private async startInterval() {

    const delay = getDelay(this.interval ?? 60, this.units ?? TimeUnits.SECONDS);

    const runCheck = async () => {
      await this.check();
      this.timeout = setTimeout(runCheck, delay);
    };

    await runCheck();
  }

  private async check() {

    if (this.networkAddress !== undefined) {

      try {
        this.alive = (await ping.promise.probe(this.networkAddress)).alive;
      } catch (err) {
        this.log.warning(strings.reachability.error, this.networkAddress, err);
      }

      if (!this.alive && this.networkAddressExpiry !== undefined && Date.now() > this.networkAddressExpiry) {
        this.networkAddress = undefined;
      }

      return;
    }

    if (this.macAddress !== undefined) {

      if (this.arpping === undefined) {
        this.arpping = new ARPPing({ useCache: false });
      }

      try {
        const result = await this.arpping.searchByMacAddress([this.macAddress]);
        const host = result.hosts.filter ( host => host.mac === this.macAddress).pop();
        this.alive = host !== undefined;
        this.networkAddress = host?.ip;
        this.networkAddressExpiry = Date.now() + DAY;
      } catch (err) {
        this.log.warning(strings.reachability.error, this.macAddress, err);
      }
    }
  }
}
