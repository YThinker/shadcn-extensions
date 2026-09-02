import { useEffect, useRef, useState } from 'react';
import type { SetStateAction } from 'react';

interface Params<T> {
  prop?: T;
  defaultProp?: T;
  onChange?: (val?: T) => void;
}
export const useFileUploaderControllableState = <T>(state: Params<T>) => {
  const [value, setValue] = useState(state.prop ?? state.defaultProp);
  const valueRef = useRef(state.prop ?? state.defaultProp);
  const isController = useRef(false);

  useEffect(() => {
    if (state.prop !== undefined) isController.current = true;
    if (!isController.current) {
      return;
    }
    setValue(state.prop);
    valueRef.current = state.prop;
  }, [state.prop]);

  const handleValueChange = (updated: SetStateAction<T | undefined>) => {
    let dirty = valueRef.current;
    if (typeof updated === 'function') {
      dirty = (updated as (prev: T | undefined) => T | undefined)(dirty);
    } else {
      dirty = updated;
    }
    setValue(dirty);
    valueRef.current = dirty;
    state.onChange?.(dirty);
  };

  return [value, handleValueChange] as const;
};
