/**
 * Stream module based on the HTML5 Video element.
 *
 * Contains a wrapper for HTML Video element
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video}.
 *
 * @module media/stream
 * @example
 *
 * import Stream from './media/stream'
 *
 * const s = Stream();
 *
 */
export default function ({
  autoplay = true,
  controls = true,
  muted = false,
  preload = 'none',
  volume = 0.1,
} = {}) {
  /** @type HTMLVideoElement */
  let el;

  const render = () => {
    el = document.createElement('video');

    el.autoplay = autoplay;
    el.controls = controls;
    el.muted = muted;
    el.preload = preload;
    el.volume = volume;

    el.classList.add('stream');
    el.innerText = "Your browser doesn't support HTML5 video.";

    return el;
  };

  /**
   * @returns {HTMLVideoElement} An internal HTML5 video element if it is rendered.
   */
  const get = () => el;

  /**
   * Resets (reloads) internal HTML5 video element.
   */
  const reset = () => {
    el.pause();
    el.src = '';
    el.srcObject = undefined;
    el.load();
  };

  /**
   * Attaches stream source to the internal HTML5 video element.
   *
   * @param {MediaStream} stream A stream source to attach.
   */
  const addSource = (stream) => {
    if (el.srcObject !== stream) el.srcObject = stream;
  };

  return Object.freeze({
    addSource,
    get,
    render,
    reset,
  });
}
