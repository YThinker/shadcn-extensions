import { CSSProperties, ReactNode } from 'react';

export type PickerValueType = string | number;
export type PickerModeType = 'normal' | 'cascade';

export interface NormalOptionItem<V extends PickerValueType> {
  label: ReactNode;
  value: V;
}
export interface CascadeOptionItem<V extends PickerValueType> {
  label: ReactNode;
  value: V;
  children?: CascadeOptionItem<V>[];
}

export interface PickerItemProps<
  V extends PickerValueType,
  M extends PickerModeType
> {
  mode?: M;
  options?: NormalOptionItem<V>[];
  value?: V;
  onValueChange?: (
    val: V,
    selectedOptions: M extends 'cascade'
      ? CascadeOptionItem<V>
      : NormalOptionItem<V>
  ) => void;
  label?: ReactNode;
  loop?: boolean;
}

export interface CascadePickerViewProps<V extends PickerValueType> {
  className?: string;
  style?: CSSProperties;
  mode: 'cascade';
  options: CascadeOptionItem<V>[];
  defaultValue?: V[];
  value?: V[];
  onValueChange?: (val: V[], selectedOptions: CascadeOptionItem<V>[]) => void;
  loop?: boolean;
  itemLabels?: string[];
}

export interface NormalPickerViewProps<V extends PickerValueType> {
  className?: string;
  style?: CSSProperties;
  mode?: 'normal';
  options?: NormalOptionItem<V>[][] | PickerValueType[][];
  defaultValue?: V[];
  value?: V[];
  onValueChange?: (val: V[], selectedOptions: NormalOptionItem<V>[]) => void;
  loop?: boolean;
  itemLabels?: string[];
}
