/**
 * User media module based on MediaDevices media stream.
 *
 * Contains a wrapper for user's media streams.
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia}.
 *
 * @module media/user
 * @example
 *
 * import UserMedia from './media/user'
 *
 * const um = UserMedia();
 *
 */
export default function ({
  constraints = { video: true, audio: true },
  onNotSupported,
  onError,
} = {}) {
  let supported = !!navigator.mediaDevices.getUserMedia;
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

    // Release the webcam and mic
    stream?.getTracks().forEach(function (track) {
      track.stop();
    });
  };

  return Object.freeze({
    getStream,
    stop,
  });
}
