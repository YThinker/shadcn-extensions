import { useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
// import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import {
  CascadeOptionItem,
  PickerModeType,
  NormalOptionItem,
  PickerItemProps,
  PickerValueType
} from './types';
import { useMemoizedFn } from 'ahooks';

export const PickerItem = <V extends PickerValueType, M extends PickerModeType>(
  props: PickerItemProps<V, M>
) => {
  const { options, value, label, loop = false, onValueChange } = props;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop,
      axis: 'y',
      dragFree: true,
      containScroll: false,
      watchSlides: false
    }
    // [WheelGesturesPlugin()]
  );

  const handleSelect = useMemoizedFn(() => {
    if (!options?.length) {
      return;
    }
    const index = emblaApi.selectedScrollSnap();
    const item = options[index];
    onValueChange?.(
      item.value,
      item as M extends 'cascade' ? CascadeOptionItem<V> : NormalOptionItem<V>
    );
  });

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', handleSelect);
  }, [emblaApi]);

  useEffect(() => {
    if (!options?.length || !emblaApi) {
      return;
    }
    const index = options.findIndex((item) => item.value === value);
    /** 外部value引起变更，不触发onValueChange */
    emblaApi.off('select', handleSelect);
    emblaApi.scrollTo(index === -1 ? 0 : index);
    emblaApi.on('select', handleSelect);
  }, [emblaApi, value]);

  useEffect(() => {
    if (!options?.length || !emblaApi) {
      return;
    }
    const matchOption = options.find((item) => item.value === value);
    /** 当options变更后，当前value无法找到匹配项，主动触发onValueChange */
    if (!matchOption) {
      if (emblaApi.selectedScrollSnap() === 0) {
        onValueChange(options[0].value, options[0]);
      } else {
        emblaApi.scrollTo(0);
      }
    }
  }, [emblaApi, options]);

  return (
    <div className='flex h-full flex-1 items-center justify-center gap-1 leading-none'>
      <div className='h-full flex-1 overflow-hidden' ref={emblaRef}>
        <div className='size-full select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]'>
          {options?.map((item, index) => (
            <button
              className='line-clamp-2 block h-8 w-full shrink-0'
              key={item.value}
              onClick={() => emblaApi?.scrollTo(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {!!label && <div className='pointer-events-none'>{label}</div>}
    </div>
  );
};
