const en = {

  accessory: {
    badValueType: '%s expected type %s but was %s', // accessory name, variable type, variable type
    identifier: 'ID',
    missingRequired: '%s is missing required field %s', // accessory name, variable name
    timesOpenedReset: '%s open count has been reset', // accessory name
  },

  autoReset: {
    badType: '%s has invalid auto-reset type %s. Must be one of: %s', // accessory name, input, list of type names
    badUnits: '%s auto-reset has invalid time units %s. Must be one of: %s', // accessory name, input, list of unit names
    cancel: 'Cancelled auto-reset timer for %s', // accessory name
    cron: '%s starting auto-reset cronjob', // accessory name
    expired: '%s auto-reset timer expired while restarting. Returning to default state…', // accessory name
    invalidCron: '%s auto-reset has an invalid cron expression %s', // accessory name, cron string
    resume: '%s resuming auto-reset timer', // accessory name
    sunTime: '%s will reset at %s', // accessory name, time
    timeHours: '%s will reset in %s hours', // accessory name, number
    timeMilliseconds: '%s will reset in %s milliseconds', // accessory name, number
    timeMinutes: '%s will reset in %s minutes', // accessory name, number
    timeSeconds: '%s will reset in %s seconds', // accessory name, number
  },

  button: {
    doublePress: '%s was double pressed', // accessory name
    doublePressTitle: 'Double Press',
    longPress: '%s was long pressed', // accessory name
    longPressTitle: 'Long Press',
    singlePress: '%s was single pressed', // accessory name
    singlePressTitle: 'Single Press',
  },

  command: {
    badSyncCommand: '%s sync command must produce valid JSON`', // accessory name
    error: '%s failed to execute command', // accessory name
    executed: '%s executed command', // accessory name
    unsupportedCharacteristic: '%s trying to sync unsupported characteristic %s', // accessory name, variable name
  },

  conditions: {
    andMultipleLogs: '%s cannot have mutiple log triggers using the "ALL" operator', // accessory name
    currentResult: 'Current result is %s', // boolean
    evaluatingConditions: 'Evaluating conditions for %s', // accessory name
    notSatisfied: '%s conditions not satisfied', // accessory name
    patternAndConditions: '%s log condition found a pattern match. Checking other conditions…', // accessory name
    patternMatch: '%s log condition found a pattern match. Triggering…', // accessory name
    reachabilityUnknown: 'Cannot yet evalutate conditions because reachability for %s is unknown', // host
    satisfied: '%s conditions have been satisfied. Triggering…', // accessory name
    selfReference: '%s is not allowed to reference itself as a triggering condition', // accessory name
    statesEqual: 'Current and desired states are both %s', // state name
    statesNotEqual: 'Current state %s is not equivalent to desired state %s', // state name, state name
    statesUnrelated: 'Desired condition state %s is being compared to current state %s. Was this a typo?', // state name, state name
    stateUnknown: 'Cannot yet evalutate conditions because state for %s is unknown', // accessory id
  },

  config: {

    accessory: 'Accessory',
    continue: 'Continue %s', // arrow symbol

    description: {
      autoReset: 'Returns the accessory to its default value',
      commands: 'Execute arbitrary commands (e.g. curl) when the accessory changes state',
      conditions: 'Set the accessory to its opposite (non-default) value when the specified conditions are met',
      cron: 'Visit crontab.guru for help',
      fadeOut: 'Reduce brightness over a fixed duration, or decrease by 1% incrementally per each time duration',
      limiter: 'Restrict the total time this accessory can be set to its non-default value, for each specified period',
      notification: 'Receive a notification when accessory is set to its opposite (non-default) value. See wiki for help.',
      random: 'Time will be randomized with the above value as a maximum',
      schedule: 'Sets the accessory to its opposite (non-default) value',
    },

    enumNames: {
      accessory: 'Accessory',
      auto: 'Auto',
      available: 'Available',
      button: 'Stateless Switch',
      carbonDioxideSensor:'Carbon Dioxide',
      carbonMonoxideSensor: 'Carbon Monoxide',
      celsius: '°C',
      closed: 'Closed',
      contactSensor: 'Contact',
      cool: 'Cool',
      cron: 'Cron',
      custom: 'Custom',
      daily: 'Daily',
      dawn: 'Dawn',
      day: 'Day',
      dehumidifier: 'Dehumidifier',
      door: 'Door',
      dusk: 'Dusk',
      fahrenheit: '°F',
      faucet: 'Faucet',
      fixed: 'Fixed',
      garageDoorOpener: 'Garage Door',
      generic: 'Generic',
      goldenHour: 'Golden Hour',
      heat: 'Heat',
      homekit: 'HomeKit (Default)',
      hour: 'Hour',
      hourly: 'Hourly',
      hours: 'Hours',
      humidifier: 'Humidifier',
      humidifierDehumidifier: 'Humidifier/Dehumidifier',
      humiditySensor: 'Humidity Sensor',
      incremental: 'Incremental',
      interval: 'Repeating Interval',
      irrigation: 'Irrigation',
      leakSensor: 'Leak',
      lightbulb: 'Lightbulb',
      lockMechanism: 'Lock',
      log: 'Log Watcher',
      matter: 'Matter (Beta)',
      milliseconds: 'Milliseconds',
      minutely: 'Every Minute',
      minutes: 'Minutes',
      month: 'Month',
      monthly: 'Monthly',
      motionSensor: 'Motion',
      night: 'Night',
      none: 'None',
      notAvailable: 'Not Available',
      occupancySensor: 'Occupancy',
      off: 'Off',
      on: 'On',
      open: 'Open',
      operatorAnd: 'ALL conditions are met', // proceeded by "Trigger when…"
      operatorOr: 'ANY conditions are met', // proceeded by "Trigger when…"
      outlet: 'Outlet',
      ping: 'Reachability',
      pingieNotify: 'Notify! (notify.pingie.com)',
      secondly: 'Every Second',
      seconds: 'Seconds',
      secured: 'Locked',
      sensorMirror: 'Mirror Accessory',
      sensorTimer: 'Timer Controlled',
      shower: 'Shower',
      smokeSensor: 'Smoke',
      sunrise: 'Sunrise',
      sunset: 'Sunset',
      switch: 'Switch',
      temperatureSensor: 'Temperature Sensor',
      thermostat: 'Thermostat',
      timeout: 'After Delay',
      unsecured: 'Unlocked',
      valve: 'Valve',
      week: 'Week',
      weekdays: 'Weekdays',
      weekends: 'Weekends',
      weekly: 'Weekly',
      window: 'Window',
      windowCovering: 'Window Covering (Blinds)',
      yearly: 'Annually',
    },

    migrating: 'Are you upgrading from v0.9.2 or earlier?',
    migrationAlert: 'STOP',
    migrationReadme: 'READ THIS FIRST',
    migrationAcknowledge: 'By continuing, you understand that you must install %s to keep your existing accessories.', // plugin name
    migrationReconfigure: 'Otherwise, you will need to reconfigure all HomeKit scenes and automations associated with %s.', // plugin name
    no: 'No',
    support: 'For documentation and support please visit %s', // url
    thankYou: 'Thank you for installing %s', // plugin name

    title: {
      accessory: 'Accessory',
      accessoryState: 'State',
      api: 'API',
      autoReset: 'Auto-Reset',
      commandClose: 'Close Command',
      commandHumidity: 'Humidity Changed Command',
      commandOff: 'Off Command',
      commandOn: 'On Command',
      commandOpen: 'Open Command',
      commandLock: 'Lock Command',
      commands: 'Commands',
      commandSync: 'Sync Command',
      commandTemperature: 'Temperature Changed Command',
      commandUnlock: 'Unlock Command',
      condition: 'Condition',
      conditions: 'Trigger Conditions',
      cron: 'Cron',
      cronCustom: 'Custom Cron',
      defaultPosition: 'Default Position',
      defaultState: 'Default State',
      defaultTemperature: 'Default Temperature',
      disableLogging: 'Disable Logging',
      enableHistory: 'Enable History',
      enableWebhook: 'Enable Webhook',
      fadeOut: 'Fade Out',
      groupName: 'Group Name',
      humidifierType: 'Type',
      interval: 'Interval',
      isDimmer: 'Enable Brightness',
      latitude: 'Latitude',
      limit: 'Limit',
      limiter: 'Time Limit',
      longitude: 'Longitude',
      maximumTemperature: 'Max Temperature',
      minimumTemperature: 'Min Temperature',
      name: 'Name',
      notification: 'Notification',
      offset: 'Offset',
      operator: 'Trigger when…',
      pattern: 'Search String or RegEx',
      period: 'Per',
      pingAvailability: 'State',
      pingHost: 'Host',
      pingInterval: 'Interval',
      platform: 'Platform',
      pushId: 'Device or Group ID',
      pushText: 'Text',
      pushTitle: 'Title (Optional)',
      pushToken: 'Token',
      preset: 'Preset',
      random: 'Randomize',
      resetOnRestart: 'Reset on Restart',
      schedule: 'Schedule',
      sensor: 'Attach Sensor',
      sensorBehavior: 'Sensor Behavior',
      simulateOpenClose: 'Simulate Open/Close',
      syncSchedule: 'Sync Schedule',
      temperatureUnits: 'Temperature Units',
      time: 'Time',
      type: 'Type',
      units: 'Units',
      valveType: 'Valve Type',
    },

    yes: 'Yes',
  },

  history: {
    cleanup: 'Removing history for %s', // accessory name
    cleanupFailed: 'Unable to remove history for %s. Try manually removing the file %s from your Homebridge \'persist\' directory.', // accessory name, filename
  },

  humidifier: {
    badType: '%s has invalid humidifier type %s. Must be one of: %s', // accessory name, input, list of type names
    targetHumidity: '%s humidity set to %d%', // accessory name, number
  },

  lightbulb: {
    brightness: '%s brightness is %d%', // accessory name, number
    fadeHours: '%s fading out over %s hours', // accessory name, number
    fadeMilliseconds: '%s fading out over %s milliseconds', // accessory name, number
    fadeMinutes: '%s fading out over %s minutes', // accessory name, number
    fadeSeconds: '%s fading out over %s seconds', // accessory name, number
    stateOn: '%s is on, brightness is %d%', // accessory name, number
  },

  limiter: {
    badPeriod: 'The time limit for %s has invalid period %s. Must be one of: %s', // accessory name, input, list of unit names
    badUnits: 'The time limit for %s has invalid units %s. Must be one of: %s', // accessory name, input, list of unit names
    expired: 'The time limit for %s has expired', // accessory name
    limitExceedsPeriod: 'The time limit for %s exceeds period. Please reduce the limit or increase the period.', // accessory name
    remainingDayPlus: 'The time limit for %s has more than a day remaining', // accessory name
    remainingHours: 'The time limit for %s has %s hours remaining', // accessory name, number
    remainingMinutes: 'The time limit for %s has %s minutes remaining', // accessory name, number
    remainingSeconds: 'The time limit for %s has %s seconds remaining', // accessory name, number
  },

  lock: {
    badDefault: '%s has invalid default lock state %s. Must be one of: %s', // accessory name, input, list of state names
    secured: '%s is locked', // accessory name
    unsecured: '%s is unlocked', // accessory name
  },

  logWatcher: {
    error: 'Log watcher encountered an error: %s', // error
    missingFile: 'Unable to find log file at path %s', // file path
  },

  notification: {
    badAPI: '%s has invalid api %s. Must be one of: %s', // accessory name, input, list of APIs
    pushError: '%s was unable to send push notification', // accessory name
    pushSuccess: '%s sent a push notification', // accessory name
  },

  onOff: {
    badDefault: '%s has invalid default on state %s. Must be one of: %s', // accessory name, input, list of state names
    stateOff: '%s is off', // accessory name
    stateOn: '%s is on', // accessory name
  },

  position: {
    badDefault: '%s has invalid default position %s. Must be one of: %s', // accessory name, input, list of position names
    closed: '%s is closed', // accessory name
    open: '%s is open', // accessory name
  },

  reachability: {
    error: 'An error occurred when checking if %s is reachable', // host
    reachable: '%s is responsive', // host
    unreachable: '%s is unresponsive', // host
  },

  schedule: {
    badType: '%s has invalid schedule type %s. Must be one of: %s', // accessory name, input, list of type names
    badUnits: '%s schedule has invalid time units %s. Must be one of: %s', // accessory name, input, list of unit names
    cancel: 'Cancelled schedule timer for %s', // accessory name
    cron: '%s starting schedule cronjob', // accessory name
    expired: '%s schedule timer expired while restarting. Setting to non-default state…', // accessory name
    invalidCron: '%s schedule has an invalid cron expression %s', // accessory name, cron string
    resume: '%s resuming schedule timer', // accessory name
    sunTime: '%s will trigger at %s', // accessory name, time
    timeHours: '% will trigger in %s hours', // accessory name, number
    timeMilliseconds: '%s will trigger in %s milliseconds', // accessory name, number
    timeMinutes: '%s will trigger in %s minutes', // accessory name, number
    timeSeconds: '%s will trigger in %s seconds', // accessory name, number
  },

  sensor: {

    badBehavior: '%s has invalid sensor behavior %s. Must be one of: %s', // accessory name, input, list of type names
    badTemperatureUnits: '%s has invalid temperature units %s. Must be one of: %s', // accessory name, input, list of unit names
    badType: '%s has invalid sensor type %s. Must be one of: %s', // accessory name, input, list of type names

    carbonDioxide: {
      active: '%s detected carbon dioxide', // accessory name
      inactive: '%s stopped detecting carbon dioxide', // accessory name
    },

    carbonMonoxide: {
      active: '%s detected carbon monoxide', // accessory name
      inactive: '%s stopped detecting carbon monoxide', // accessory name
    },

    contact: {
      active: '%s stopped detecting contact', // accessory name
      inactive: '%s detected contact', // accessory name
    },

    humidity: '%s humidity is %d%', // accessory name, number

    leak: {
      active: '%s detected a leak', // accessory name
      inactive: '%s stopped detecting the leak', // accessory name
    },

    motion: {
      active: '%s detected motion', // accessory name
      inactive: '%s stopped detecting motion', // accessory name
    },

    occupancy: {
      active: '%s detected occupancy', // accessory name
      inactive: '%s stopped detecting occupancy', // accessory name
    },

    smoke: {
      active: '%s detected smoke', // accessory name
      inactive: '%s stopped detecting smoke', // accessory name
    },

    temperatureC: '%s is %d°C', // accessory name, number
    temperatureF: '%s is %d°F', // accessory name, number
  },

  startup: {
    matterDisabled: 'Matter is currently disabled. Please enable Matter in the %s parent bridge.', // plugin name
    matterGroups: 'Groups are not yet supported for Matter accessories',
    matterUnavailable: 'Matter is not available with this version of Homebridge. Please update to Homebridge v2.0+ to use Matter with %s.', // plugin name
    newHomeKitAccessory: 'Adding new HomeKit accessory:',
    newMatterAccessory: 'Adding new Matter accessory:',
    removeHomeKitAccessory: 'Removing HomeKit accessory:',
    removeMatterAccessory: 'Removing Matter accessory:',
    restoringHomeKitAccessory: 'Restoring HomeKit accessory:',
    restoringMatterAccessory: 'Restoring Matter accessory:',
    setupComplete: '✓ Setup complete',
    unsupportedPlatform: 'Unsupported platform %s. Must be one of: %s', // platform, list of platforms
    unsupportedType: 'Unsupported accessory type %s', // accessory type
  },

  syncSchedule: {
    badType: '%s has invalid sync schedule type %s. Must be one of: %s', // accessory name, input, list of type names
    badUnits: '%s sync schedule has invalid time units %s. Must be one of: %s', // accessory name, input, list of unit names
    cancel: 'Cancelled sync schedule timer for %s', // accessory name
    cron: '%s starting sync schedule cronjob', // accessory name
    expired: '%s sync schedule timer expired while restarting. Synchronizing now…', // accessory name
    invalidCron: '%s sync schedule has an invalid cron expression %s', // accessory name, cron string
    resume: '%s resuming sync schedule timer', // accessory name
    sunTime: '%s will synchronize at %s', // accessory name, time
    timeHours: '% will synchronize in %s hours', // accessory name, number
    timeMilliseconds: '%s will synchronize in %s milliseconds', // accessory name, number
    timeMinutes: '%s will synchronize in %s minutes', // accessory name, number
    timeSeconds: '%s will synchronize in %s seconds', // accessory name, number
  },

  thermostat: {
    auto: '%s set to Auto', // accessory name
    autoFuture: 'Setting %s to Auto…', // accessory name
    badDefault: '%s has invalid default state %s. Must be one of: %s', // accessory name, input, list of state names
    badValidStates: '%s has invalid value in %s. Must be one of: %s', // accessory name, variable name, list of state names
    badValidStatesType: '%s expects an array for %s', // accessory name, variable name
    cool: '%s set to Cool', // accessory name
    coolFuture: 'Setting %s to Cool…', // accessory name
    heat: '%s set to Heat', // accessory name
    heatFuture: 'Setting %s to Heat…', // accessory name
    off: '%s set to Off', // accessory name
    offFuture: 'Setting %s to Off…', // accessory name
    targetC: '%s set to %d°C', // accessory name, number
    targetF: '%s set to %d°F', // accessory name, number
  },

  valve: {
    badType: '%s has invalid valve type %s. Must be one of: %s', // accessory name, input, list of type names
    maxDuration: '%s auto-reset delay cannot be more than 1 hour', // accessory name
    minDuration: '%s auto-reset delay cannot be less than 1 second', // accessory name
  },

  webhook: {
    badPort: 'Port for the webhook server must be a number. Falling back to default %d', // number
    badSSL: 'Failed to load SSL credentials. Falling back to http…',
    badSSLParameter: 'SSL parameter %s should be %s, but was %s', // parameter name, type, type
    badUnits: 'The %s webhook command has invalid temperature units %s. Must be one of:', // accessory name, input, list of unit names
    command: 'Command',
    example: 'Example',
    link: 'Link',
    missingCharacteristic: 'Request is missing a get or set command, e.g. `set=Brightness`',
    missingId: 'Request is missing id',
    missingValue: '`set` requests require a `value`',
    received: 'Webhook command received',
    register: '%s adding webhook with id %s and command %s', // accessory name, id, command
    started: 'Webhook server listening on port %s', // port number
    stopped: 'Webhook server stopped',
    stopping: 'Shutting down webhook server…',
    title: 'Available Webhooks',
    validRange: 'The %s characteristic expects a number value between %s and %s', // command name, number, number
    validValues: 'Valid values for the %s characteristic command are:', // command name
    values: 'Values',
    unregisteredCharacteristic: 'There are no accessories registered for %s. Did you `Enable Webhook` for this accessory?', // command name
    unregisteredId: 'There is no accessory registered for webhooks with the id %s. You can find the correct id in the JSON config.', // id
    unsupportedCharacteristic: 'The webhook command %s is not supported', // value
  },
};

export default en;