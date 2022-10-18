const Worker = require('web-worker');
const { v4: uuidv4 } = require('uuid');

const handlers = {};
const waitingForResolve = {};

function buildWorker(filename) {
  const worker = new Worker(`file:///${filename}`);
  worker.send = worker.postMessage;

  return worker;
}

const start = (buildSub) => (script) => {
  const sub = buildSub(script);
  sub.addEventListener('message', (payload) => {
    const cb = waitingForResolve[payload.data.uuid];
    delete waitingForResolve[payload.data.uuid];
    cb(payload.data.result);
  })
  return sub;
}

const createHandler = (name, handler) => {
  const caller = (sub) => (args) => {
    const uuid = uuidv4();
    sub.send({ name, uuid, args });
    return new Promise((r) => (waitingForResolve[uuid] = r));
  }
  handlers[name] = handler;
  return caller;
}

const isSub = () => {
  // For testing, this is meant to be run in a web worker.
  if (typeof process === 'object' && typeof window === 'undefined') {
    const wt = require('worker_threads');
    return !wt.isMainThread;
  }

  return typeof WorkerGlobalScope !== 'undefined' &&
    self instanceof WorkerGlobalScope;
};

const listen = () => {
  if (!isSub()) { return };

  self.addEventListener('message', async (payload) => {
    const worker = handlers[payload.data.name];
    const rv = await worker(payload.data.args);
    self.postMessage({
      uuid: payload.data.uuid,
      result: rv,
    });
  });
};

module.exports = () => {
  listen();
  return { start: start(buildWorker), createHandler };
}
