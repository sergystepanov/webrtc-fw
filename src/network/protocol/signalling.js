/**
 * Webrtc signalling module builder.
 *
 * @module network/protocol/signalling
 *
 * @param {Object} [params={}] An optional list of building params.
 * @param {Object} [params.factory] A custom signalling factory.
 * @param {String} [params.factory.url] A server address.
 * @param {Function} [params.factory.onConnect] A post-connection handler callback.
 * @param {Function} [params.factory.onOpen] A post-open handler callback.
 * @param {Function} [params.factory.onClose] A post-close handler callback.
 * @param {Function} [params.factory.onError] A custom error handler callback. Returns an error.
 * @param {Function} [params.factory.onServerError] A server exception handler callback.
 * @param {Function} [params.factory.onMessage] An incoming message handler callback.
 *                                              Returns a message.
 * @param {Function} [params.factory.onOffer] A remote offer handler callback.
 *
 * @typedef {Object} Signalling
 * @property {Function} connect Open new connection to the signaling server.
 * @property {Function} close Close server connection.
 * @property {Function} getUrl Returns the current server URL if implemented.
 * @property {Function} send Sends some data to the signalling server.
 * @property {Function} offerCandidate TBD
 * @property {Function} offerSession TBD
 *
 * @example
 *
 * const signalling = signallingBuilder(
 *    // factory: my-custom-factory-if-needed
 *  )
 *  .url('localhost-maybe')
 *  .onConnect((x) => console.log(x))
 *  .build();
 */
function SignallingBuilder({ factory } = {}) {
  let url;
  let onConnect;
  let onClose;
  let onError;
  let onServerError;
  let onMessage;
  let onOffer;
  let onOpen;

  return {
    url(address) {
      url = address;
      return this;
    },
    onConnect(callback) {
      onConnect = callback;
      return this;
    },
    onClose(callback) {
      onClose = callback;
      return this;
    },
    onError(callback) {
      onError = callback;
      return this;
    },
    onServerError(callback) {
      onServerError = callback;
      return this;
    },
    onMessage(callback) {
      onMessage = callback;
      return this;
    },
    onOffer(callback) {
      onOffer = callback;
      return this;
    },
    onOpen(callback) {
      onOpen = callback;
      return this;
    },
    /**
     * @return {Signalling} Signalling
     */
    build() {
      return factory({
        url,
        onConnect,
        onClose,
        onError,
        onServerError,
        onMessage,
        onOffer,
        onOpen,
      });
    },
  };
}

export default SignallingBuilder;
