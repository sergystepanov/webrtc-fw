import Socket, { STATE } from './socket';

// an uber mocking socket proxy
let testSocketImpl = ({
  send = function (message) {
    this.onmessage(message);
  },
  close = function () {
    this.readyState = STATE.CLOSING;
    this.onclose();
    this.readyState = STATE.CLOSED;
  },
} = {}) => {
  return function (address) {
    return new Proxy(
      {
        send,
        close,
      },
      {
        set: (target, key, value) => {
          target[key] = value;
          // emulate onopen call and callback
          if (key === 'onopen') {
            target.onopen();
            target.readyState = STATE.OPEN;
          }
          return true;
        },
      }
    );
  };
};

test('if socket defaults are ok', () => {
  const socket = Socket({ address: 'ws://localhost' });

  expect(socket).toBeDefined();
});

test('if default socket config will fail without an address', () => {
  try {
    Socket();
  } catch (e) {
    expect(e).toBeDefined();
  }
});

test('if the socket is initialized', () => {
  const socket = Socket({
    socket: testSocketImpl(),
    address: 'it_is://a-test',
  });
  socket.send('test');
  socket.close();

  expect(socket).toBeDefined();
  expect(socket.conn.readyState).toBe(STATE.CLOSED);
});

test('if messages are sent', () => {
  let myMessage;
  const socket = Socket({
    socket: testSocketImpl(),
    address: 'it_is://a-test',
    onMessage: (m) => (myMessage = m),
  });
  socket.send('message');
  socket.close();

  expect(myMessage).toBe('message');
  expect(socket.conn.readyState).toBe(STATE.CLOSED);
});

test('if errors are handled properly', () => {
  let myError;
  const socket = Socket({
    socket: testSocketImpl(),
    address: 'it_is://a-test',
    onError: (e) => (myError = e),
  });
  socket.conn.onerror('test-error');
  socket.close();

  expect(myError).toBe('test-error');
  expect(socket.conn.readyState).toBe(STATE.CLOSED);
});

test('if message queue behave correctly', () => {
  let messageCounter = 0;
  const socket = Socket({
    socket: testSocketImpl(),
    address: 'it_is://a-test',
    onMessage: () => {
      messageCounter++;
    },
  });
  socket.conn.readyState = STATE.CLOSED;
  socket.send('a');
  socket.send('b');
  socket.send('c');
  socket.conn.onerror('test-error');
  socket.send('a');
  socket.close();
  socket.send('a');
  socket.send('b');
  socket.conn.readyState = STATE.OPEN;
  socket.conn.onopen();
  socket.send('c');
  socket.close();

  expect(messageCounter).toBe(3);
  expect(socket.conn.readyState).toBe(STATE.CLOSED);
});
