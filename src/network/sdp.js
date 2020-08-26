/**
 * Adds stereo params for provided SDP codec.
 *
 * a=rtpmap:xx OPUS/48000/2
 *
 * @param {string} sdp The text representation of SDP.
 * @param {string} name A search case insensitive codec (e.g. opus).
 * @param {Object} params A map of params to add (e.g. {key: 'value'}).
 *
 * @example
 *
 * // let sdp = 'some sdp string'
 * sdp = addParamsToCodec(sdp, 'opus', {stereo: 1})
 */
export const addParamsToCodec = (sdp, name, params) => {
  const _params = Object.entries(params)
    .map((x) => `${x[0]}=${x[1]}`)
    .join(';');

  let search = new RegExp(`a=rtpmap:(\\d+) ${name}/`, 'gi');
  let found;
  let ids = [];
  while ((found = search.exec(sdp)) !== null) {
    ids.push(found[1]);
  }
  ids.forEach((n) => {
    console.info(`[sdp] mod /${name}/ track #${n}`);
    sdp = sdp.replace(new RegExp(`(a=fmtp:${n} .*)`), `$1;${_params}`);
  });

  return sdp;
};
