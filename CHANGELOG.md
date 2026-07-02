# Change Log

All notable changes to homebridge-dummy will be documented in this file.

## 2.0.1-beta. ()

### Changed
- Обновлены русские переводы. Спасибо, [@Silverdragon122](https://github.com/sponsors/Silverdragon122)!
- Bản dịch tiếng Việt được cập nhật. Cảm ơn [@khanhnd88](https://github.com/sponsors/khanhnd88)!

## 2.0.0 (2026-06-30)

### Added
- [Matter Support](https://github.com/mpatfield/homebridge-dummy/wiki/Matter-Support) (Beta) for `Switch`, `Outlet`, and `Lightbulb`
    - ⚠️ Enabling Matter on an existing Homebridge Dummy accessory will require you to reconfigure any scenes or automations for that accessory
- [Pushover](https://pushover.net/) option for [Push Notifications](https://github.com/mpatfield/homebridge-dummy/wiki/Push-Notification#pushover)
    - ⚠️ Monthly limits are shared across all Dummy unless you provide your own `App Token` — please be considerate!
- Send a [Push Notification](https://github.com/mpatfield/homebridge-dummy/wiki/Push-Notification) when an accessory resets - thank you, [@dkerr64](https://github.com/sponsors/dkerr64)!
    - You can set up push notifications for when an accessory is triggered, reset, or both

### Changed
- ⚠️ Dropped [official support](https://github.com/homebridge/homebridge/wiki/How-To-Update-Node.js) for Node.js v20 and added Node.js v26
- Updated to [suncalc v2.0.0](https://github.com/mourner/suncalc/releases/tag/v2.0.0)
    - Please [open a ticket](https://github.com/mpatfield/homebridge-dummy/issues/new/choose) if you have any issues related to scheduling for sunrise, sunset, etc.

### Notes
- ‼️ If upgrading from v0.9.2 or earlier, [READ THIS FIRST](https://github.com/mpatfield/homebridge-dummy/wiki/Migration)
- The major version update from v1 to v2 reflects the significant code restructuring needed to support Matter. There should be no breaking changes for existing configurations, but please [open a ticket](https://github.com/mpatfield/homebridge-dummy/issues/new/choose) if you have any issues.
- Please consider giving this plugin a ⭐️ on [GitHub](https://github.com/mpatfield/homebridge-dummy) if you're finding it useful!

## 1.8.1 (2026-06-09)

### Added
- `CurrentHeatingCoolingState` [Webhook](https://github.com/mpatfield/homebridge-dummy/wiki/Webhooks) characteristic for `Thermostat` accessories
    - ⚠️ Please [open a ticket](https://github.com/mpatfield/homebridge-dummy/issues/new/choose) if you have any issues related to `Thermostat`

### Changed
- Updated dependencies

## 1.8.0 (2026-05-30)

### ‼️ WARNING ‼️ — If upgrading from v0.9.2 or earlier, [READ THIS FIRST](https://github.com/mpatfield/homebridge-dummy/wiki/Migration).

-----

### Added
- [Sync Command & Schedule](https://github.com/mpatfield/homebridge-dummy/wiki/Commands#sync-command-and-schedule) to keep an accessory synchronized with some external entity

### Fixed
- Crash on load for some users

### Changed
- Cleanup old deprecated code
    - ⚠️ If it has been longer than 6 months since you last updated, you may need to reconfigure Schedules or Auto-Resets
- Updated dependencies

## 1.7.4 (2026-05-12)

### Fixed
- Crash caused by a bug in the translation system ([#416](https://github.com/mpatfield/homebridge-dummy/issues/416))
- Potential race condition in persistent storage

### Changed
- Notification only fires when accessory state changes
    - ⚠️ Make sure to define an [`Auto-Reset`](https://github.com/mpatfield/homebridge-dummy/wiki/Auto%E2%80%90Reset) if you want it to fire every time
- Don't evaluate [Trigger Conditions](https://github.com/mpatfield/homebridge-dummy/wiki/Trigger-Conditions) until after initialization
- Removed `beta` tag from `homebridge` dependency
- Reduced noisy startup logging
- Updated dependencies

### Notes
Would you like to see Homebridge Dummy in your language? Please consider [getting involved](https://github.com/mpatfield/homebridge-dummy/issues/105). No coding experience required!

## 1.7.3 (2026-05-04)

### Fixed
- Crash on launch caused by [arpping](https://github.com/haf-decent/arpping) dependency used for [Reachability](https://github.com/mpatfield/homebridge-dummy/wiki/Trigger-Conditions#reachabilitypresence) ([#406](https://github.com/mpatfield/homebridge-dummy/issues/406))

### Changed
- Updated dependencies

## 1.7.2 (2026-03-30)

### Changed
- Cleanup unnecessary dependencies
- Cleanup deprecated code older than 6 months

## 1.7.1 (2026-03-18)

### Fixed
- Open/Close will now only simulate when explicitly enabled (`Door` / `GarageDoorOpener` / `Window` / `WindowCovering`)
- Potential infinite loop in config UI

### Changed
- Deprecated `sensor.timerControlled` in favor of [`sensor.behavior`](https://github.com/mpatfield/homebridge-dummy/wiki/Sensors)
- Reworked translation system for easier maintenance
- Removed auto-migration option for users [upgrading from v0.9.2](https://github.com/mpatfield/homebridge-dummy/wiki/Migration) or earlier
- Обновлены русские переводы. Спасибо, [@Silverdragon122](https://github.com/sponsors/Silverdragon122)!

### Added
- Ελληνικές μεταφράσεις. Ευχαριστώ, [@loveisfoss](https://github.com/sponsors/loveisfoss)!
- Bản dịch tiếng Việt. Cảm ơn [@khanhnd88](https://github.com/sponsors/khanhnd88)!

## 1.7.0 (2026-02-27)

### Added
- Different behavior options for `Lightbulb` [fade out](https://github.com/mpatfield/homebridge-dummy/wiki/Additional-Options#lightbulb)
    - `FIXED` — Always takes the same amount of time to fade, regardless of brightness
    - `INCREMENTAL` - Each 1% takes the amount of time defined ("egg timer")
- `StatelessProgrammableSwitch` — useful for triggering automations or push notifications on a schedule or via webhook
- View all currently available webhooks in a browser (e.g. [http://localhost:63743/](http://localhost:63743/)) when at least one accessory has a webhook enabled

### Changed
- ⚠️ [`Webhooks`](https://github.com/mpatfield/homebridge-dummy/wiki/Webhooks) now use Homebridge UI SSL (https) settings by default
    - Use `webhookConfig` to `disableSSL`, change the `port`, or override `key`/`cert` paths
    - `webhookPort` is deprecated
- Deprecated `enableWebook` (spelling) in favor of `enableWebhook`
- Deprecated `defaultBrightness` for Lightbulbs — use `isDimmer` to enable brightness control
- `fadeOut` for `Lightbulb` is now an object instead of a boolean with [selectable behaviors](https://github.com/mpatfield/homebridge-dummy/wiki/Additional-Options#lightbulb)
- Updated push notification dependency (axios)

### Fixed
- Changing accessory type within a Group removes stale sub-accessories

## 1.6.1 (2026-02-10)

### Added
- [Simulate Open/Close](https://github.com/mpatfield/homebridge-dummy/wiki/Additional-Options/#door--garagedooropener--window--windowcovering) option for Doors, Garage Doors, Windows, and Window Coverings
- Fade Out option for `Lightbulb` now visible in the config UI

### Changed
- Eve "times opened" counter for `ContactSensor` requires history to be enabled
- Translated config UI schemas are generated at build rather than runtime ([open a ticket](https://github.com/mpatfield/homebridge-dummy/issues/new/choose) if you have issues)
- Updated push notification dependency (axios)

## 1.6.0 (2026-01-25)

### Added
- Customizable [push notifications](https://github.com/mpatfield/homebridge-dummy/wiki/Push-Notification) using the [Notify!](https://notify.pingie.com/) app (Thank you for the inspiration, [@simplytoast1](https://github.com/sponsors/simplytoast1)!)
- [Eve App Support](https://github.com/mpatfield/homebridge-dummy/wiki/Eve-App-Support), including history and additional characteristics — choose "Enable History" in the config UI
    - `ContactSensor` opened/closed history and times opened count with option to reset
    - `MotionSensor` history
    - Temperature history for `TemperatureSensor` and `Thermostat`
    - Humidity history for `HumiditySensor` and `Thermostat`
    - On/off history for `Lightbulb`, `Outlet`, and `Switch`

### Changed
- States are persisted across restarts for all accessories with a `Schedule` defined
    - ⚠️ Use `Reset on Restart` option if you do not want the state to be retained

### Fixed
- [Reachability/Presence Trigger Condition](https://github.com/mpatfield/homebridge-dummy/wiki/Trigger-Conditions#reachabilitypresence) with Auto-Reset timer wasn't working properly ([#324](https://github.com/mpatfield/homebridge-dummy/issues/324))

## 1.5.7 (2026-01-20)

### Fixed
- Checkboxes in config UI not reflecting correct state in ([#318](https://github.com/mpatfield/homebridge-dummy/issues/318))
- Changing `Limiter` config resets any cached usage ([#316](https://github.com/mpatfield/homebridge-dummy/issues/316))

### Changed
- Deprecated `Limiter.id` — use `Limiter.resetOnRestart` to reset the limiter after a Homebridge restart

## 1.5.6 (2026-01-16)

### Added
- `HumidifierDehumidifier` accessory type
- [`CurrentTemperature`](https://github.com/mpatfield/homebridge-dummy/wiki/Webhooks) webhook for `Thermostat`
- [`validStates`](https://github.com/mpatfield/homebridge-dummy/wiki/Additional-Options) option for `Thermostat` to restrict the selectable modes/states

## 1.5.5 (2025-12-29)

### Changed
- Enable set/remaining duration on `Valve` when Auto-Reset timeout is defined

## 1.5.4 (2025-12-23)

### Added
- `HumiditySensor` and `TemperatureSensor` accessory types

### Changed
- Webhooks respect per-accessory logging settings

## 1.5.3 (2025-12-08)

### Added
- `Valve` accessory type

### Fixed
- Stale stored properties in commands ([#277](https://github.com/mpatfield/homebridge-dummy/issues/277)) — Thanks for the report, [@1wmatrejek](https://github.com/sponsors/1wmatrejek)!

## 1.5.2 (2025-11-28)

### Fixed
- Auto-Reset timer not resetting delay when re-invoked ([#197](https://github.com/mpatfield/homebridge-dummy/issues/197))

## 1.5.1 (2025-11-21)

### Changed
- Streamline v0.9.2 -> v1.5.1 migration flow
- Updated dependencies

## 1.5.0 (2025-11-21)

### Added
- Auto-Reset now supports the same options as Schedule — delay, interval, sun-based options, and cron
    - ⚠️ This required significant under-the-hood changes to the timer logic, so please [open a ticket](https://github.com/mpatfield/homebridge-dummy/issues/new/choose) if you have issues

### Changed
- Deprecated `timer` in favor of `autoReset` (see above)
    - This is backwards compatible, so no manual JSON config edits are necessary

## 1.4.3 (2025-11-20)

### Added
- MAC Address support for [Reachability](https://github.com/mpatfield/homebridge-dummy/wiki/Trigger-Conditions#reachabilitypresence) conditions, useful for triggering events based on joining/leaving your local network
    - ⚠️ Somewhat experimental so please [open a ticket](https://github.com/mpatfield/homebridge-dummy/issues/new/choose) if you have issues

### Fixed
- `TargetTemperature` [Webhook](https://github.com/mpatfield/homebridge-dummy/wiki/Webhooks) respects configured min/max ([#257](https://github.com/mpatfield/homebridge-dummy/issues/257))
- Suppress `Lightbulb` warnings ([#258](https://github.com/mpatfield/homebridge-dummy/issues/258)) and avoid potential crash on startup ([#266](https://github.com/mpatfield/homebridge-dummy/issues/266))
- `Thermostat` issue when setting `minimumTemperature` to zero ([#259](https://github.com/mpatfield/homebridge-dummy/issues/259))

### Changed
- Triggering accessory via `Schedule` resets any `Auto-Reset Timer`

## 1.4.2 (2025-11-14)

### Added
- `sync` [Webhooks](https://github.com/mpatfield/homebridge-dummy/wiki/Webhooks) which suppress command execution
- Accessory states can be accessed within commands via [Environment Variables](https://github.com/mpatfield/homebridge-dummy/wiki/Environment-Variables)

### Changed
- `Thermostat` - current state (i.e. HEAT/COOL/OFF) mirrors target state; previously always 'OFF'

## 1.4.1 (2025-11-06)

### Added
- [Schedule](https://github.com/mpatfield/homebridge-dummy/wiki/Schedule) settings for sunrise, sunset, dawn, dusk, golden hour, or night, with optional offset
- [Reachability](https://github.com/mpatfield/homebridge-dummy/wiki/Trigger-Conditions#reachabilitypresence) Trigger Condition
- Fetch accessory state via [Webhooks](https://github.com/mpatfield/homebridge-dummy/wiki/Webhooks)
    - `command` has been replaced by `get`/`set` - this is backwards compatible so no manual edits are necessary

## 1.4.0 (2025-11-01)

### Added
- [Trigger Conditions](https://github.com/mpatfield/homebridge-dummy/wiki/Trigger-Conditions) to change the state of an accessory based on state changes of other Homebridge Dummy accessories or keywords in the Homebridge log
    - ⚠️ Config UI for conditions is highly experimental. Please [open a ticket](https://github.com/mpatfield/homebridge-dummy/issues/new/choose) if you see any unusal behavior.
- `GET` requests for [Webhooks](https://github.com/mpatfield/homebridge-dummy/wiki/Webhooks) (previously only `POST`)
- Fade Out option for `Lightbulb` brightness to emulate a simple "count-down"
- Min/max temperature settings for `Thermostat`

### Changed
- ⚠️ Dropped [official support](https://github.com/homebridge/homebridge/wiki/How-To-Update-Node.js) for Node.js v18 and added Node.js v24
- `defaultOn` has been deprecated in favor of `defaultState` for `Lightbulb`, `Outlet`, and `Switch`
    - This is backwards compatible so no manual edits are necessary
- Updated dependencies

### Notes
After further consideration, I will continue to support `Thermostat` as an accessory type. Thanks to everybody who participated in the [discussion](https://github.com/mpatfield/homebridge-dummy/issues/207).

## 1.3.2 (2025-10-24)

### Added
- Support for `GarageDoorOpener`
- Русский перевод. Спасибо, [@Silverdragon122](https://github.com/sponsors/Silverdragon122)!

## 1.3.1 (2025-10-18)

### Fixed
- Auto-Reset timer not resetting delay when re-invoked ([#197](https://github.com/mpatfield/homebridge-dummy/issues/197))

### Added
- Deutsche Übersetzungen. Danke, [@jotzet79](https://github.com/sponsors/jotzet79)!
- Traducciones al español. ¡Gracias, [@dcompane](https://github.com/sponsors/dcompane)!

### Changed
- Webhook server port is now configurable using `webhookPort` ([docs](https://github.com/mpatfield/homebridge-dummy/wiki/Webhooks))

## 1.3.0 (2025-10-13)

### Added
- Time Limits ([docs](https://github.com/mpatfield/homebridge-dummy/wiki/Limiter))

### Fixed
- More robust command execution to prevent incorrectly displaing errors on success

### Changed
- Running timers are resumed and sensor states are restored after plugin/Homebridge restart ([#189](https://github.com/mpatfield/homebridge-dummy/issues/189)) ([#191](https://github.com/mpatfield/homebridge-dummy/issues/191))
- Improved error messaging for invalid config values

## 1.2.0 (2025-10-02)

### Added
- Webhooks ([docs](https://github.com/mpatfield/homebridge-dummy/wiki/Webhooks))

### Changed
- `schedule.cron` now expects an `@` preset or `CRON_CUSTOM` with `schedule.cronCustom` defined.
    - This is backwards compatible so no manual edits are necessary
- Better field validation in config UI (Thank you, [@justjam2013](https://github.com/sponsors/justjam2013) for teaching me this!)
- Updated dependencies
- Code changes to speed future feature development

## 1.1.0 (2025-08-14)

### Added
- "Schedule" feature to invoke accessory at a specified interval or times via cron ([#136](https://github.com/mpatfield/homebridge-dummy/issues/136))
- Groups (Beta) - Items sharing the same group name can be grouped together in a single accessory in the Home.app UI ([#46](https://github.com/mpatfield/homebridge-dummy/issues/46))
    - ⚠️ Adding/removing/changing the group name for an accessory will require you to reconfigure any HomeKit scenes or automations
- Added "Activate Sensor on Auto-Reset" option ([#142](https://github.com/mpatfield/homebridge-dummy/issues/142))
    - Instead of mirroring accessory, sensor will be activated only when accessory auto-resets
- Millisecond unit option ([#149](https://github.com/mpatfield/homebridge-dummy/issues/149))
- Rudimentary support for Thermostats ([#145](https://github.com/mpatfield/homebridge-dummy/issues/145))
    - Manual control only, no scheduling or auto-reset functionality
- Allow `sensor` to be attached to all accessory types (excluding Thermostat)

### Changed
- Reorganized plugin config UI and renamed "Timer" to "Auto-Reset Timer"
- `sensor` is now an object rather than a primitive string (backwards compatible)
- Updated dependencies

### Fixed
- Timer logging issues ([#143](https://github.com/mpatfield/homebridge-dummy/issues/143), [#148](https://github.com/mpatfield/homebridge-dummy/issues/148))
- Better support for custom configuration with multiple plugin instances and child bridges ([#152](https://github.com/mpatfield/homebridge-dummy/issues/152))
- Broken header image in config UI

## 1.0.0 (2025-07-23)

### Changed
- Complete code re-write to use [Platform Plugin](https://developers.homebridge.io/#/api/platform-plugins) instead of [Accessory Plugin](https://developers.homebridge.io/#/api/accessory-plugins)

### Added
- Drastically improved config UI
- resetOnRestart option for stateful accessories to return to defaults on Homebridge restart
- Support for Door, Outlet, and Lock Mechanism, Window, and Window Covering
- Sensor support (CO2, CO, Contact, Leak, Motion, Occupancy, and Smoke)
- Execute arbitrary commands when accessory state changes

## 0.9.2 (2025-06-26)

### Fixed
- Stateful switches not persisting across homebridge restarts

## 0.9.1 (2025-06-25)

### ⚠️ BREAKING
- node-persist updated from major version 2 to 4, so stateful and dimmer switches may lose their previously saved states

### Changed
- Migrated plugin to TypeScript

## 0.9.0 (2023-01-23)

- Last stable release by @nfarina before transfer of ownership to @mpatfield