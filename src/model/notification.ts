import axios from 'axios';

import { NotificationAPI } from './enums.js';
import { Notification } from './types.js';

import { DummyAddonDependency } from '../accessory/base.js';

import { PLUGIN_NAME } from '../homebridge/settings.js';

import { strings } from '../i18n/i18n.js';

import { assert, isValid, printableValues } from '../tools/validation.js';

const DEFAULT_PUSH_ICON_URL = 'https://notifyicons.pingie.com/icons/mkpu3s46-6e8wy7gh.png';

const P1 = [0x53, 0x10, 0x10, 0x13, 0x02, 0x14, 0x5A, 0x12, 0x13, 0x5E];
const P2 = [0x09, 0x0A, 0x1E, 0x15, 0x00, 0x04, 0x07, 0x06, 0x0F, 0x0A];
const P3 = [0x59, 0x05, 0x1A, 0x1A, 0x18, 0x08, 0x1F, 0x0C, 0x1E, 0x02];

const AXIOS_TIMEOUT = 10000;

export class NotificationManager {

  public static new(dependency: DummyAddonDependency, notification?: Notification): NotificationManager | undefined {

    if (!notification || !assert(dependency.log, dependency.caller, notification, 'api')) {
      return;
    }

    if (!isValid(NotificationAPI, notification.api)) {
      dependency.log.warning(strings.notification.badAPI, this.name, `'${notification.api}'`, printableValues(NotificationAPI));
      return;
    }

    let valid: boolean;
    switch (notification.api) {
    case NotificationAPI.PINGIE_NOTIFY:
      valid = assert(dependency.log, dependency.caller, notification, 'token', 'id', 'text');
      break;
    case NotificationAPI.PUSHOVER:
      valid = assert(dependency.log, dependency.caller, notification, 'token', 'text');
      break;
    }

    if (!valid) {
      return;
    }

    return new NotificationManager(dependency, notification);
  }

  private constructor(private readonly dependency: DummyAddonDependency, private readonly notification: Notification) {}

  public async notify(): Promise<void> {

    switch (this.notification.api) {
    case NotificationAPI.PINGIE_NOTIFY:
      await this.pingieNotify();
      break;
    case NotificationAPI.PUSHOVER:
      await this.pushover();
      break;
    }
  }

  private async pingieNotify() {
    try {

      const endpoint = `https://notifypush.pingie.com/notify-json/${this.notification.id}`;

      const payload: Record<string, string | undefined> = {
        text: this.notification.text,
        title: this.notification.title,
        groupType: this.notification.groupType,
        iconUrl: this.notification.iconURL ?? DEFAULT_PUSH_ICON_URL,
      };

      const response = await axios.post(endpoint, payload,
        {
          headers: { 'Content-Type': 'application/json' },
          params: { token: this.notification.token },
          timeout: AXIOS_TIMEOUT,
          maxRedirects: 0,
          validateStatus: (status) => status < 500,
        },
      );

      payload.token = this.notification.token.substring(0, Math.min(5, this.notification.token.length)) + '…';
      this.dependency.log.ifVerbose(`${endpoint}\n${JSON.stringify(payload)}\n${JSON.stringify(response.data)}`);

      if (response.status !== 200) {
        const errorMessage = `${strings.notification.pushError} - ${response?.data?.message ?? response?.data?.error ?? 'unknown error'}`;
        this.dependency.log.warning(errorMessage, this.dependency.caller);
      } else if (!this.dependency.disableLogging) {
        this.dependency.log.always(strings.notification.pushSuccess, this.dependency.caller);
      }

    } catch (error) {
      this.dependency.log.error(strings.notification.pushError, this.dependency.caller, `\n${error}`);
    }
  }

  private async pushover() {

    const key = Buffer.from(PLUGIN_NAME, 'utf8');
    const bytes = [...P2, ...P3, ...P1];
    const token = this.notification.id ?? String.fromCharCode(...bytes.map((byte, index) => byte ^ key[index % key.length]));

    try {

      const endpoint = 'https://api.pushover.net/1/messages.json';

      const params: Record<string, string | undefined> = {
        token,
        user: this.notification.token,
        message: this.notification.text,
        title: this.notification.title,
      };

      const response = await axios.post(endpoint, undefined,
        {
          headers: { 'Content-Type': 'application/json' },
          params,
          timeout: AXIOS_TIMEOUT,
        },
      );

      params.user = this.notification.token.substring(0, Math.min(5, this.notification.token.length)) + '…';
      this.dependency.log.ifVerbose(`${endpoint}\n${JSON.stringify(params)}\n${JSON.stringify(response.data)}`);

      if (response.status !== 200) {
        const errorMessage = `${strings.notification.pushError} - ${response?.data?.message ?? response?.data?.error ?? 'unknown error'}`;
        this.dependency.log.warning(errorMessage, this.dependency.caller);
      } else if (!this.dependency.disableLogging) {
        this.dependency.log.always(strings.notification.pushSuccess, this.dependency.caller);
      }

    } catch (error) {
      this.dependency.log.error(strings.notification.pushError, this.dependency.caller, `\n${error}`);
    }
  }
}