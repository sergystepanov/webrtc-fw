/**
 * User media module based on MediaDevices media stream.
 *
 * Contains a wrapper for user's media streams.
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia}.
 *
 * @module media/user/userMedia
 *
 * @param {Object} [params={}] An optional list of params.
 * @param {Object} [params.constraints] Custom media constraints.
 * @param {boolean} [params.constraints.video] Enables user's video.
 * @param {boolean} [params.constraints.audio] Enables user's audio.
 * @param {Function} [params.onNotSupported] A callback when user media is not supported.
 * @param {Function} [params.onError] A post-error handler callback.
 */
function UserMedia({ constraints = { video: true, audio: true }, onNotSupported, onError } = {}) {
  const supported = !!navigator.mediaDevices.getUserMedia;
  let stream;

  if (!supported) onNotSupported?.();

  const getStream = async () => {
    if (!supported) return Promise.reject();

    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      onError?.(e);
      return Promise.reject();
    }

    return stream;
  };

  const stop = () => {
    if (!supported) return;

    // Release user's media devices
    stream?.getTracks().forEach((track) => {
      track.stop();
    });
  };

  return Object.freeze({
    getStream,
    stop,
  });
}

export default UserMedia;
