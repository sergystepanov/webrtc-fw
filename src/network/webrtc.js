import { SignallingBuilder } from './protocol/signalling';
import { addParamsToCodec } from './protocol/sdp';

/**
 * Webrtc module based on RTCPeerConnection element.
 *
 * Contains a wrapper for RTCPeerConnection element
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection}.
 *
 * @module network/webrtc
 *
 * @example
 *
 * import { WebRTC } from './network/webrtc'
 *
 * const w = WebRTC();
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
    .onConnect((signalling) => {
      reconnect = false;
      onConnect?.(signalling);
    })
    .onError((event) => {
      onError?.(event);
      if (!reconnect) reconnect = setTimeout(prepare, 3000);
    })
    .onServerError((error) => {
      console.error(`[webrtc] got signalling error:`, error);
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
    })
    .onOpen((event) => onOpen?.(event))
    .build();

  const connect = () => {
    resetState();

    connection = new RTCPeerConnection(rtc);
    connection.onconnectionstatechange = _onConnectionStateChange;
    connection.ondatachannel = _onDataChannel;
    // make Trickle ICE (1)
    connection.onicecandidate = _onIceCandidate;
    connection.oniceconnectionstatechange = _onIceConnectionStateChange;
    connection.onicegatheringstatechange = _onIceGatheringStateChange;
    connection.ontrack = onRemoteTrack;
  };

  /**
   * @returns {RTCPeerConnection}
   */
  const getConnection = () => connection;

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

  function prepare() {
    onPrepare?.();

    if (signalling) {
      if (++state.connectionAttempts > reconnects) {
        onPrepareFail?.();
        return;
      }

      signalling?.connect();
    }
  }

  function shutdown() {
    state.connectionState = '';
    signalling?.close();
  }

  const isActive = () => !!connection;

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

  // make Trickle ICE (2)
  async function onRemoteIceCandidate(ice) {
    console.debug(`[webrtc][ice] received ice`, ice);
    await connection?.addIceCandidate(new RTCIceCandidate(ice));
  }

  // Local description was set, send it to peer
  async function onLocalDescription(desc) {
    console.log(`[webrtc] got local SDP`);

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
  function _onConnectionStateChange() {
    console.debug(
      `[webrtc] connection state change [${state.connectionState}] -> [${connection.connectionState}]`
    );
    state.connectionState = connection.connectionState;
  }

  function _onIceCandidate(event) {
    if (!stopLocalIce && state.localIceCompleted) return;

    const { candidate } = event;

    if (candidate === null) {
      state.localIceCompleted = true;
      console.log('[webrtc][ice] ICE gathering is complete');
      return;
    }
    console.debug(`[webrtc][ice] got ice`, candidate);

    signalling?.offerCandidate(candidate);
  }

  function _onIceConnectionStateChange() {
    console.debug(
      `[webrtc][ice] ICE connection state change [${state.iceConnectionState}] -> [${connection.iceConnectionState}]`
    );
    state.iceConnectionState = connection.iceConnectionState;
  }

  function _onIceGatheringStateChange() {
    console.debug(
      `[webrtc][ice] ICE gathering state change [${state.iceGatheringState}] -> [${connection.iceGatheringState}]`
    );
    state.iceGatheringState = connection.iceGatheringState;
  }

  /**
   * This event, of type RTCDataChannelEvent, is sent when an RTCDataChannel
   * is added to the connection by the remote peer calling createDataChannel().
   *
   * @param {RTCDataChannelEvent} event
   */
  function _onDataChannel(event) {
    console.debug('[webrtc] data channel has been created', event.channel);

    let inChannel = event.channel;
    inChannel.onopen = onDataChannelOpen;
    inChannel.onmessage = onDataChannelMessageReceived;
    inChannel.onerror = onDataChannelError;
    inChannel.onclose = onDataChannelClose;
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

export { WebRTC };
