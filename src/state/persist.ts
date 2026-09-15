import { Signal, effect } from '@preact/signals-react';
import { persistBucket as storageBucket } from 'react-cheminfo/core';

interface Bucket {
  [key: string]: Signal<unknown> | Bucket;
}

/**
 * Rehydrate a bucket of signals from a single localStorage entry and keep that
 * entry in sync whenever any leaf changes. The whole tree lives under one key,
 * so the stability contract is the property names, not a key string per signal.
 * @param key - Name of the bucket; the version is appended to it.
 * @param bucket - Plain object whose leaves are signals. Returned unchanged.
 * @returns The same bucket, so it can be exported directly.
 */
export function persistBucket<T extends Bucket>(key: string, bucket: T): T {
  const storage = storageBucket<Record<string, unknown>>({
    key,
    defaults: serialize(bucket),
  });

  const stored = storage.read();
  if (!stored.firstRun) hydrate(bucket, stored.value);

  let firstRun = true;
  effect(() => {
    const snapshot = serialize(bucket);
    // The first invocation only subscribes to the leaves; writing then would
    // overwrite storage with the defaults when hydration was skipped.
    if (firstRun) {
      firstRun = false;
      return;
    }
    storage.write(snapshot);
  });

  return bucket;
}

function isSignal(node: Signal<unknown> | Bucket): node is Signal<unknown> {
  return node instanceof Signal;
}

function serialize(bucket: Bucket): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [name, node] of Object.entries(bucket)) {
    result[name] = isSignal(node) ? node.value : serialize(node);
  }
  return result;
}

function hydrate(bucket: Bucket, stored: Record<string, unknown>): void {
  for (const [name, node] of Object.entries(bucket)) {
    const value = stored[name];
    if (value === undefined) continue;
    if (isSignal(node)) {
      node.value = value;
    } else if (typeof value === 'object' && value !== null) {
      hydrate(node, value as Record<string, unknown>);
    }
  }
}
