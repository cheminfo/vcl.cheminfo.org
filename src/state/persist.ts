import { Signal, effect } from '@preact/signals-react';

interface Bucket {
  [key: string]: Signal<unknown> | Bucket;
}

function isSignal(node: Signal<unknown> | Bucket): node is Signal<unknown> {
  return node instanceof Signal;
}

/**
 * Rehydrate a bucket of signals from a single localStorage entry and keep that
 * entry in sync whenever any leaf changes. The whole tree lives under one key,
 * so the stability contract is the property names, not a key string per signal.
 * @param key - localStorage key holding the serialized bucket.
 * @param bucket - Plain object whose leaves are signals. Returned unchanged.
 * @returns The same bucket, so it can be exported directly.
 */
export function persistBucket<T extends Bucket>(key: string, bucket: T): T {
  const stored = read(key);
  if (stored !== null) {
    hydrate(bucket, stored);
  }

  let firstRun = true;
  effect(() => {
    const snapshot = serialize(bucket);
    // The first invocation only subscribes to the leaves; writing then would
    // overwrite storage with the defaults when hydration was skipped.
    if (firstRun) {
      firstRun = false;
      return;
    }
    write(key, snapshot);
  });

  return bucket;
}

function read(key: string): unknown {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or disabled; persistence is best effort.
  }
}

function serialize(bucket: Bucket): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [name, node] of Object.entries(bucket)) {
    result[name] = isSignal(node) ? node.value : serialize(node);
  }
  return result;
}

function hydrate(bucket: Bucket, stored: unknown): void {
  if (typeof stored !== 'object' || stored === null) return;
  const source = stored as Record<string, unknown>;
  for (const [name, node] of Object.entries(bucket)) {
    if (!Object.hasOwn(source, name)) continue;
    const value = source[name];
    if (isSignal(node)) {
      if (value !== undefined) node.value = value;
    } else {
      hydrate(node, value);
    }
  }
}
