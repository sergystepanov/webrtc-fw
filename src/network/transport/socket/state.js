const SOCKET_STATE = Object.freeze({
  // Socket has been created. The connection is not yet open.
  CONNECTING: 0,
  // The connection is open and ready to communicate.
  OPEN: 1,
  // The connection is in the process of closing.
  CLOSING: 2,
  // The connection is closed or couldn't be opened.
  CLOSED: 3,
});

export default SOCKET_STATE;
