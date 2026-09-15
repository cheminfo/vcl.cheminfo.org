import type { ShareConfig, ShareVocabulary } from 'react-cheminfo/core';
import { parseShareConfig } from 'react-cheminfo/core';

/**
 * What a link to this site can say beyond the page it names. No part of the
 * builder can be switched off yet, so only `?embed` does anything.
 */
export const SHARE_VOCABULARY: ShareVocabulary = { parts: [] };

/**
 * The configuration of the page currently open, read once from the address it
 * was opened with.
 */
export const shareConfig: ShareConfig = parseShareConfig(
  globalThis.location?.search ?? '',
  SHARE_VOCABULARY,
);

/**
 * Whether the page is framed by another site, in which case the header, the
 * tagline and the footer are left out and the tool takes the whole frame.
 * @returns True when the address asks for embed mode.
 */
export function isEmbedded(): boolean {
  return shareConfig.embed;
}
