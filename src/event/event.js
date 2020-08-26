import pubsub from './pubsub';

const event = (() => {
  const events = new Map();

  const on = (name, fn) => {
    if (!events.has(name)) events.set(name, pubsub());

    return events.get(name).sub(fn);
  };

  const emit = (name, data) => events.has(name) && events.get(name).pub(data);

  return Object.freeze({
    on,
    emit,
  });
})();

export default event;

export const EVENT_ERROR = 'event.error';
