/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from 'homebridge';

export enum LogType {
  ALWAYS,
  WARNING,
  ERROR,
}

export class Log {

  constructor(
    private readonly logger: Logger,
    public readonly verbose: boolean,    
  ) {}

  public always(message: string, ...parameters: any[]) {
    this.logger.info(message, ...parameters);
  }

  public warning(message: string, ...parameters: any[]) {
    this.logger.warn(message, ...parameters);
  }

  public error(message: string, ...parameters: any[]) {
    this.logger.error(message, ...parameters);
  }

  public ifVerbose(message: string, ...parameters: any[]): void;
  public ifVerbose(level: LogType, message: string, ...parameters: any[]): void;
  public ifVerbose(levelOrMessage: LogType | string, ...rest: any[]) {
    if (!this.verbose) {
      return;
    }

    if (typeof levelOrMessage === 'string') {
      this.always(levelOrMessage, ...rest);
      return;
    }

    const [message, ...parameters] = rest;
    switch(levelOrMessage) {
    case LogType.ALWAYS:
      this.always(message, ...parameters);
      break;
    case LogType.WARNING:
      this.warning(message, ...parameters);
      break;
    case LogType.ERROR:
      this.error(message, ...parameters);
      break;
    }
  }
}