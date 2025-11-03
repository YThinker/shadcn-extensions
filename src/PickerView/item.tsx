import { useEffect, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { EmblaCarouselType } from 'embla-carousel';
import {
  setContainerStyles,
  setSlideStyles,
  WHEEL_ITEM_RADIUS,
  WHEEL_ITEM_SIZE
} from './utils';
import {
  CascadeOptionItem,
  PickerModeType,
  NormalOptionItem,
  PickerItemProps,
  PickerValueType
} from './types';
import { cn } from '@/shadcn/lib/utils';
import { useLatest, useMemoizedFn } from 'ahooks';

export const PickerItem = <V extends PickerValueType, M extends PickerModeType>(
  props: PickerItemProps<V, M>
) => {
  const {
    options,
    value,
    perspective,
    label,
    loop = false,
    onValueChange
  } = props;
  const optionsLatest = useLatest(options);
  const slideCount = options?.length ?? 0;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop,
      axis: 'y',
      dragFree: true,
      containScroll: false,
      watchSlides: false
    },
    [WheelGesturesPlugin()]
  );
  const rootNodeRef = useRef(null);
  const totalRadius = slideCount * WHEEL_ITEM_RADIUS;
  const rotationOffset = loop ? 0 : WHEEL_ITEM_RADIUS;

  const inactivateEmblaTransform = useMemoizedFn(
    (emblaApi: EmblaCarouselType) => {
      if (!emblaApi) return;
      const { translate, slideLooper } = emblaApi.internalEngine();
      translate.clear();
      translate.toggleActive(false);
      slideLooper.loopPoints.forEach(({ translate }) => {
        translate.clear();
        translate.toggleActive(false);
      });
    }
  );

  const rotateWheel = useMemoizedFn((emblaApi: EmblaCarouselType) => {
    const rotation = slideCount * WHEEL_ITEM_RADIUS - rotationOffset;
    const wheelRotation = rotation * emblaApi.scrollProgress();
    setContainerStyles(emblaApi, wheelRotation);
    emblaApi.slideNodes().forEach((_, index) => {
      setSlideStyles(emblaApi, index, loop, slideCount, totalRadius);
    });
  });

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on('pointerUp', (emblaApi) => {
      const { scrollTo, target, location } = emblaApi.internalEngine();
      const diffToTarget = target.get() - location.get();
      const factor = Math.abs(diffToTarget) < WHEEL_ITEM_SIZE / 2.5 ? 10 : 0.1;
      const distance = diffToTarget * factor;
      scrollTo.distance(distance, true);
    });

    emblaApi.on('scroll', rotateWheel);

    emblaApi.on('select', () => {
      if (!optionsLatest.current?.length) {
        return;
      }
      const index = emblaApi.selectedScrollSnap();
      const item = optionsLatest.current[index];
      onValueChange?.(
        item.value,
        item as M extends 'cascade' ? CascadeOptionItem<V> : NormalOptionItem<V>
      );
    });

    emblaApi.on('reInit', (emblaApi) => {
      inactivateEmblaTransform(emblaApi);
      rotateWheel(emblaApi);
    });

    inactivateEmblaTransform(emblaApi);
    rotateWheel(emblaApi);
  }, [emblaApi, inactivateEmblaTransform, rotateWheel]);

  useEffect(() => {
    if (!optionsLatest.current?.length || !emblaApi) {
      return;
    }
    const index = optionsLatest.current.findIndex(
      (item) => item.value === value
    );
    emblaApi?.scrollTo(index === -1 ? 0 : index);
  }, [emblaApi, value]);

  return (
    <div className='flex h-full flex-1 items-center justify-center gap-1 leading-none'>
      <div
        className='flex h-full flex-1 touch-pan-x items-center overflow-hidden'
        ref={rootNodeRef}
      >
        <div
          className={cn(
            'h-8 w-full select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [perspective:1000px]',
            perspective === 'left'
              ? 'translate-x-7 [perspective-origin:calc(50%+130px)_50%]'
              : '-translate-x-7 [perspective-origin:calc(50%-130px)_50%]'
          )}
          ref={emblaRef}
        >
          <div className='size-full will-change-transform [transform-style:preserve-3d]'>
            {options?.map((item, index) => (
              <button
                className='size-full opacity-0 [backface-visibility:hidden]'
                key={item.value}
                onClick={() => emblaApi?.scrollTo(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {!!label && <div className='pointer-events-none'>{label}</div>}
    </div>
  );
};
