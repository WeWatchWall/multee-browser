# multee-browser

[![Build and test status](https://github.com/WeWatchWall/multee-browser/workflows/Lint%20and%20test/badge.svg)](https://github.com/WeWatchWall/multee-browser/actions?query=workflow%3A%22Lint+and+test%22)
[![NPM version](https://img.shields.io/npm/v/multee-browser.svg)](https://www.npmjs.com/package/multee-browser)

`multee-browser` is a "battery" API. It turns the browser's multitasking Web Workers into simple async functions. It works with Typescript. The [multee](https://www.npmjs.com/package/multee) package provided a lot of the inspiration for this work.

## Getting started

```bash
npm i multee-browser
```

## Why multee-browser helps

Without `multee-browser`, you need to listen to messages from your threads, and it is hard to integrate the listener to other part of your code. Also, when there are multiple operations inside the worker, we have to implement the dispatching logic inside the message listener.

The code will look like below without `multee-browser`:

```javascript
// worker.js
self.addEventListener('message', async msg => {
  // do heavy load job
  let result = 0;
  for (let i = 0; i < 100000000; i++) {
    result += heavy_and_return_same(i);
  }
  self.postmessage(result);
});

// main.js
const child = new Worker('./worker');

worker.addEventListener('message', msg => {
  // if is job result
  part2(msg.data);
});

function part1() {
  child.postmessage(payload_for_worker);
}

function part2(result) {
  // do the rest with result
}
```

And with `multee-browser`, it's just as easy as calling an async function.

```javascript
// worker.js
import Multee from 'multee-browser';
const multee = Multee();

const jobA = multee.createHandler('jobA', () => {
  // do the heavy load here
  let result = 0;
  for (let i = 0; i < 100; i++) {
    result += heavy_and_return_same(i);
  }
  return result;
})

export default function {
  start: () => {
    const worker = multee.start('./worker.js');
    return {
      run: jobA(worker),
      worker: worker
    };
  }
}

// main.js
import worker from'./worker.js';

async function partA() {
  const test = worker.start();
  const result = await test.run();
  // do the rest with result
  console.log(result);
  // { result: 4950 }
  test.worker.terminate();
}
```

## Browser-specific caveats

1. The browser doesn't have the `require('module')` function.
Therefore, the ESM module and import is the more supported option.
This is especially true for Web Workers.

2. Usually, the file cannot reliably and automatically find out its own name
due to browser bundling.

3. The imports need to be accessible from the client through the page loading
mechanism. Webpack and esbuild might be able to allow for such bundling and
deployments...somehow. The easiest is to bundle the worker files separately
using the following:

- Setup:

```bash
npm i --save-dev browserify esmify
```

- Bundle inside `package.json`:

```json
"scripts": {
  ...
  "deploy": "browserify src/worker.js -p esmify > public/worker.js",
  ...
}
```

It is possible to apply the same technique a whole folder of workers that deploy
into a set of worker bundles.
