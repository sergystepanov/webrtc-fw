import Stream from './stream';

// mock used HTML API for Node
window.HTMLMediaElement.prototype.load = () => {
  /* do nothing */
};
window.HTMLMediaElement.prototype.pause = () => {
  /* do nothing */
};

const v = Stream();

beforeAll(() => {
  v.render();
});

test('if stream module is initialized', () => {
  expect(v.get()).not.toBeUndefined();
});

test('if streams are attached', () => {
  const stream = new Blob();
  v.addSource(stream);
  v.addSource(stream);
  v.addSource(stream);
  expect(v.get().src).not.toBeUndefined();
});

test('if stream is cleared', () => {
  v.reset();
  expect(v.get().srcObject).toBeUndefined();
});

test('if custom options are set', () => {
  const vv = Stream({
    autoplay: true,
    controls: true,
    muted: true,
    preload: 'none',
    ignore: undefined,
    volume: 0.5,
  });

  vv.render();
  const { ignore, autoplay, controls, muted, preload, volume } = vv.get();

  expect(ignore).toBeUndefined();
  expect(autoplay).toBe(true);
  expect(controls).toBe(true);
  expect(muted).toBe(true);
  expect(preload).toBe('none');
  expect(volume).toBe(0.5);
});
