import { CronJob, validateCronExpression } from 'cron';
import SunCalc from 'suncalc';

import { DummyAddonDependency } from '../accessory/base.js';

import { DelayLogStrings, SECOND, Timeout } from './timeout.js';

import { strings as i18n } from '../i18n/i18n.js';

import { ScheduleType, TimeUnits }  from '../model/enums.js';
import { ScheduleConfig, TimerConfig } from '../model/types.js';

import { Storage } from '../tools/storage.js';
import { assert, isValid, printableValues } from '../tools/validation.js';

const CRON_CUSTOM = 'CRON_CUSTOM';

export class Schedule extends Timeout {

  static new(
    dependency: DummyAddonDependency,
    config: ScheduleConfig | TimerConfig | undefined,
    strings: typeof i18n.schedule,
    timeoutKey: string,
    callback:  () => Promise<void>): Schedule | undefined {

    if (config === undefined) {
      return;
    }

    config = config as ScheduleConfig;

    if ('delay' in config) {
      config = {
        type: ScheduleType.TIMEOUT,
        time: config.delay as number,
        units: config.units,
        random: config.random,
      };
    }

    if (!assert(dependency.log, dependency.caller, config, 'type')) {
      return;
    }

    switch(config.type) {
    case ScheduleType.TIMEOUT:
    case ScheduleType.INTERVAL:

      if (config.time === undefined) {
        dependency.log.error(i18n.accessory.missingRequired, dependency.caller, 'delay');
        return;
      }

      if (!assert(dependency.log, dependency.caller, config, 'units')) {
        return;
      }

      if (!isValid(TimeUnits, config.units!)) {
        dependency.log.error(strings.badUnits, dependency.caller, `'${config.units}'`, printableValues(TimeUnits));
        return;
      }

      break;
    case ScheduleType.CRON:
      if (!assert(dependency.log, dependency.caller, config, 'cron')) {
        return;
      }

      if (config.cron === CRON_CUSTOM && !assert(dependency.log, dependency.caller, config, 'cronCustom')) {
        return;
      }
      break;
    case ScheduleType.DAWN:
    case ScheduleType.DUSK:
    case ScheduleType.GOLDEN_HOUR:
    case ScheduleType.NIGHT:
    case ScheduleType.SUNRISE:
    case ScheduleType.SUNSET:
      if (!assert(dependency.log, dependency.caller, config, 'latitude', 'longitude')) {
        return;
      }
      break;
    default:
      dependency.log.error(strings.badType, dependency.caller, `'${config.type}'`, printableValues(ScheduleType));
      return;
    }

    return new Schedule(dependency, config, strings, timeoutKey, callback);
  }

  private cronjob?: CronJob;

  private timeoutExpiration?: number;

  private constructor(
    dependency: DummyAddonDependency,
    private readonly config: ScheduleConfig,
    private readonly strings: typeof i18n.schedule | typeof i18n.autoReset,
    private readonly timeoutKey: string,
    private readonly callback:  () => Promise<void>,
  ) {
    super(dependency);

    const storedTimestamp = Storage.get(dependency.identifier, timeoutKey) ?? Storage.get(dependency.identifier, 'Timer');
    this.timeoutExpiration = storedTimestamp as number;
    Storage.set(dependency.identifier, 'Timer', undefined);

    switch(this.config.type) {
    case ScheduleType.TIMEOUT:
      break;
    case ScheduleType.INTERVAL:
    case ScheduleType.DAWN:
    case ScheduleType.DUSK:
    case ScheduleType.GOLDEN_HOUR:
    case ScheduleType.NIGHT:
    case ScheduleType.SUNRISE:
    case ScheduleType.SUNSET:
      this.startTimeout(true);
      break;
    case ScheduleType.CRON:
      this.startCron();
      break;
    }
  }

  public setTimeout(rawTime: number, units: TimeUnits) {
    this.config.time = rawTime;
    this.config.units = units;
  }

  public startTimeout(force: boolean = false): number | undefined {

    if (!force && this.config.type !== ScheduleType.TIMEOUT) {
      return;
    }

    super.reset();

    const delay = this.delay;
    this.timeout = setTimeout(async () => {
      this.reset();
      await this.callback();
      if (this.config.type !== ScheduleType.TIMEOUT) {
        this.startTimeout(true);
      }
    }, delay);

    return delay;
  }

  private get delay(): number {

    switch (this.config.type) {
    case ScheduleType.TIMEOUT:
      return this.getTimeoutDelay();
    case ScheduleType.INTERVAL:
      return this.getDelay(this.config.time!, this.config.units!, this.config.random, DelayLogStrings(
        this.strings.timeMilliseconds,
        this.strings.timeSeconds,
        this.strings.timeMinutes,
        this.strings.timeHours,
      ));
    case ScheduleType.DAWN:
    case ScheduleType.DUSK:
    case ScheduleType.GOLDEN_HOUR:
    case ScheduleType.NIGHT:
    case ScheduleType.SUNRISE:
    case ScheduleType.SUNSET:
      return this.getSunDelay();
    }

    throw new Error(`Cannot get delay for type '${this.config.type}'`);
  }

  private getTimeoutDelay(): number {

    const logStrings = DelayLogStrings(
      this.strings.timeMilliseconds,
      this.strings.timeSeconds,
      this.strings.timeMinutes,
      this.strings.timeHours,
    );

    if (this.timeoutExpiration !== undefined) {

      const timeRemaining = this.timeoutExpiration - Date.now();
      this.timeoutExpiration = undefined;

      if (timeRemaining > 0) {
        this.logIfDesired(this.strings.resume);
        return timeRemaining;
      }

      this.logIfDesired(this.strings.expired);
      return 0.1 * SECOND;
    }

    const delay = this.getDelay(this.config.time!, this.config.units!, this.config.random, logStrings);
    this.saveTimeoutExpiration(Date.now() + delay);

    return delay;
  }

  private getSunDelay(): number {

    const date = new Date();
    let eventDate = this.getSunEventDate(date);

    if (eventDate.getTime() - date.getTime() <= 0) {
      date.setDate(date.getDate() + 1);
      eventDate = this.getSunEventDate(date);
    }

    this.logIfDesired(this.strings.sunTime, eventDate.toLocaleTimeString());

    return eventDate.getTime() - Date.now();
  }

  private getSunEventDate(date: Date): Date {

    const times = SunCalc.getTimes(date, this.config.latitude!, this.config.longitude!);

    let eventDate: Date;
    switch (this.config.type) {
    case ScheduleType.DAWN:
      eventDate = times.dawn;
      break;
    case ScheduleType.DUSK:
      eventDate = times.dusk;
      break;
    case ScheduleType.GOLDEN_HOUR:
      eventDate = times.goldenHour;
      break;
    case ScheduleType.NIGHT:
      eventDate = times.night;
      break;
    case ScheduleType.SUNRISE:
      eventDate = times.sunrise;
      break;
    case ScheduleType.SUNSET:
      eventDate = times.sunset;
      break;
    default:
      throw new Error(`Cannot get sun delay for time type '${this.config.type}'`);
    }

    if (this.config.offset) {
      eventDate.setMinutes(eventDate.getMinutes() + this.config.offset);
    }

    return eventDate;
  }

  private startCron() {

    let cron = this.config.cron!;
    if (cron === CRON_CUSTOM) {
      cron = this.config.cronCustom!;
    }

    if (!validateCronExpression(cron).valid) {
      this.log.error(this.strings.invalidCron, this.caller, `'${cron}'`);
      return;
    }

    this.logIfDesired(this.strings.cron);

    this.cronjob = new CronJob(cron, this.callback);
    this.cronjob.start();
  }

  private saveTimeoutExpiration(value: number | undefined) {
    Storage.set(this.dependency.identifier, this.timeoutKey, value);
  }

  override cancel() {

    if (this.config.type !== ScheduleType.TIMEOUT) {
      return;
    }

    if (this.timeout) {
      this.logIfDesired(this.strings.cancel);
    }

    super.cancel();
  }

  override teardown() {

    if (this.config.type === ScheduleType.TIMEOUT) {
      super.reset();
      return;
    }

    super.teardown();
    this.cronjob?.stop();
  }

  override reset() {

    if (this.config.type === ScheduleType.TIMEOUT) {
      this.timeoutExpiration = undefined;
      this.saveTimeoutExpiration(undefined);
    }

    super.reset();
  }
}