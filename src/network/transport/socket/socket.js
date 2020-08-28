import SOCKET_STATE from './state';

/**
 * WebSocket connections module.
 *
 * !to add simple head-of-line blocking workarounds.
 *
 * @module network/transport/socket
 *
 * @param {string} address A WebSocket address value.
 *
 * @example
 *
 * import { Socket } from './network/transport/socket'
 *
 * const conn = Socket({
 *  address: 'ws://localhost:1234/ws',
 *  onOpen: () => { console.log('socket is open'); }
 * });
 * conn.send('test');
 *
 */
function Socket({
  socket = WebSocket,
  address,
  binaryType = 'arraybuffer',
  onOpen,
  onMessage,
  onError,
  onClose,
} = {}) {
  let messageQueue = [];

  console.info(`[socket] connecting to [${address}]`);

  const conn = new socket(address);
  conn.binaryType = binaryType;

  /**
   * Checks if there is buffered data on the client.
   * @param {WebSocket} connection Socket connection.
   */
  // const isBuffered = (connection) => connection.bufferedAmount > 0;

  /**
   * Compares connection state with the provided value.
   * @param {string} state A state to expect.
   */
  const stateIs = (state) => conn?.readyState === state;

  /**
   * Sends a message into the socket.
   * @param {string | ArrayBuffer} data Some data value to send into the socket.
   */
  const send = (data) => {
    if (stateIs(SOCKET_STATE.OPEN)) {
      console.debug(`[socket] sending: ${data}`);
      conn.send(data);
    } else {
      messageQueue.push(data);
    }
  };

  conn.onopen = () => {
    console.info('[socket] connection has been opened');
    console.debug(`[socket] there are [${messageQueue.length}] messages in the queue`);

    let message = messageQueue.pop();
    while (message && stateIs(SOCKET_STATE.OPEN)) {
      send(message);
      message = messageQueue.pop();
    }

    onOpen?.();
  };
  conn.onerror = (error) => {
    messageQueue = [];
    console.error('[socket] fail', error);
    onError?.(error);
  };
  conn.onclose = () => {
    messageQueue = [];
    console.debug('[socket] closed');
    onClose?.();
  };
  conn.onmessage = (response) => {
    onMessage?.(response);
  };

  const close = () => conn?.close();

  return Object.freeze({
    conn,
    send,
    close,
  });
}

export default Socket;
