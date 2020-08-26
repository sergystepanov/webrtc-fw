import signallingBuilder from '../network/signalling';
import ws from '../network/socket';
import { fromJson, toJson } from '../data/data';

// message prefixes
export const HELLO_MESSAGE = 'HELLO';
export const ERROR_MESSAGE = 'ERROR';
export const OFFER_REQUEST_MESSAGE = 'OFFER_REQUEST';

/**
 * A WebSocket signalling server implementation.
 *
 * @version 1
 */
export default function signallingApiV1() {
  return signallingBuilder({ factory });
  // .url(`ws://${window.location.host}/ws/`);
}

function factory({
  url = getDefaultWebsocketAddress(),
  onConnect,
  onClose,
  onError,
  onServerError,
  onMessage,
  onOffer,
  onOpen,
} = {}) {
  /** @type {WebSocket} */
  let connection;

  const onMessageMiddleware = function (message) {
    const { data } = message;

    console.debug(`[signalling] got message`, message);

    switch (data) {
      case like(data, HELLO_MESSAGE):
        console.info(`[signalling] session is opened`);
        break;
      case like(data, ERROR_MESSAGE):
        onServerError?.(data);
        break;
      case like(data, OFFER_REQUEST_MESSAGE):
        onOffer?.(null);
        break;
      default:
        // Handle incoming JSON SDP and ICE messages
        let msg = fromJson(data);

        if (msg) {
          onOffer?.(msg);
          onMessage?.(msg);
        }
    }
  };

  const connect = function () {
    console.debug(`[signal] connecting to ${url}`);

    connection = ws({
      address: url,
      onClose,
      onError,
      onMessage: onMessageMiddleware,
      onOpen,
    });

    onConnect(this);

    return connection;
  };

  /**
   * Returns signalling server url.
   * @returns {string}
   */
  const getUrl = () => url;

  /**
   * Sends data into signalling server.
   */
  const send = () => ({
    raw: (data) => connection?.send(data),
    encoded: (data) => connection?.send(toJson(data)),
  });

  const close = () => connection?.close();

  const offerCandidate = (candidate) => send().encoded({ ice: candidate });

  const offerSession = (sdp) => send().encoded({ sdp });

  return Object.freeze({
    connect,
    close,
    getUrl,
    send,
    offerCandidate,
    offerSession,
  });
}

/**
 * Returns default Websocket address based on request protocol of the app.
 */
function getDefaultWebsocketAddress() {
  const requestProtocol = window.location.protocol;

  const { proto, addr } = requestProtocol.startsWith('file')
    ? { proto: 'ws', addr: '127.0.0.1' }
    : requestProtocol.startsWith('http')
    ? { proto: 'ws', addr: window.location.hostname }
    : requestProtocol.startsWith('https')
    ? { proto: 'wss', addr: window.location.hostname }
    : {};

  const address = `${proto}://${addr}:8443`;

  if (!proto || !addr) throw new Error(`Bad connection address: ${address}`);

  return address;
}

/**
 * A switch helper for pattern matching against strings.
 * @param {string} data The input string to match against of.
 * @param {string} what A substring to search for a match with.
 */
function like(data = '', what) {
  return data.startsWith(what) ? data : '';
}
