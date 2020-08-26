export default function () {
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
