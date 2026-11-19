import { createHash } from 'crypto';

import { DAY, getDelay, HOUR, MINUTE, SECOND, Timeout } from './timeout.js';

import { DummyAddonDependency } from '../accessory/base.js';

import { strings } from '../i18n/i18n.js';

import { TimePeriod, TimeUnits } from '../model/enums.js';
import { LimiterConfig } from '../model/types.js';

import { Storage } from '../tools/storage.js';
import { assert, isValid, printableValues } from '../tools/validation.js';

type Limit = { timeRemaining: number, resetTimestamp: number, startTimestamp?: number };

export default class Limiter extends Timeout {

  static new(dependency: DummyAddonDependency, config?: LimiterConfig): Limiter | undefined {

    if (config === undefined || !assert(dependency.log, dependency.caller, config, 'limit', 'units', 'period')) {
      return;
    }

    if (!isValid(TimeUnits, config.units)) {
      dependency.log.error(strings.limiter.badUnits, dependency.caller, `'${config.units}'`, printableValues(TimeUnits));
      return;
    }

    let periodLength;
    switch(config.period) {
    case TimePeriod.HOUR:
      periodLength = HOUR;
      break;
    case TimePeriod.DAY:
      periodLength = DAY;
      break;
    case TimePeriod.WEEK:
      periodLength = 7 * DAY;
      break;
    case TimePeriod.MONTH:
      periodLength = 31 * DAY;
      break;
    default:
      dependency.log.error(strings.limiter.badPeriod, dependency.caller, `'${config.period}'`, printableValues(TimePeriod));
      return;
    }

    const delay = getDelay(config.limit, config.units);
    if (delay > periodLength) {
      dependency.log.error(strings.limiter.limitExceedsPeriod, dependency.caller);
      return;
    }

    return new Limiter(dependency, config);
  }

  private limit: Limit = { timeRemaining: -1, resetTimestamp: -1, startTimestamp: undefined };

  private readonly identifier: string;

  private constructor(dependency: DummyAddonDependency, private readonly config: LimiterConfig) {
    super(dependency);

    const seed = `${dependency.identifier}:${this.config.limit}:${this.config.units}:${this.config.period}`;
    this.identifier = createHash('sha256').update(seed).digest('hex').slice(0, 32).replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');

    if (config.resetOnRestart === true) {
      return;
    }

    const cache = Storage.get(this.identifier, Limiter.name);
    if (cache === undefined) {
      return;
    }

    this.limit = cache as Limit;

    if (this.limit.startTimestamp === undefined) {
      return;
    }

    const elapsedTime = Date.now() - this.limit.startTimestamp;
    this.limit.timeRemaining = Math.max(0, this.limit.timeRemaining - elapsedTime);
  }

  public start(callback:  () => Promise<void>) {

    if (Date.now() - this.limit.resetTimestamp >= 0 || this.limit.timeRemaining === -1) {
      this.resetTimeRemaining();
      this.resetPeriod();
    }

    const timeUntilPeriodReset = this.limit.resetTimestamp - Date.now();
    if (this.limit.timeRemaining > timeUntilPeriodReset) {
      this.resetTimeRemaining();
      this.limit.timeRemaining += timeUntilPeriodReset;
    }

    if (this.limit.timeRemaining > 0) {
      this.logTimeRemaining();
      this.limit.startTimestamp = Date.now();
      this.storeLimit();
    }

    this.timeout = setTimeout(async () => {
      this.reset();
      await callback();
    }, Math.max(this.limit.timeRemaining, 0.1 * SECOND));
  }

  override cancel() {

    if (!this.limit.startTimestamp) {
      return;
    }

    super.cancel();
  }

  override reset() {
    super.reset();

    if (this.limit.startTimestamp !== undefined) {

      const elapsedTime = Date.now() - this.limit.startTimestamp;
      this.limit.timeRemaining = Math.max(0, this.limit.timeRemaining - elapsedTime);

      this.limit.startTimestamp = undefined;

      this.storeLimit();
    }

    this.logTimeRemaining();
  }

  override teardown() {
    super.reset();
  }

  private resetTimeRemaining() {
    this.limit.timeRemaining = this.getDelay(this.config.limit, this.config.units);
  }

  private resetPeriod() {

    const date = new Date();
    switch (this.config.period) {
    case TimePeriod.HOUR:
      date.setHours(date.getHours() + 1, 0, 0, 0);
      break;
    case TimePeriod.DAY:
      date.setDate(date.getDate() + 1);
      date.setHours(0, 0, 0, 0);
      break;
    case TimePeriod.WEEK:
      date.setDate(date.getDate() + ((7 - date.getDay()) % 7 || 7));
      date.setHours(0, 0, 0, 0);
      break;
    case TimePeriod.MONTH:
      date.setMonth(date.getMonth() + 1, 1);
      date.setHours(0, 0, 0, 0);
      break;
    }

    this.limit.resetTimestamp = date.getTime();
  }

  private storeLimit() {
    Storage.set(this.identifier, Limiter.name, this.limit);
  }

  private logTimeRemaining() {

    if (this.limit.timeRemaining < 0) {
      return;
    }

    if (this.limit.timeRemaining === 0) {
      this.logIfDesired(strings.limiter.expired);
    } else if (this.limit.timeRemaining < MINUTE) {
      this.logIfDesired(strings.limiter.remainingSeconds, Math.round(this.limit.timeRemaining / SECOND));
    } else if (this.limit.timeRemaining < HOUR) {
      this.logIfDesired(strings.limiter.remainingMinutes, Math.round(this.limit.timeRemaining / MINUTE));
    } else if (this.limit.timeRemaining < DAY) {
      this.logIfDesired(strings.limiter.remainingHours, Math.round(this.limit.timeRemaining / HOUR));
    } else {
      this.logIfDesired(strings.limiter.remainingDayPlus);
    }
  }
}