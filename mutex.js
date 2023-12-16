export class Mutex {
  constructor() {
    this._busy = false;
    this._queue = [];
  }

  synchronize(task) {
    const self = this;

    return new Promise(function(resolve, reject) {
      self._queue.push([task, resolve, reject]);
      if (!self._busy) self._dequeue();
    });
  };

  _dequeue() {
    this._busy = true;
    const next = this._queue.shift();

    if (next)
      this._execute(next);
    else
      this._busy = false;
  };

  _execute(record) {
    const task = record[0],
      resolve = record[1],
      reject = record[2],
      self = this;

    task().then(resolve, reject).then(function() {
      self._dequeue();
    });
  };
};

