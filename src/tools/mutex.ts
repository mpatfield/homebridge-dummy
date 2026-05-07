export class Mutex {

  private _lock: Promise<void> = Promise.resolve();

  public async lock<T>(fn: () => T | Promise<T>): Promise<T> {
    const prev = this._lock;
    let release!: () => void;
    this._lock = new Promise(r => release = r);
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}
