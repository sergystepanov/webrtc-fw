import addParamsToCodec from './sdp';

test('if custom video options are set', () => {
  const sdp = `
v=0
o=- 3080139182658193640 2 IN IP4 127.0.0.1
...
a=rtcp:9 IN IP4 0.0.0.0
...
a=ice-ufrag:7Ui6
...
a=rtpmap:11 OPUS/48000/2
a=fmtp:11 minptime=10
a=mid:audio1
a=recvonly
a=rtcp-mux
a=rtpmap:97 OPUS/48000/2
a=fmtp:97 minptime=10;useinbandfec=1
`;

  const moddedSDP = addParamsToCodec(sdp, 'opus', { 'sprop-stereo': 1, stereo: 1 });

  expect(moddedSDP.match(/a=fmtp:11 .*?;sprop-stereo=1;stereo=1/).length).toBe(1);
  expect(moddedSDP.match(/a=fmtp:97 .*?;sprop-stereo=1;stereo=1/).length).toBe(1);
});
