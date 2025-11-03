import { useControllableValue, useMemoizedFn } from 'ahooks';
import { PickerItem } from './item';
import {
  CascadeOptionItem,
  CascadePickerViewProps,
  NormalOptionItem,
  NormalPickerViewProps,
  PickerValueType
} from './types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import { cn } from '@/shadcn/lib/utils';

function PickerView<V extends PickerValueType>({
  className,
  style,
  mode = 'normal',
  options,
  loop,
  itemLabels,
  ...props
}: CascadePickerViewProps<V> | NormalPickerViewProps<V>) {
  const { onValueChange } = props;
  const [value] = useControllableValue<V[]>(props, {
    trigger: 'onValueChange'
  });

  const changeIndex = useRef<number>(0);

  const [innerValue, setInnerValue] = useState(value);
  const [innerOptions, setInnerOptions] = useState<CascadeOptionItem<V>[][]>(
    []
  );

  const formatCascadeOptions = useCallback(
    (options: CascadeOptionItem<V>[], value: PickerValueType[]) => {
      if (mode !== 'cascade' || !options?.length) {
        return [];
      }
      const formatted: CascadeOptionItem<V>[][] = [];
      let columnOptions: CascadeOptionItem<V> = {
        label: '',
        value: null,
        children: options
      };
      let columnIndex = 0;
      while (columnOptions && columnOptions.children) {
        const currentOptions: CascadeOptionItem<V>[] = columnOptions.children;
        formatted.push(currentOptions);

        const currentValue = value?.[columnIndex];
        if (currentValue === 0) {
          // 如果 currentValue 为 0，返回第一个 children
          columnOptions = currentOptions[0];
        } else if (currentValue) {
          // 如果 currentValue 存在，查找匹配的项
          const index = currentOptions.findIndex(
            (columnItem: CascadeOptionItem<V>) =>
              columnItem.value === currentValue
          );
          columnOptions = currentOptions[index === -1 ? 0 : index]; // 如果未找到，默认取第一个
        } else {
          break; // 如果 currentValue 不存在，终止循环
        }

        columnIndex++;
      }
      return formatted;
    },
    [mode]
  );

  const formatOptions = useMemo(() => {
    if (mode === 'cascade') {
      return formatCascadeOptions(
        options as CascadeOptionItem<V>[],
        innerValue
      );
    } else if (typeof options[0][0] !== 'object') {
      return options.map((col) =>
        col.map((item) => ({
          label: item,
          value: item
        }))
      );
    }
    return options as NormalOptionItem<V>[][];
  }, [mode, options, formatCascadeOptions, innerValue]);

  useEffect(() => {
    if (Array.isArray(options) && options.length && options !== innerOptions) {
      setInnerOptions(formatOptions as CascadeOptionItem<V>[][]);
    }
  }, [options, innerValue]);

  const handleSelect = useMemoizedFn(
    (option: CascadeOptionItem<V>, index: number) => {
      const newValue = option?.value;
      if (isEmpty(newValue) || innerValue[index] === newValue) return;
      changeIndex.current = index;
      if (mode === 'cascade') {
        const startIndex = index;
        const values: V[] = [];
        values[index] = option.value;
        while (option?.children?.[0]) {
          values[index + 1] = option.children[0].value;
          index++;
          option = option.children[0];
        }
        // 当前改变列的下一列 children 值为空
        if (option?.children?.length) {
          values.splice(index + 1, values.length - index - 1);
        }
        const combineResult = [
          ...innerValue.slice(0, startIndex),
          ...values.splice(startIndex)
        ];
        setInnerValue([...combineResult]);
        const tempFormated = formatCascadeOptions(
          options as CascadeOptionItem<V>[],
          combineResult
        );
        if (!isEqual(tempFormated, innerOptions)) {
          setInnerOptions(tempFormated);
        }
      } else {
        setInnerValue((prev) => {
          const next = [...prev];
          next[index] = newValue;
          return next;
        });
      }
    }
  );

  const selectedOptions = useMemo(() => {
    return innerOptions.reduce((sum, columnOptions, index) => {
      const selectedOption = columnOptions.find(
        (item) => item.value === innerValue[index]
      );
      sum.push(selectedOption ?? null);
      return sum;
    }, []);
  }, [innerOptions, innerValue]);

  useEffect(() => {
    onValueChange?.(innerValue, selectedOptions);
  }, [innerValue, selectedOptions, onValueChange]);

  return (
    <div
      style={style}
      className={cn(
        'relative flex h-52 w-full text-base',
        'before:border-divide after:border-divide before:pointer-events-none before:absolute before:-top-px before:left-0 before:right-0 before:z-10 before:block before:h-[calc(50%-32px/2)] before:border-b after:pointer-events-none after:absolute after:bottom-px after:left-0 after:right-0 after:block after:h-[calc(50%-32px/2)] after:border-t',
        '[mask-image:linear-gradient(#000,#000,transparent_0,#000_88px,#000_calc(100%-88px),transparent)]',
        className
      )}
    >
      {formatOptions.map((optionItem, index) => (
        <PickerItem
          key={index}
          mode={mode}
          options={optionItem}
          loop={loop}
          label={itemLabels?.[index]}
          value={value[index]}
          onValueChange={(_, selectedOptions) => {
            handleSelect(selectedOptions, index);
          }}
        />
      ))}
    </div>
  );
}

export default PickerView;
