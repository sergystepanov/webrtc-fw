export default function pubsub() {
  const subs = new Set();

  const sub = (fn) => {
    subs.add(fn);

    return () => subs.delete(fn);
  };

  const pub = (data) => subs.forEach((fn) => fn(data));

  return Object.freeze({
    pub,
    sub,
  });
}
