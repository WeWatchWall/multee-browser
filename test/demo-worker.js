const Multee = require('../src/index.cjs');
const multee = Multee();

const test = multee.createHandler('test', (name) => {
  return `hello ${name}`;
});

const echo = multee.createHandler('echo', (args) => {
  return args;
});

const asyncJob = multee.createHandler('async', async () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(1), 100);
  });
});

module.exports = function main() {
  const filename = global.__filename;
  const worker = multee.start(filename);
  return {
    test: test(worker),
    echo: echo(worker),
    async: asyncJob(worker),
    close: () => worker.terminate(),
  };
}
