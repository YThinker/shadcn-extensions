import { EmblaCarouselType } from 'embla-carousel';

export const WHEEL_ITEM_SIZE = 32;
export const CIRCLE_DEGREES = 360;
export const WHEEL_ITEM_COUNT = 18;
export const WHEEL_ITEMS_IN_VIEW = 4;

export const WHEEL_ITEM_RADIUS = CIRCLE_DEGREES / WHEEL_ITEM_COUNT;
export const IN_VIEW_DEGREES = WHEEL_ITEM_RADIUS * WHEEL_ITEMS_IN_VIEW;
export const WHEEL_RADIUS = Math.round(
  WHEEL_ITEM_SIZE / 2 / Math.tan(Math.PI / WHEEL_ITEM_COUNT)
);

export const setContainerStyles = (
  emblaApi: EmblaCarouselType,
  wheelRotation: number
) => {
  emblaApi.containerNode().style.transform = `translateZ(${WHEEL_RADIUS}px) rotateX(${wheelRotation}deg)`;
};

export const isInView = (wheelLocation: number, slidePosition: number) =>
  Math.abs(wheelLocation - slidePosition) < IN_VIEW_DEGREES;

export const setSlideStyles = (
  emblaApi: EmblaCarouselType,
  index: number,
  loop: boolean,
  slideCount: number,
  totalRadius: number
) => {
  const slideNode = emblaApi.slideNodes()[index];
  const wheelLocation = emblaApi.scrollProgress() * totalRadius;
  const positionDefault = emblaApi.scrollSnapList()[index] * totalRadius;
  const positionLoopStart = positionDefault + totalRadius;
  const positionLoopEnd = positionDefault - totalRadius;

  let inView = false;
  let angle = index * -WHEEL_ITEM_RADIUS;

  if (isInView(wheelLocation, positionDefault)) {
    inView = true;
  }

  if (loop && isInView(wheelLocation, positionLoopEnd)) {
    inView = true;
    angle = -CIRCLE_DEGREES + (slideCount - index) * WHEEL_ITEM_RADIUS;
  }

  if (loop && isInView(wheelLocation, positionLoopStart)) {
    inView = true;
    angle = -(totalRadius % CIRCLE_DEGREES) - index * WHEEL_ITEM_RADIUS;
  }

  if (inView) {
    slideNode.style.opacity = '1';
    slideNode.style.transform = `translateY(-${
      index * 100
    }%) rotateX(${angle}deg) translateZ(${WHEEL_RADIUS}px)`;
  } else {
    slideNode.style.opacity = '0';
    slideNode.style.transform = 'none';
  }
};
