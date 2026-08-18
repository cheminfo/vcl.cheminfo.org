import {
  joinBasePath,
  readMountPath,
  stripBasePath,
} from 'react-cheminfo/core';

import { DEFAULT_SITE_URL } from './sitePath.ts';

export { SITE_NAME } from './sitePath.ts';

/**
 * The path this deployment is mounted at: the empty string on a host of its
 * own, `/vcl` as one tool among several on a shared one.
 *
 * It is read off the page, not off the build. Vite writes the assets relative,
 * so the build carries no mount at all; what tells two deployments apart is the
 * `<base>` the container stamps into every page when it starts. One image,
 * built once, therefore serves both addresses, and nothing here writes an
 * address that assumes the site owns the root of its host.
 */
export const BASE_PATH = readMountPath();

/**
 * One of the site's own addresses, as the browser has to write it.
 * @param path - An address from the site's own root.
 * @returns The same address under the mount path.
 */
export function withBase(path: string): string {
  return joinBasePath(BASE_PATH, path);
}

/**
 * The site's own address behind a browser path.
 * @param pathname - What `location.pathname` reads.
 * @returns The address from the site's own root.
 */
export function pathWithoutBase(pathname: string): string {
  return stripBasePath(BASE_PATH, pathname);
}

/**
 * One of the site's addresses written out in full, for a share dialog or a
 * link handed out. The origin comes from the page rather than from the build,
 * so a deployment answering on another host describes itself.
 * @param path - An address from the site's own root.
 * @returns The absolute address.
 */
export function absoluteUrl(path: string): string {
  const origin =
    globalThis.location?.origin ?? new URL(DEFAULT_SITE_URL).origin;
  return `${origin}${withBase(path)}`;
}
