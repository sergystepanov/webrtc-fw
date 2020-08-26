/**
 * WebSocket connections module.
 *
 * @param {string} address A WebSocket address value.
 * @example <caption>Example usage of socket module.</caption>
 *
 * import Socket from './socket'
 *
 * const conn = Socket({
 *  address: 'ws://localhost:1234/ws',
 *  onOpen: () => { console.log('socket is open'); }
 * });
 * conn.send('test');
 *
 */
export default function ({
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

  conn.onopen = () => {
    console.info('[socket] connection has been opened');
    console.debug(`[socket] there are [${messageQueue.length}] messages in the queue`);

    let message;
    while ((message = messageQueue.pop()) && conn.readyState === STATE.OPEN) send(message);

    onOpen?.();
  };
  conn.onerror = (error) => {
    messageQueue = [];
    console.error(`[socket] fail`, error);
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

  /**
   * Sends a message into the socket.
   * @param {string | ArrayBuffer} data Some data value to send into the socket.
   */
  const send = (data) => {
    if (conn.readyState == STATE.OPEN) {
      console.debug(`[socket] sending: ${data}`);
      conn.send(data);
    } else {
      messageQueue.push(data);
    }
  };

  const close = () => conn?.close();

  return Object.freeze({
    conn,
    send,
    close,
  });
}

// socket states
export const STATE = Object.freeze({
  // Socket has been created. The connection is not yet open.
  CONNECTING: 0,
  // The connection is open and ready to communicate.
  OPEN: 1,
  // The connection is in the process of closing.
  CLOSING: 2,
  // The connection is closed or couldn't be opened.
  CLOSED: 3,
});
