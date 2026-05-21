import express, { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { CharacteristicValue } from 'homebridge';
import { Server } from 'http';
import { createServer, ServerOptions } from 'https';
import path from 'path';

import { DummyAccessory } from '../accessory/base.js';

import { HKCharacteristicKey } from './enums.js';
import { DummyConfig, WebhookConfig } from './types.js';

import { strings } from '../i18n/i18n.js';

import { Log } from '../tools/log.js';
import { toPrimitive } from '../tools/primitive.js';
import { assert } from '../tools/validation.js';

const DEFAULT_PORT = 63743;

type WebhookGetter = () => (CharacteristicValue | undefined);
type WebhookSetter = (value: CharacteristicValue, syncOnly: boolean) => (string);

export class Range {
  constructor(readonly min: number, readonly max: number) {}
}

export class Values {
  constructor(readonly values: CharacteristicValue[], readonly asString: string) {}
}

export class Webhook {

  constructor(
    public readonly accessory: DummyAccessory<DummyConfig>,
    public readonly characteristic: HKCharacteristicKey,
    public readonly validValues: Range | Values,
    public readonly getter: WebhookGetter,
    public readonly setter: WebhookSetter,
    public readonly disableLogging: boolean | undefined,
  ){}
}

export class WebhookManager {

  private server: Server | undefined = undefined;

  private readonly webhooks: Webhook[] = [];

  constructor(
    private readonly log: Log,
    configPath: string,
    private readonly config: WebhookConfig = {},
  ) {

    try {
      const systemConfig = readFileSync(configPath, { encoding: 'utf8' });
      const systemSSLConfig = JSON.parse(systemConfig).platforms.filter( (c: Record<string, string>) => c.platform === 'config')[0].ssl;

      if (systemSSLConfig !== undefined) {

        if (systemSSLConfig.selfSigned === true) {
          systemSSLConfig.key = systemSSLConfig.key ?? path.join(configPath, '../ssl-certs/private-key.pem');
          systemSSLConfig.cert = systemSSLConfig.cert ?? path.join(configPath, '../ssl-certs/certificate.pem');
        }

        this.config = { ...systemSSLConfig , ...this.config };
      }

    } catch {
      // Nothing
    }

    this.config.port = this.config.port ?? DEFAULT_PORT;

    if (typeof this.config.port !== 'number') {
      log.error(strings.webhook.badPort, DEFAULT_PORT);
      this.config.port = DEFAULT_PORT;
    }

    for (const keyString of ['key', 'cert', 'pfx', 'passphrase']) {
      const key = keyString as keyof WebhookConfig;
      if (this.config[key] !== undefined && typeof this.config[key] !== 'string') {
        log.error(strings.webhook.badSSLParameter, `'${key}'`, '\'string\'', `'${typeof this.config[key]}'`);
        this.config[key] = undefined;
      }
    }
  }

  public registerWebhooks(webhooks: Webhook[]) {
    for (const webhook of webhooks) {
      this.webhooks.push(webhook);
      if (!webhook.disableLogging) {
        this.log.always(strings.webhook.register, webhook.accessory.name, `\`${webhook.accessory.identifier}\`` , `\`${webhook.characteristic}\``);
      }
    }
  }

  public startServer() {

    if (this.server !== undefined) {
      throw new Error('Trying to start webhook server when it is already running');
    }

    if (this.webhooks.length === 0) {
      return;
    }

    const exp = express();
    exp.use(express.urlencoded({ extended: true }));
    exp.use(express.json());

    exp.get('/', (request, response) => {
      this.onRequest(request, response);
    });

    exp.post('/', (request, response) => {
      this.onRequest(request, response);
    });

    if (this.config.disableSSL !== true) {

      try {

        let credentials: ServerOptions | undefined;
        if (this.config.pfx !== undefined) {
          credentials = { pfx: readFileSync(this.config.pfx), passphrase: this.config.passphrase };
        } else if (this.config.key !== undefined && this.config.cert !== undefined) {
          credentials = { key: readFileSync(this.config.key), cert: readFileSync(this.config.cert) };
        }

        if (credentials !== undefined) {

          this.server = createServer(credentials, exp).listen(this.config.port, () => {
            this.log.always(`${strings.webhook.started} (https)`, this.config.port);
          });

          return;
        }

      } catch (err) {
        this.log.error(strings.webhook.badSSL);
      }

    }

    this.server = exp.listen(this.config.port, () => {
      this.log.always(`${strings.webhook.started} (http)`, this.config.port);
    });
  }

  public teardown() {

    if (this.server === undefined) {
      return;
    }

    this.log.ifVerbose(strings.webhook.stopping);

    this.server.close(() => {
      this.log.ifVerbose(strings.webhook.stopped);
    });
  };

  private onRequest(request: Request, response: Response) {

    const data = { ...request.query, ...request.body };

    if (Object.keys(data).length === 0) {
      this.onList(response);
      return;
    }

    this.log.ifVerbose(`${strings.webhook.received}\n${JSON.stringify(data)}`);

    if (!assert(this.log, 'Webhook', data, 'id')) {
      this.onBadRequest(response, strings.webhook.missingId, false);
      return;
    }

    const id: string = data.id;

    if (data.get !== undefined) {
      this.getValue(response, id, data.get);
      return;
    }

    const characteristic: HKCharacteristicKey = data.set ?? data.sync ?? data.command;
    if (characteristic === undefined) {
      this.onBadRequest(response, strings.webhook.missingCharacteristic);
      return;
    }

    if (!assert(this.log, 'Webhook', data, 'value')) {
      this.onBadRequest(response, strings.webhook.missingValue, false);
      return;
    }

    const value: CharacteristicValue = toPrimitive(data.value);
    this.setValue(response, id, characteristic, value, characteristic === data.sync);
  }

  private getValue(response: Response, id: string, characteristic: HKCharacteristicKey) {

    const webhook = this.getWebhook(response, id, characteristic);
    if (webhook === undefined) {
      return;
    }

    const value = webhook.getter();
    response.status(200).json({ value: value });
  }

  private onList(response: Response) {
    const html = this.generateTableHTML();
    response.status(200).contentType('html').send(html);
  }

  private setValue(
    response: Response, id: string, characteristic: HKCharacteristicKey, value: CharacteristicValue, syncOnly: boolean) {

    const webhook = this.getWebhook(response, id, characteristic);
    if (webhook === undefined) {
      return;
    }

    if (webhook.validValues instanceof Range) {

      const min = webhook.validValues.min;
      const max = webhook.validValues.max;
      if (typeof value !== 'number' || value < min || value > max) {
        const message = strings.webhook.validRange.replace('%s', characteristic).replace('%s', `${min}`).replace('%s', `${max}`);
        this.onBadRequest(response, message);
        return;
      }

    } else if ( (typeof value !== 'boolean' && typeof value !== 'number') || !webhook.validValues.values.includes(value)) {
      const message = `${strings.webhook.validValues.replace('%s', characteristic)} ${webhook.validValues.asString}`;
      this.onBadRequest(response, message);
      return;
    }

    const message = webhook.setter(value, syncOnly);
    response.status(200).json({ success: message });
  }

  private getWebhook(response: Response, id: string, characteristic: HKCharacteristicKey): Webhook | undefined {

    const byId = this.webhooks.filter( (webhook) => webhook.accessory.identifier === id);
    if (byId.length === 0) {
      this.onBadRequest(response, strings.webhook.unregisteredId.replace('%s', `\`${id}\``));
      return;
    }

    const byCharacteristic = byId.filter( (webhook) => webhook.characteristic === characteristic);
    if (byCharacteristic.length === 0) {
      this.onBadRequest(response, strings.webhook.unregisteredCharacteristic.replace('%s', characteristic));
      return;
    }

    if (byCharacteristic.length > 1) {
      throw new Error(`Expected only one webhook for charactersitic/id but got ${byCharacteristic.length}`);
    }

    return byCharacteristic[0];
  }

  private onBadRequest(response: Response, errorMessage: string, alsoLog: boolean = true) {

    response.status(400).json({ error: errorMessage });

    if(alsoLog) {
      this.log.error(errorMessage);
    }
  }

  private generateTableHTML(): string {

    return  `
<!DOCTYPE html>

<html>

<head>

<title>${strings.webhook.title}</title>

<style>
table {
  font-family: arial, sans-serif;
  border-collapse: collapse;
}

td, th {
  border: 1px solid #bbbbbb;
  text-align: left;
  padding: 8px 32px 8px 16px;
}

tr:nth-child(even) {
  background-color: #dddddd;
}
</style>

</head>
<body>

<h2>${strings.webhook.title}</h2>
<table>
  <tr>
    <th>${strings.config.title.name}</th>
    <th>${strings.accessory.identifier}</th>
    <th>${strings.webhook.command}</th>
    <th>${strings.webhook.values}</th>
    <th>${strings.webhook.example}</th>
  </tr>
  ${this.webhooks.map(webhook => {
    const exampleValue = webhook.validValues instanceof Range ? webhook.validValues.min : webhook.validValues.values[0];
    return `
  <tr>
    <td>${webhook.accessory.name}</td>
    <td>${webhook.accessory.identifier}</td>
    <td>${webhook.characteristic}</td>
    <td>${webhook.validValues instanceof Range ? `${webhook.validValues.min} - ${webhook.validValues.max}` : webhook.validValues.asString}</td>
    <td><a target="_blank" href=?id=${webhook.accessory.identifier}&command=${webhook.characteristic}&value=${exampleValue}>${strings.webhook.link}</td>
  </tr>
  `;
  }).join('')}
</table>

</body>
</html>
`;
  }
}