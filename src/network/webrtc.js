import SignallingBuilder from './protocol/signalling';

/**
 * Webrtc module based on RTCPeerConnection element.
 *
 * Contains a wrapper for RTCPeerConnection element
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection}.
 *
 * @module network/webrtc
 *
 */
function WebRTC({
  reconnects = 3,
  stopLocalIce = false,
  rtc = {
    iceServers: [
      { urls: 'stun:stun.services.mozilla.com' },
      { urls: 'stun:stun.stunprotocol.org' },
      { urls: 'stun:stun.l.google.com:19302' },
    ],
  },
  signallingApi = SignallingBuilder(),
  onPrepare,
  onPrepareFail,
  onConnect,
  onClose,
  onError,
  onMessage,
  onOpen,
  onRemoteTrack,
} = {}) {
  const state = Object.seal({
    connectionAttempts: 0,
    connectionState: '',
    localIceCompleted: false,
    iceConnectionState: '',
    iceGatheringState: '',
  });

  /** @type RTCPeerConnection */
  let connection;
  let reconnect;

  const dataChannels = new Map();

  const signalling = signallingApi()
    .onConnect((signallingBuild) => {
      reconnect = false;
      onConnect?.(signallingBuild);
    })
    .onError((event) => {
      onError?.(event);
      if (!reconnect) reconnect = setTimeout(prepare, 3000);
    })
    .onServerError((error) => {
      console.error('[webrtc] got signalling error:', error);
      shutdown();
    })
    .onClose((event) => {
      onClose?.(event);
      connection?.close();
      connection = undefined;
      if (!reconnect) reconnect = setTimeout(prepare, 1000);
    })
    .onOffer((data) => {
      // The peer wants us to set up and then send an offer
      openPeerConnection(data);
      if (data === null) {
        createOffer();
      }
    })
    .onMessage((message) => {
      const { sdp, ice } = message;

      if (sdp != null) {
        onIncomingSDP(sdp).catch(onError);
      } else if (ice != null) {
        onRemoteIceCandidate(ice).catch(onError);
      } else {
        console.warn(`[webrtc] unhandled message: ${message}`);
      }

      onMessage?.(message);
    })
    .onOpen((event) => onOpen?.(event))
    .build();

  const isActive = () => !!connection;

  /**
   * @returns {RTCPeerConnection}
   */
  const getConnection = () => connection;

  const connect = () => {
    resetState();

    connection = new RTCPeerConnection(rtc);
    connection.onconnectionstatechange = onConnectionStateChange;
    connection.ondatachannel = onDataChannel;
    // make Trickle ICE (1)
    connection.onicecandidate = onIceCandidate;
    connection.oniceconnectionstatechange = onIceConnectionStateChange;
    connection.onicegatheringstatechange = onIceGatheringStateChange;
    connection.ontrack = onRemoteTrack;
  };

  // make Trickle ICE (2)
  async function onRemoteIceCandidate(ice) {
    console.debug('[webrtc][ice] received ice', ice);
    await connection?.addIceCandidate(new RTCIceCandidate(ice));
  }

  // Local description was set, send it to peer
  async function onLocalDescription(desc) {
    console.log('[webrtc] got local SDP');

    // force stereo in Chrome
    // !to fix inf loop in Firefox
    // desc.sdp = addParamsToCodec(desc.sdp, 'opus', { 'sprop-stereo': 1, stereo: 1 });

    await connection?.setLocalDescription(desc);
    console.debug(`[webrtc] sending SDP ${desc.type}`);
    signalling?.offerSession(connection.localDescription);
  }

  function onDataChannelOpen(event) {
    console.debug('[webrtc][data-chan] has been opened', event);
  }

  function onDataChannelMessageReceived(event) {
    console.debug('[webrtc][data-chan] got a message', event, event.data.type);

    const isText = typeof event.data === 'string' || event.data instanceof String;
    console.info(`[webrtc][data-chan][${isText ? 'txt' : 'bin'}] message: ${event.data}`);

    dataChannels.get('ch0').send('Hey!');
  }

  function onDataChannelError(error) {
    console.error('[webrtc][data-chan] an error', error);
  }

  function onDataChannelClose(event) {
    console.debug('[webrtc][data-chan] closed', event);
  }

  /**
   * This happens whenever the aggregate state of the connection changes.
   */
  function onConnectionStateChange() {
    console.debug(
      `[webrtc] connection state change [${state.connectionState}] -> [${connection.connectionState}]`,
    );
    state.connectionState = connection.connectionState;
  }

  function onIceCandidate(event) {
    if (!stopLocalIce && state.localIceCompleted) return;

    const { candidate } = event;

    if (candidate === null) {
      state.localIceCompleted = true;
      console.log('[webrtc][ice] ICE gathering is complete');
      return;
    }
    console.debug('[webrtc][ice] got ice', candidate);

    signalling?.offerCandidate(candidate);
  }

  function onIceConnectionStateChange() {
    console.debug(
      `[webrtc][ice] ICE connection state change [${state.iceConnectionState}] -> [${connection.iceConnectionState}]`,
    );
    state.iceConnectionState = connection.iceConnectionState;
  }

  function onIceGatheringStateChange() {
    console.debug(
      `[webrtc][ice] ICE gathering state change [${state.iceGatheringState}] -> [${connection.iceGatheringState}]`,
    );
    state.iceGatheringState = connection.iceGatheringState;
  }

  /**
   * This event, of type RTCDataChannelEvent, is sent when an RTCDataChannel
   * is added to the connection by the remote peer calling createDataChannel().
   *
   * @param {RTCDataChannelEvent} event
   */
  function onDataChannel(event) {
    console.debug('[webrtc] data channel has been created', event.channel);

    const inChannel = event.channel;
    inChannel.onopen = onDataChannelOpen;
    inChannel.onmessage = onDataChannelMessageReceived;
    inChannel.onerror = onDataChannelError;
    inChannel.onclose = onDataChannelClose;
  }

  function openPeerConnection(message) {
    if (isActive()) return;

    console.info('[webrtc] setup peer connection');

    connect();

    if (message) console.info('Created peer connection for call, waiting for SDP');

    // add a data channel
    const ch0 = connection.createDataChannel('data', null);
    ch0.onopen = onDataChannelOpen;
    ch0.onmessage = onDataChannelMessageReceived;
    ch0.onerror = onDataChannelError;
    ch0.onclose = onDataChannelClose;

    dataChannels.set('ch0', ch0);

    /* Send our video/audio to the other peer */

    // local_stream_promise = getLocalStream()
    //   .then((stream) => {
    //     console.log('Adding local stream');
    //     peer_connection.addStream(stream);
    //     return stream;
    //   })
    //   .catch(setError);

    // return local_stream_promise;
  }

  // SDP offer received from peer, set remote description and create an answer
  async function onIncomingSDP(sdp) {
    await connection?.setRemoteDescription(sdp);
    console.debug('[webrtc] remote SDP set');
    if (sdp.type !== 'offer') return;

    console.debug('[webrtc] got SDP offer');
    const answer = await connection?.createAnswer();
    onLocalDescription(answer);
    // + wait for a local stream
  }

  /**
   * Adds user stream into the WebRTC connection.
   * @param {*} stream
   */
  const addStream = (stream) => {
    connection?.addStream(stream);
  };

  async function createOffer() {
    const sdp = await connection?.createOffer();
    onLocalDescription(sdp);
  }

  function prepare() {
    onPrepare?.();

    if (signalling) {
      if (state.connectionAttempts > reconnects) {
        onPrepareFail?.();
        return;
      }

      state.connectionAttempts += 1;
      signalling?.connect();
    }
  }

  function shutdown() {
    state.connectionState = '';
    signalling?.close();
  }

  function resetState() {
    state.connectionAttempts = 0;
    state.localIceCompleted = false;
    state.iceConnectionState = '';
    state.iceGatheringState = '';
    state.connectionState = '';
  }

  return Object.freeze({
    isActive,
    connect,
    signalling,
    getConnection,
    prepare,
    shutdown,
    addStream,
  });
}

export default WebRTC;
