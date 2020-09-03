# WebRTC framework

![Build](https://github.com/sergystepanov/webrtc-fw/workflows/build/badge.svg) [![Coverage Status](https://coveralls.io/repos/github/sergystepanov/webrtc-fw/badge.svg?branch=master)](https://coveralls.io/github/sergystepanov/webrtc-fw?branch=master)

A simple WebRTC client-side framework.

## How to install

```
npm i webrtc-fw
```

## How to use

1. Implement signalling server communication layer wrapped into provided `SignallingBuilder`.
2. Create new instance of `WebRTC` object with the signalling API.
3. Initialize `WebRTC` connection with the `prepare` method.

```javascript
import { WebRTC, SignallingBuilder, Socket } from 'webrtc-fw';

// [1]
// a signalling server API implementation
//
// example Websocket server communication
//
function factory({
  url = 'ws://localhost',
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

    if (data === 'HELLO') {
        console.info(`[signalling] session is opened`);
    } else if (data === 'ERROR') {
        onServerError?.(data);
    } else if (data === 'OFFER') {
        onOffer?.();
    } else {
        onMessage?.(msg);
    }
  };

  const connect = function () {
    connection = Socket({
      address: url,
      onClose,
      onError,
      onMessage: onMessageMiddleware,
      onOpen,
    });

    onConnect(this);

    return connection;
  };

  const getUrl = () => url;

  const send = () => connection?.send(data);

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

const api = () => SignallingBuilder({ factory });

// [2]
const rtc = WebRTC({
    api,
    onConnect: onServerConnect,
    onPrepare: onServerPrepare,
    onPrepareFail: () => console.error('Too many connection attempts, aborting. Refresh page to try again'),
    onError: () => console.error("Couldn't connect to server"),
    onClose: onServerClose,
    onOpen: onServerOpen,
    onRemoteTrack,
  });

// [3]
// opens new WebRTC connection
rtc.prepare();
}
```
