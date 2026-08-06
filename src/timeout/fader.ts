import { Timeout } from './timeout.js';

export class Fader extends Timeout {

  public value: number | undefined;

  public get isFading(): boolean {
    return this.value !== undefined;
  }

  public start(startingValue: number, endingValue: number, delay: number, tick: (value: number) => void) {

    this.reset();

    if (startingValue === endingValue) {
      this.value = endingValue;
      tick(this.value);
      this.reset();
      return;
    }

    const interval = delay / Math.abs(endingValue - startingValue);
    this.value = startingValue;

    const delta = startingValue < endingValue ? 1 : -1;

    this.timeout = setInterval( () => {

      if (this.value === undefined) {
        return;
      }

      this.value = this.limitValue(this.value + delta, startingValue, endingValue);
      tick(this.value);

      if (this.value === endingValue) {
        this.reset();
      }

    }, interval);
  }

  override reset() {
    this.value = undefined;
    super.reset();
  }

  private limitValue(value: number, limitA: number, limitB: number): number {

    const min = limitA < limitB ? limitA : limitB;
    const max = limitA > limitB ? limitA : limitB;

    if (value < min) {
      return min;
    }

    if (value > max) {
      return max;
    }

    return value;
  }
}