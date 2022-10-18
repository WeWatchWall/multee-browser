import { expect } from 'chai';
import { resolve } from 'path';
import url  from 'url';
import demoWorker from './demo-worker.mjs';

describe('web worker', () => {
  let demo;

  before(async () => {
    global.__filename = url.pathToFileURL(resolve("./test/demo-worker.mjs"));
    demo = await demoWorker();
  });

  it('simple string', async () => {
    const rv = await demo.test('me');
    expect(rv).toEqual('hello me');
  });

  it('echo object', async () => {
    const input = {
      age: 33,
      name: 'John',
      child: {
        name: 'Tom',
        age: 12,
      },
    };
    const rv = await demo.echo(input);
    expect(rv).toEqual(input);
  });

  it('echo with buffer', async () => {
    const input = {
      age: 33,
      name: Buffer.from('John'),
    };
    const rv = await demo.echo(input);
    expect(rv).toHaveProperty('age', 33);
    expect(rv).toHaveProperty('name');
    expect(Buffer.from(rv.name)).toEqual(input.name);
  });

  it('async', async () => {
    const rv = await demo.async();
    expect(rv).toEqual(1);
  });

  after(() => {
    demo.close();
  });
})
