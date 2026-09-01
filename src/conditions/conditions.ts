import { LogWatcher } from './logWatcher.js';
import { Reachability } from './reachability.js';

import { AccessoryState, ConditionOperator, getStateType, OperandType, PingAvailability } from '../model/enums.js';
import { ConditionsConfig } from '../model/types.js';

import { strings } from '../i18n/i18n.js';

import { Log } from '../tools/log.js';
import { assert } from '../tools/validation.js';

type Target = {
    name: string,
    identifier: string,
    conditions: ConditionsConfig,
    trigger: () => Promise<void>,
    reset: (() => Promise<void>) | undefined,
    disableLogging: boolean,
}

export class ConditionManager {

  private readonly targets = new Map<string, Target>();
  private readonly triggersToTargets = new Map<string, string[]>();

  private readonly accessoryStates = new Map<string, AccessoryState>();

  private readonly reachabilityInstances: Reachability[] = [];
  private readonly reachabilityStates = new Map<string, boolean>();

  private readonly logWatcher: LogWatcher;

  constructor(private readonly log: Log, storagePath: string) {
    this.logWatcher = new LogWatcher(log, storagePath);
  }

  public teardown() {
    this.logWatcher.teardown();
    this.reachabilityInstances.forEach((instance) => instance.teardown());
  }

  public register(name: string, identifier: string, conditions: ConditionsConfig | undefined,
    trigger: () => Promise<void>, reset: (() => Promise<void>) | undefined, disableLogging: boolean) {

    if (conditions === undefined) {
      return;
    }

    if (!assert(this.log, name, conditions, 'operator', 'operands')) {
      return;
    }

    let logTypeCount = 0;

    let valid = true;
    for (const operand of conditions.operands) {
      valid = valid && assert(this.log, name, operand, 'type');

      switch(operand.type) {
      case OperandType.ACCESSORY:
        valid = valid && assert(this.log, name, operand, 'accessoryId', 'accessoryState');
        break;
      case OperandType.LOG:
        logTypeCount++;
        valid = valid && assert(this.log, name, operand, 'pattern');
        break;
      case OperandType.PING:
        valid = valid && assert(this.log, name, operand, 'pingHost');
        break;
      }

      if (operand.accessoryId === identifier) {
        this.log.error(strings.conditions.selfReference, name);
        valid = false;
        break;
      }
    }

    if (logTypeCount > 1 && conditions.operator === ConditionOperator.AND) {
      this.log.error(strings.conditions.andMultipleLogs, name);
      return;
    }

    if (!valid) {
      return;
    }

    const target = { name, identifier, conditions, trigger, reset, disableLogging };
    this.targets.set(identifier, target);

    for (const operand of conditions.operands) {

      switch(operand.type) {
      case OperandType.ACCESSORY: {
        const targetList = this.triggersToTargets.get(operand.accessoryId!) ?? [];
        targetList.push(identifier);
        this.triggersToTargets.set(operand.accessoryId!, targetList);
        break;
      }
      case OperandType.LOG:
        this.logWatcher.registerPattern(operand.pattern!, () => this.onPatternMatch(target));
        break;
      case OperandType.PING:
        this.reachabilityInstances.push(new Reachability(this.log, operand.pingHost!, operand.pingInterval, operand.pingUnits, (reachable) => {
          this.onReachabilityChange(target, operand.pingHost!, reachable);
        }));
        break;
      }
    }
  }

  public async onStateChange(triggerId: string, state: AccessoryState) {

    const targetIds = this.triggersToTargets.get(triggerId);
    if (!targetIds) {
      return;
    }

    const isInit = !this.accessoryStates.has(triggerId);

    this.accessoryStates.set(triggerId, state);

    if (isInit) {
      return;
    }

    for (const targetId of targetIds) {

      const target = this.targets.get(targetId);
      if (!target) {
        throw new Error('Unable to find target associated with the supplied trigger');
      }

      this.log.ifVerbose(strings.conditions.evaluatingConditions, target.name);

      if (this.evaluateConditions(target.conditions)) {
        if (!target.disableLogging) {
          this.log.always(strings.conditions.satisfied, target.name);
        }
        await target.trigger();
      } else {
        this.log.ifVerbose(strings.conditions.notSatisfied, target.name);
        await target.reset?.();
      }
    }
  }

  private onPatternMatch(target: Target) {

    if (target.conditions.operands.length === 1 || target.conditions.operator === ConditionOperator.OR) {
      this.log.ifVerbose(strings.conditions.patternMatch, target.name);
      target.trigger();
      return;
    }

    this.log.ifVerbose(strings.conditions.patternAndConditions, target.name);
    if (!this.evaluateConditions(target.conditions, true)) {
      this.log.ifVerbose(strings.conditions.notSatisfied, target.name);
      return;
    }

    if (!target.disableLogging) {
      this.log.always(strings.conditions.satisfied, target.name);
    }

    target.trigger();
  }

  private async onReachabilityChange(target: Target, host: string, reachable: boolean) {
    this.reachabilityStates.set(host, reachable);

    if (this.evaluateConditions(target.conditions)) {
      if (!target.disableLogging) {
        this.log.always(strings.conditions.satisfied, target.name);
      }
      await target.trigger();
    } else {
      this.log.ifVerbose(strings.conditions.notSatisfied, target.name);
      await target.reset?.();
    }
  }

  private evaluateConditions(conditions: ConditionsConfig, ignoreLogType: boolean = false): boolean {

    let result: boolean | undefined;

    for (const operand of conditions.operands) {

      if (operand.type === OperandType.LOG) {

        if (ignoreLogType || conditions.operator === ConditionOperator.OR) {
          continue;
        }

        result = false;
        break;
      }

      let operandResult: boolean | undefined;
      if (operand.type === OperandType.ACCESSORY) {

        const currentState = this.accessoryStates.get(operand.accessoryId!);
        if (!currentState) {
          this.log.ifVerbose(strings.conditions.stateUnknown, `'${operand.accessoryId}'`);
          result = false;
          break;
        }

        operandResult = this.compareStates(currentState, operand.accessoryState!);

      } else if (operand.type === OperandType.PING) {

        const currentReachability = this.reachabilityStates.get(operand.pingHost!);
        if (currentReachability === undefined) {
          this.log.ifVerbose(strings.conditions.reachabilityUnknown, `'${operand.pingHost}'`);
          result = false;
          break;
        }

        operandResult = currentReachability === (operand.pingAvailability !== PingAvailability.NOT_AVAILABLE);
      }

      if (operandResult === undefined) {
        throw new Error('operandResult should never be undefined at this point');
      }

      switch(conditions.operator) {
      case ConditionOperator.AND:
        result = result === undefined ? operandResult : result && operandResult;
        break;
      case ConditionOperator.OR:
        result = result === undefined ? operandResult : result || operandResult;
        break;
      }

      this.log.ifVerbose(strings.conditions.currentResult, `'${String(result)}'`);
    }

    return result ?? true;
  }

  private compareStates(current: AccessoryState, desired: AccessoryState): boolean {

    if (current === desired) {
      this.log.ifVerbose(strings.conditions.statesEqual, `'${current}'`);
      return true;
    }

    const stateType = getStateType(current);
    if (stateType && !Object.values(stateType).includes(desired)) {
      this.log.error(strings.conditions.statesUnrelated, `'${current}'`, `'${desired}'`);
      return false;
    }

    this.log.ifVerbose(strings.conditions.statesNotEqual, `'${current}'`, `'${desired}'`);
    return false;
  }
}