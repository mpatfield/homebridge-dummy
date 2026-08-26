import fs from 'fs';
import path from 'path';
import { Tail } from 'tail';

import { Log } from '../tools/log.js';
import { strings } from '../i18n/i18n.js';

type ListenerCallback = () => (void);

export class LogWatcher {

  private tailFile?: Tail;

  private readonly matchers = new Map<RegExp, ListenerCallback[]>();

  constructor(private readonly log: Log, private readonly storagePath: string) {
  }

  private startWatching() {

    if (this.tailFile !== undefined) {
      return;
    }

    const logFilePath = path.join(this.storagePath, 'homebridge.log');

    if (!fs.existsSync(logFilePath)) {
      this.log.error(strings.logWatcher.missingFile, `'${logFilePath}'`);
      return;
    }

    this.tailFile = new Tail(logFilePath);

    this.tailFile.on('line', (line: string) => {
      for (const [matcher, callbacks] of this.matchers.entries()) {
        if (matcher.test(line)) {
          callbacks.forEach(cb => cb());
        }
      }
    });

    this.tailFile.on('error', (err: Error) => this.log.error(strings.logWatcher.error, String(err)));

    this.tailFile.watch();
  }

  public teardown() {
    this.tailFile?.unwatch();
    this.tailFile = undefined;
  }

  public registerPattern(pattern: string, callback: ListenerCallback) {

    let regex: RegExp;
    try {
      regex = new RegExp(pattern);
    } catch (e) {
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      regex = new RegExp(escapedPattern);
    }

    const callbacks = this.matchers.get(regex) ?? [];
    callbacks.push(callback);
    this.matchers.set(regex, callbacks);

    this.startWatching();
  }
}