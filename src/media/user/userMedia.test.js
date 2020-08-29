import UserMedia from './userMedia';

global.navigator.mediaDevices = { getUserMedia: {} };

test('if module is initialized', () => {
  expect(UserMedia()).not.toBeUndefined();
});

test('if module support check is ok', () => {
  global.navigator.mediaDevices = { getUserMedia: undefined };

  const mockNotSupported = jest.fn();
  UserMedia({ onNotSupported: mockNotSupported });
  expect(mockNotSupported.mock.calls.length).toBe(1);
});

test('if a stream can be returned', () => {
  const expectedStream = {};
  global.navigator.mediaDevices = { getUserMedia: () => Promise.resolve(expectedStream) };

  return UserMedia().getStream().then((stream) => expect(stream).toBe(expectedStream));
});

test('if a stream can\'t be returned if no support for the module', async () => {
  expect.assertions(1);
  global.navigator.mediaDevices = { getUserMedia: undefined };

  let accidentalStream;
  try {
    accidentalStream = await UserMedia().getStream();
  } catch (e) {
    expect(accidentalStream).toBeUndefined();
  }
});

test('if a stream getter fails horribly and handled after', async () => {
  expect.assertions(2);
  global.navigator.mediaDevices = { getUserMedia: () => {
    throw new Error('42');
  } };
  const mockOnFailCallback = jest.fn();

  let accidentalStream;
  try {
    accidentalStream = await UserMedia({
      onError: mockOnFailCallback,
    }).getStream();
  } catch (e) {
    expect(accidentalStream).toBeUndefined();
  }
  expect(mockOnFailCallback.mock.calls.length).toBe(1);
});

test('if module support check won\'t allow to get any streams', async () => {
  global.navigator.mediaDevices = { getUserMedia: undefined };

  const um = UserMedia();
  um.stop();
  let accidentalStream;
  try {
    accidentalStream = await UserMedia().getStream();
  } catch (e) {
    expect(accidentalStream).toBeUndefined();
  }
});

test('if module calls stop for every internal stream', async () => {
  const mockTrack = jest.fn();
  const stop = jest.fn();
  mockTrack.stop = stop;
  const expectedStream = {
    getTracks: () => [mockTrack, mockTrack, mockTrack],
  };
  global.navigator.mediaDevices = { getUserMedia: () => Promise.resolve(expectedStream) };

  const um = UserMedia();
  await um.getStream();
  um.stop();

  expect(stop.mock.calls.length).toBe(3);
});
