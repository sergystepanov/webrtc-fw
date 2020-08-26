/**
 * Webrtc signalling module builder.
 *
 * @module network/signalling
 *
 * @param {Object} [params={}] An optional list of building params.
 * @param {Object} [params.factory] A custom signalling factory.
 * @param {String} [params.factory.url] A server address.
 * @param {Function} [params.factory.onConnect] A post-connection handler callback.
 * @param {Function} [params.factory.onOpen] A post-open handler callback.
 * @param {Function} [params.factory.onClose] A post-close handler callback.
 * @param {Function} [params.factory.onError] A custom error handler callback. Returns an error.
 * @param {Function} [params.factory.onServerError] A server exception handler callback.
 * @param {Function} [params.factory.onMessage] An incoming message handler callback. Returns a message.
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
export default function signallingBuilder({ factory } = {}) {
  let url, onConnect, onClose, onError, onServerError, onMessage, onOffer, onOpen;

  return {
    url: function (address) {
      url = address;
      return this;
    },
    onConnect: function (callback) {
      onConnect = callback;
      return this;
    },
    onClose: function (callback) {
      onClose = callback;
      return this;
    },
    onError: function (callback) {
      onError = callback;
      return this;
    },
    onServerError: function (callback) {
      onServerError = callback;
      return this;
    },
    onMessage: function (callback) {
      onMessage = callback;
      return this;
    },
    onOffer: function (callback) {
      onOffer = callback;
      return this;
    },
    onOpen: function (callback) {
      onOpen = callback;
      return this;
    },
    /**
     * @return {Signalling} Signalling
     */
    build: function () {
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
