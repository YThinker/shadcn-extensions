import type { UIEvent } from 'react';

export function stopPropagation(event: UIEvent): void {
  event.stopPropagation();
}

export function preventDefault(
  event: UIEvent,
  isStopPropagation?: boolean
): void {
  if (typeof event.cancelable !== 'boolean' || event.cancelable) {
    event.preventDefault();
  }

  if (isStopPropagation) {
    stopPropagation(event);
  }
}

function isWindow(val: unknown): val is Window {
  return val === window;
}
interface Rect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}
export const getRect = (elementRef: Element | Window): Rect => {
  const element = elementRef;

  if (isWindow(element)) {
    const width = element.innerWidth;
    const height = element.innerHeight;

    return {
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      width,
      height
    };
  }

  if (element && element.getBoundingClientRect) {
    return element.getBoundingClientRect();
  }

  return {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0
  };
};
