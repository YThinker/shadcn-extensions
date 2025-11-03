export function getDecimalPrecision(num: number) {
  const decimalPart = num.toString().split('.')[1];
  return decimalPart ? decimalPart.length : 0;
}

export function roundValueToPrecision(value: number, precision: number) {
  if (value == null) {
    return value;
  }

  const nearest = Math.round(value / precision) * precision;
  return Number(nearest.toFixed(getDecimalPrecision(precision)));
}

// export function isFocusVisible(element: HTMLElement) {
//   return element.matches(':focus-visible');
// }
