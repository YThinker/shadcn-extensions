import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { cn } from '@/shadcn/lib/utils';
import { Slot } from 'radix-ui';
import { type VariantProps, cva } from 'class-variance-authority';
import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import { forwardRef, useRef, useMemo, useLayoutEffect } from 'react';

const DATA_TOP_SCROLL = 'data-top-scroll';
const DATA_BOTTOM_SCROLL = 'data-bottom-scroll';
const DATA_LEFT_SCROLL = 'data-left-scroll';
const DATA_RIGHT_SCROLL = 'data-right-scroll';
const DATA_TOP_BOTTOM_SCROLL = 'data-top-bottom-scroll';
const DATA_LEFT_RIGHT_SCROLL = 'data-left-right-scroll';

const scrollerVariants = cva('', {
  variants: {
    orientation: {
      vertical: [
        'overflow-y-auto',
        'data-[top-scroll=true]:[mask-image:linear-gradient(0deg,#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]',
        'data-[bottom-scroll=true]:[mask-image:linear-gradient(180deg,#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]',
        'data-[top-bottom-scroll=true]:[mask-image:linear-gradient(#000,#000,transparent_0,#000_var(--scroll-shadow-size),#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]'
      ],
      horizontal: [
        'overflow-x-auto',
        'data-[left-scroll=true]:[mask-image:linear-gradient(270deg,#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]',
        'data-[right-scroll=true]:[mask-image:linear-gradient(90deg,#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]',
        'data-[left-right-scroll=true]:[mask-image:linear-gradient(to_right,#000,#000,transparent_0,#000_var(--scroll-shadow-size),#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]'
      ]
    },
    hideScrollbar: {
      true: '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      false: ''
    }
  },
  defaultVariants: {
    orientation: 'vertical',
    hideScrollbar: false
  }
});

interface ScrollerProps
  extends VariantProps<typeof scrollerVariants>,
    ComponentPropsWithoutRef<'div'> {
  size?: number;
  offset?: number;
  asChild?: boolean;
  withNavigation?: boolean;
}

const ShadowScroller = forwardRef<HTMLDivElement, ScrollerProps>(
  (props, forwardedRef) => {
    const {
      orientation = 'vertical',
      hideScrollbar,
      className,
      size = 40,
      offset = 0,
      style,
      asChild,
      ...scrollerProps
    } = props;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const composedRef = useComposedRefs(forwardedRef, containerRef);

    useLayoutEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      function onScroll() {
        if (!container) return;

        const isVertical = orientation === 'vertical';

        if (isVertical) {
          const scrollTop = container.scrollTop;
          const clientHeight = container.clientHeight;
          const scrollHeight = container.scrollHeight;

          const hasTopScroll = scrollTop > offset;
          const hasBottomScroll =
            scrollTop + clientHeight + offset < scrollHeight;
          const isVerticallyScrollable = scrollHeight > clientHeight;

          if (hasTopScroll && hasBottomScroll && isVerticallyScrollable) {
            container.setAttribute(DATA_TOP_BOTTOM_SCROLL, 'true');
            container.removeAttribute(DATA_TOP_SCROLL);
            container.removeAttribute(DATA_BOTTOM_SCROLL);
          } else {
            container.removeAttribute(DATA_TOP_BOTTOM_SCROLL);
            if (hasTopScroll) container.setAttribute(DATA_TOP_SCROLL, 'true');
            else container.removeAttribute(DATA_TOP_SCROLL);
            if (hasBottomScroll && isVerticallyScrollable)
              container.setAttribute(DATA_BOTTOM_SCROLL, 'true');
            else container.removeAttribute(DATA_BOTTOM_SCROLL);
          }
        }

        const scrollLeft = container.scrollLeft;
        const clientWidth = container.clientWidth;
        const scrollWidth = container.scrollWidth;

        const hasLeftScroll = scrollLeft > offset;
        const hasRightScroll = scrollLeft + clientWidth + offset < scrollWidth;
        const isHorizontallyScrollable = scrollWidth > clientWidth;

        if (hasLeftScroll && hasRightScroll && isHorizontallyScrollable) {
          container.setAttribute(DATA_LEFT_RIGHT_SCROLL, 'true');
          container.removeAttribute(DATA_LEFT_SCROLL);
          container.removeAttribute(DATA_RIGHT_SCROLL);
        } else {
          container.removeAttribute(DATA_LEFT_RIGHT_SCROLL);
          if (hasLeftScroll) container.setAttribute(DATA_LEFT_SCROLL, 'true');
          else container.removeAttribute(DATA_LEFT_SCROLL);
          if (hasRightScroll && isHorizontallyScrollable)
            container.setAttribute(DATA_RIGHT_SCROLL, 'true');
          else container.removeAttribute(DATA_RIGHT_SCROLL);
        }
      }

      onScroll();
      container.addEventListener('scroll', onScroll);
      window.addEventListener('resize', onScroll);

      return () => {
        container.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      };
    }, [orientation, offset]);

    const composedStyle = useMemo<CSSProperties>(
      () => ({
        '--scroll-shadow-size': `${size}px`,
        ...style
      }),
      [size, style]
    );

    const ScrollerPrimitive = asChild ? Slot.Root : 'div';

    const ScrollerImpl = (
      <ScrollerPrimitive
        data-slot='scroller'
        {...scrollerProps}
        ref={composedRef}
        style={composedStyle}
        className={cn(
          scrollerVariants({ orientation, hideScrollbar, className })
        )}
      />
    );
    return ScrollerImpl;
  }
);
ShadowScroller.displayName = 'ShadowScroller';

export { ShadowScroller };
