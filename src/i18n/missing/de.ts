const de = {

  accessory: {
    identifier: 'ID',
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
    longPress: '%s was long pressed', // accessory name
    singlePress: '%s was single pressed', // accessory name
  },

  command: {
    badSyncCommand: '%s sync command must produce valid JSON`', // accessory name
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

    continue: 'Continue %s', // arrow symbol

    description: {
      autoReset: 'Returns the accessory to its default value',
      conditions: 'Set the accessory to its opposite (non-default) value when the specified conditions are met',
      fadeOut: 'Reduce brightness over a fixed duration, or decrease by 1% incrementally per each time duration',
      notification: 'Receive a notification when accessory is set to its opposite (non-default) value. See wiki for help.',
    },

    enumNames: {
      accessory: 'Accessory',
      available: 'Available',
      button: 'Stateless Switch',
      dawn: 'Dawn',
      dehumidifier: 'Dehumidifier',
      dusk: 'Dusk',
      faucet: 'Faucet',
      fixed: 'Fixed',
      garageDoorOpener: 'Garage Door',
      generic: 'Generic',
      goldenHour: 'Golden Hour',
      humidifier: 'Humidifier',
      humidifierDehumidifier: 'Humidifier/Dehumidifier',
      humiditySensor: 'Humidity Sensor',
      incremental: 'Incremental',
      irrigation: 'Irrigation',
      log: 'Log Watcher',
      none: 'None',
      operatorAnd: 'ALL conditions are met', // proceeded by "Trigger when…"
      operatorOr: 'ANY conditions are met', // proceeded by "Trigger when…"
      ping: 'Reachability',
      pingieNotify: 'Notify! (notify.pingie.com)',
      night: 'Night',
      notAvailable: 'Not Available',
      sensorMirror: 'Mirror Accessory',
      sensorTimer: 'Timer Controlled',
      shower: 'Shower',
      sunrise: 'Sunrise',
      sunset: 'Sunset',
      temperatureSensor: 'Temperature Sensor',
      timeout: 'After Delay',
      valve: 'Valve',
    },

    migrating: 'Are you upgrading from v0.9.2 or earlier?',
    migrationAlert: 'STOP',
    migrationReadme: 'READ THIS FIRST',
    migrationAcknowledge: 'By continuing, you understand that you must install %s to keep your existing accessories.', // plugin name
    migrationReconfigure: 'Otherwise, you will need to reconfigure all HomeKit scenes and automations associated with %s.', // plugin name

    title: {
      accessoryState: 'State',
      api: 'API',
      autoReset: 'Auto-Reset',
      commandHumidity: 'Humidity Changed Command',
      commandSync: 'Sync Command',
      condition: 'Condition',
      conditions: 'Trigger Conditions',
      enableHistory: 'Enable History',
      fadeOut: 'Fade Out',
      humidifierType: 'Type',
      isDimmer: 'Enable Brightness',
      latitude: 'Latitude',
      longitude: 'Longitude',
      maximumTemperature: 'Max Temperature',
      minimumTemperature: 'Min Temperature',
      notification: 'Notification',
      offset: 'Offset',
      operator: 'Trigger when…',
      pattern: 'Search String or RegEx',
      pingAvailability: 'State',
      pingHost: 'Host',
      pingInterval: 'Interval',
      pushId: 'Device or Group ID',
      pushText: 'Text',
      pushTitle: 'Title (Optional)',
      pushToken: 'Token',
      sensorBehavior: 'Sensor Behavior',
      simulateOpenClose: 'Simulate Open/Close',
      syncSchedule: 'Sync Schedule',
      temperatureUnits: 'Temperature Units',
      time: 'Time',
      valveType: 'Valve Type',
    },

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
    fadeHours: '%s fading out over %s hours', // accessory name, number
    fadeMilliseconds: '%s fading out over %s milliseconds', // accessory name, number
    fadeMinutes: '%s fading out over %s minutes', // accessory name, number
    fadeSeconds: '%s fading out over %s seconds', // accessory name, number
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
  },

  reachability: {
    error: 'An error occurred when checking if %s is reachable', // host
    reachable: '%s is responsive', // host
    unreachable: '%s is unresponsive', // host
  },

  schedule: {
    cancel: 'Cancelled schedule timer for %s', // accessory name
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

    humidity: '%s humidity is %d%', // accessory name, number

    temperatureC: '%s is %d°C', // accessory name, number
    temperatureF: '%s is %d°F', // accessory name, number
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
    badValidStates: '%s has invalid value in %s. Must be one of: %s', // accessory name, variable name, list of state names
    badValidStatesType: '%s expects an array for %s', // accessory name, variable name
    coolFuture: 'Settings %s to Cool…',
    heatFuture: 'Settings %s to Heat…',
    offFuture: 'Settings %s to Off…',
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
    command: 'Command',
    example: 'Example',
    link: 'Link',
    missingCharacteristic: 'Request is missing a get or set command, e.g. `set=Brightness`',
    missingId: 'Request is missing id',
    missingValue: '`set` requests require a `value`',
    register: '%s adding webhook with id %s and command %s', // accessory name, id, command
    title: 'Available Webhooks',
    validRange: 'The %s characteristic expects a number value between %s and %s', // command name, number, number
    validValues: 'Valid values for the %s characteristic command are:', // command name
    values: 'Values',
  },
};

export default de;