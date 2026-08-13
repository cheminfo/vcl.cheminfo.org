import type { KeyboardEvent } from 'react';

/**
 * Tell whether a key event is the keyboard equivalent of clicking, so a row that
 * is not a `<button>` can still be operated without a mouse.
 * @param event - Key event received by the clickable element.
 * @returns `true` for Enter and Space.
 */
export function isActivationKey(event: KeyboardEvent<HTMLElement>): boolean {
  return event.key === 'Enter' || event.key === ' ';
}
