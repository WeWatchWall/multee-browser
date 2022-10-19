const { expect } = require('chai');
const { resolve } = require('path');
const url  = require('url');
const demoWorker = require('./demo-worker.js');

describe('web worker', () => {
  let demo;

  before(async () => {
    global.__filename = url.pathToFileURL(resolve("./test/demo-worker.js"));
    demo = await demoWorker();
  });

  it('simple string', async () => {
    const rv = await demo.test('me');
    expect(rv).to.equal('hello me');
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
    expect(rv).to.deep.equal(input);
  });

  it('echo with buffer', async () => {
    const input = {
      age: 33,
      name: Buffer.from('John'),
    };
    const rv = await demo.echo(input);
    expect(rv).to.has.property('age', 33);
    expect(rv).to.has.property('name');
    expect(Buffer.from(rv.name)).to.deep.equal(input.name);
  });

  it('async', async () => {
    const rv = await demo.async();
    expect(rv).to.equal(1);
  });

  after(() => {
    demo.close();
  });
})
