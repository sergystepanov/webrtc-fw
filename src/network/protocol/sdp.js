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
const addParamsToCodec = (sdp, name, params) => {
  const values = Object.entries(params)
    .map((x) => `${x[0]}=${x[1]}`)
    .join(';');

  const search = new RegExp(`a=rtpmap:(\\d+) ${name}/`, 'gi');
  const ids = [];
  let found = search.exec(sdp);
  while (found !== null) {
    ids.push(found[1]);
    found = search.exec(sdp);
  }
  let sdpMod = sdp;
  ids.forEach((n) => {
    console.info(`[sdp] mod /${name}/ track #${n}`);
    sdpMod = sdpMod.replace(new RegExp(`(a=fmtp:${n} .*)`), `$1;${values}`);
  });

  return sdpMod;
};

export default addParamsToCodec;
