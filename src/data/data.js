export function fromJson(data) {
  let result;
  try {
    result = JSON.parse(data);
  } catch (e) {
    console.error('[data] non-parsable JSON', data);
  }

  return result;
}

export function toJson(data) {
  let result;
  try {
    result = JSON.stringify(data);
  } catch (e) {
    console.error('[data] non-convertible JSON', data);
  }

  return result;
}
