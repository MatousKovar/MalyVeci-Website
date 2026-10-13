let queue = Promise.resolve();

export function runLocalEventMutation(mutation) {
  const result = queue.then(mutation, mutation);
  queue = result.then(() => undefined, () => undefined);
  return result;
}
