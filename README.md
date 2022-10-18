# multee-browser

[![Build and test status](https://github.com/WeWatchWall/multee-browser/workflows/Lint%20and%20test/badge.svg)](https://github.com/WeWatchWall/multee-browser/actions?query=workflow%3A%22Lint+and+test%22)
[![NPM version](https://img.shields.io/npm/v/multee-browser.svg)](https://www.npmjs.com/package/multee-browser)

multee-browser is a "battery" API. It turns the browser's multitasking Web Workers into simple async functions.

## Why multee helps

Without `multee-browser`, you need to listen to messages from your threads/processes, and it is hard to integrate the listener to other part of your code. Also, when there are multiple operations inside the worker, we have to implement the dispatching logic inside the message listener.

The code will look like below without `multee-browser`:

```javascript
// worker.js
onmessage = function (msg) {
  // do heavy load job
  let result = 0
  for (let i = 0; i < 100000000; i++) {
    result += heavy_and_return_same(i)
  }
  process.send(result)
};

// main.js
const child = new Worker('./worker');

child.onmessage = function (msg) {
  // if is job result
  part2(msg)
};

function part1() {
  child.postmessage(payload_for_worker)
}

function part2(result) {
  // do the rest with result
}
```

And with `multee-browser`, it's just as easy as calling an async function.

```javascript
// worker.js
const Multee = require('multee-browser')
const multee = Multee()

const jobA = multee.createHandler('jobA', () => {
  // do the heavy load here
  let result = 0
  for (let i = 0; i < 100; i++) {
    result += heavy_and_return_same(i)
  }
  return result
})

module.exports = {
  start: () => {
    const worker = multee.start(__filename);
    return {
      test: jobA(worker),
      worker: worker
    };
  }
}

// main.js
async function partA() {
  const worker = require('./worker');
  const test = worker.start();
  const result = await test.test();
  // do the rest with result
  console.log(result);
  // { result: 4950 }
  test.worker.terminate();
}
```

## Out-of-the-box Typescript support

`multee-browser` works with Typescript. As you can't directly start worker_threads from Typescript, `multee-browser` includes the battery to handle that. note: `ts-node` needed as a peer dependency when using Typescript.
