const de = {

  accessory: {
    badValueType: '%s erwartet den Typ %s, hat aber den Typ %s erhalten',
    missingRequired: 'Für %s fehlt das erforderliche Feld %s',
  },

  command: {
    error: '%s konnte den Befehl nicht ausführen',
    executed: '%s hat den Befehl ausgeführt',
  },

  config: {
    accessory: 'Gerät',

    description: {
      commands: 'Führt beliebige Befehle (z. B. curl) aus, wenn das Gerät seinen Zustand ändert',
      cron: 'Besuchen Sie crontab.guru für Hilfe',
      limiter: 'Beschränkt die Gesamtzeit, in der dieses Gerät für jede angegebene Periode auf seinen Nicht-Standardwert eingestellt werden kann',
      random: 'Die Zeit wird zufällig mit dem obigen Wert als Maximum gewählt',
      schedule: 'Setzt das Gerät in bestimmten Intervallen oder zu bestimmten Zeiten auf seinen entgegengesetzten (Nicht-Standard-) Wert',
    },

    enumNames: {
      auto: 'Auto',
      carbonDioxideSensor: 'Kohlenstoffdioxid',
      carbonMonoxideSensor: 'Kohlenstoffmonoxid',
      celsius: '°C',
      closed: 'Geschlossen',
      contactSensor: 'Kontakt',
      cool: 'Kühlen',
      cron: 'Cron',
      custom: 'Benutzerdefiniert',
      daily: 'Täglich',
      day: 'Tag',
      door: 'Tür',
      fahrenheit: '°F',
      heat: 'Heizen',
      hour: 'Stunde',
      hourly: 'Stündlich',
      hours: 'Stunden',
      interval: 'Intervall',
      leakSensor: 'Leck',
      lightbulb: 'Glühbirne',
      lockMechanism: 'Schloss',
      milliseconds: 'Millisekunden',
      minutely: 'Jede Minute',
      minutes: 'Minuten',
      month: 'Monat',
      monthly: 'Monatlich',
      motionSensor: 'Bewegung',
      occupancySensor: 'Anwesenheit',
      off: 'Aus',
      on: 'An',
      open: 'Geöffnet',
      outlet: 'Steckdose',
      secondly: 'Jede Sekunde',
      seconds: 'Sekunden',
      secured: 'Verriegelt',
      smokeSensor: 'Rauch',
      switch: 'Schalter',
      thermostat: 'Thermostat',
      unsecured: 'Entriegelt',
      week: 'Woche',
      weekdays: 'Wochentage',
      weekends: 'Wochenenden',
      weekly: 'Wöchentlich',
      window: 'Fenster',
      windowCovering: 'Fensterabdeckung (Jalousien)',
      yearly: 'Jährlich',
    },
    no: 'Nein',
    support: 'Für Dokumentation und Support besuchen Sie bitte %s',
    thankYou: 'Vielen Dank für die Installation von %s',

    title: {
      accessory: 'Gerät',
      commandClose: 'Befehl zum Schließen',
      commandLock: 'Befehl zum Verriegeln',
      commandOff: 'Befehl \'Aus\'',
      commandOn: 'Befehl \'An\'',
      commandOpen: 'Befehl zum Öffnen',
      commandTemperature: 'Befehl bei Temperaturänderung',
      commandUnlock: 'Befehl zum Entriegeln',
      commands: 'Befehle',
      cron: 'Cron',
      cronCustom: 'Benutzerdefinierter Cron',
      defaultPosition: 'Standardposition',
      defaultState: 'Standardzustand',
      defaultTemperature: 'Standardtemperatur',
      disableLogging: 'Protokollierung deaktivieren',
      enableWebhook: 'Webhook aktivieren',
      groupName: 'Gruppenname',
      interval: 'Intervall',
      limit: 'Limit',
      limiter: 'Zeitlimit',
      name: 'Name',
      period: 'Periode',
      preset: 'Voreinstellung',
      random: 'Zufällig',
      resetOnRestart: 'Bei Neustart zurücksetzen',
      schedule: 'Zeitplan',
      sensor: 'Sensor hinzufügen',
      type: 'Typ',
      units: 'Einheiten',
    },
    yes: 'Ja',
  },

  lightbulb: {
    brightness: 'Helligkeit von %s ist %d%',
    stateOn: '%s ist an, Helligkeit ist %d%',
  },

  limiter: {
    badPeriod: 'Das Zeitlimit für %s ist ungültig: %s. Muss eine der folgenden sein: %s',
    badUnits: 'Das Zeitlimit für %s hat eine ungültige Einheit %s. Muss eine der folgenden sein: %s',
    expired: 'Das Zeitlimit für %s ist abgelaufen',
    limitExceedsPeriod: 'Das Zeitlimit für %s überschreitet die Periode. Bitte reduzieren Sie das Limit oder erhöhen Sie die Periode.',
    remainingDayPlus: 'Das Zeitlimit für %s hat mehr als einen Tag Restzeit',
    remainingHours: 'Das Zeitlimit für %s hat %s Stunden Restzeit',
    remainingMinutes: 'Das Zeitlimit für %s hat %s Minuten Restzeit',
    remainingSeconds: 'Das Zeitlimit für %s hat %s Sekunden Restzeit',
  },

  lock: {
    badDefault: '%s hat einen ungültigen Standard-Sperrzustand %s. Muss einer der folgenden sein: %s',
    secured: '%s ist verriegelt',
    unsecured: '%s ist entriegelt',
  },

  onOff: {
    stateOff: '%s ist aus',
    stateOn: '%s ist an',
  },

  position: {
    badDefault: '%s hat eine ungültige Standardposition %s. Muss eine der folgenden sein: %s',
    closed: '%s ist geschlossen',
    open: '%s ist geöffnet',
  },

  schedule: {
    badType: '%s weist einen ungültigen Typen für den Zeitplan %s auf. Muss einer der folgenden sein: %s',
    badUnits: 'Zeitplan für %s hat ungültige Zeiteinheiten %s. Muss eine der folgenden sein: %s',
    cron: '%s startet Zeitplan-Cronjob',
  },

  sensor: {
    badType: '%s weist einen ungültigen Sensortyp %s auf. Muss einer der folgenden sein: %s',

    carbonDioxide: {
      active: '%s hat Kohlenstoffdioxid erkannt',
      inactive: '%s hat die Erkennung von Kohlenstoffdioxid beendet',
    },

    carbonMonoxide: {
      active: '%s hat Kohlenstoffmonoxid erkannt',
      inactive: '%s hat die Erkennung von Kohlenstoffmonoxid beendet',
    },

    contact: {
      active: '%s hat Kontakt erkannt',
      inactive: '%s hat die Kontakterkennung beendet',
    },

    leak: {
      active: '%s hat ein Leck erkannt',
      inactive: '%s hat die Leckerkennung beendet',
    },

    motion: {
      active: '%s hat Bewegung erkannt',
      inactive: '%s hat die Bewegungserkennung beendet',
    },

    occupancy: {
      active: '%s hat Anwesenheit erkannt',
      inactive: '%s hat die Anwesenheitserkennung beendet',
    },

    smoke: {
      active: '%s hat Rauch erkannt',
      inactive: '%s hat die Raucherkennung beendet',
    },
  },

  startup: {
    newAccessory: 'Neues Gerät wird hinzugefügt:',
    removeAccessory: 'Gerät wird entfernt:',
    restoringAccessory: 'Gerät wird wiederhergestellt:',
    setupComplete: '✓ Einrichtung abgeschlossen',
    unsupportedType: 'Nicht unterstützter Gerätetyp %s',
    welcome: [
      'Bitte geben Sie diesem Plugin einen ★ auf GitHub, wenn Sie es nützlich finden! https://github.com/mpatfield/homebridge-dummy',
      'Möchten Sie dieses Plugin sponsern? https://github.com/sponsors/mpatfield',
    ],
  },

  thermostat: {
    auto: '%s auf \'Auto\' gestellt',
    badDefault: '%s weist einen ungültigen Standardzustand %s auf. Muss einer der folgenden sein: %s',
    cool: '%s auf Kühlen gestellt',
    heat: '%s auf Heizen gestellt',
    off: '%s auf Aus gestellt',
  },

  webhook: {
    badUnits: 'Dieser %s Webhook-Befehl weist ungültige Temperatureinheiten %s auf. Muss eine der folgenden sein:',
    received: 'Webhook-Befehl empfangen',
    started: 'Webhook-Server läuft und lauscht auf Port %s',
    stopped: 'Webhook-Server gestoppt',
    stopping: 'Fahre Webhook-Server herunter...',
    unregisteredCharacteristic: 'Es sind keine Geräte für den Webhook-Befehl %s registriert. Haben Sie \'Webhook aktivieren\' für dieses Gerät eingeschaltet?',
    unregisteredId: 'Es ist kein Gerät für Webhooks mit der ID %s registriert. Die korrekte ID finden Sie in der JSON-Konfiguration.',
    unsupportedCharacteristic: 'Der Webhook-Befehl %s wird nicht unterstützt',
  },
};

export default de;