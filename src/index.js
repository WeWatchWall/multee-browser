const Worker = require('web-worker');
const { v4: uuidv4 } = require('uuid');

const handlers = {};
const waitingForResolve = {};

const NODE_NAME = 'multee_worker_node';
const WEB_NAME = 'multee_worker_web';

function buildWorker(filename) {
  const name = isNode() ? NODE_NAME : WEB_NAME;
  const worker = new Worker(filename, {type: 'module', name: name});
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

const isNode = () => {
  return typeof process === 'object' && typeof window === 'undefined';
};

const isSub = () => {
  let hasSelf = true;
  let workerSelf;
  try {
    workerSelf = self;
  } catch {
    hasSelf = false;
  }

  const self = workerSelf;

  // For testing, this is meant to be run in a web worker.
  if (self !== undefined && self.name === NODE_NAME) {
    const module = 'worker_threads';
    const wt = import(module);
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