import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
  type TouchEvent
} from 'react';
import type {
  SwipeCellInstance,
  SwipeCellPosition,
  SwipeActionProps,
  SwipeCellSide
} from './types';
import { preventDefault, getRect } from './utils';
import isNil from 'lodash/isNil';
import clamp from 'lodash/clamp';
import { useTouch } from './hooks';
import { useClickAway, useEventListener } from 'ahooks';
import { cn } from '@/shadcn/lib/utils';
import { callPromiseInterceptor } from '@/util';

/** 查看 react-vant */
const SwipeCell = forwardRef<SwipeCellInstance, SwipeActionProps>(
  ({ closeOnTouchOutside = true, ...props }, instanceRef) => {
    const opened = useRef(false);
    const lockClick = useRef(false);
    const lockClose = useRef(false);
    const startOffset = useRef(0);
    const moveOffset = useRef(0);

    const [dragging, setDragging] = useState(false);

    const [actionWidth, setActionWidth] = useState({
      left: 0,
      right: 0
    });

    const wrapper = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);

    const getWidthByNode = (node: Element) => (node ? getRect(node).width : 0);

    const leftRef = useCallback(
      (node: HTMLDivElement) => {
        if (node !== null) {
          setActionWidth((v) => ({ ...v, left: getWidthByNode(node) }));
        }
      },
      [props.leftActions]
    );
    const rightRef = useCallback(
      (node: HTMLDivElement) => {
        if (node !== null) {
          setActionWidth((v) => ({ ...v, right: getWidthByNode(node) }));
        }
      },
      [props.rightActions]
    );

    const touch = useTouch();

    const leftWidth = useMemo(
      () => (!isNil(props.leftWidth) ? +props.leftWidth : actionWidth.left),
      [props.leftWidth, actionWidth.left]
    );

    const rightWidth = useMemo(
      () => (!isNil(props.rightWidth) ? +props.rightWidth : actionWidth.right),
      [props.rightWidth, actionWidth.right]
    );

    const renderWrapperOffset = (offset: number) => {
      if (!content.current) {
        return;
      }
      moveOffset.current = offset;
      content.current.style.transform = `translate3d(${offset}px, 0, 0)`;
    };

    const open = (side: SwipeCellSide) => {
      opened.current = true;
      const offset = side === 'left' ? leftWidth : -rightWidth;
      props.onOpenChange?.(true, { openPosition: side });
      renderWrapperOffset(offset);
      setDragging(false);
    };

    const close = (closeTrigger: SwipeCellPosition) => {
      if (lockClose.current) {
        return;
      }
      if (opened.current) {
        opened.current = false;
        props.onOpenChange?.(false, { closeTrigger });
      }
      renderWrapperOffset(0);
      setDragging(false);
    };

    const toggle = (side: SwipeCellSide) => {
      const offset = Math.abs(moveOffset.current);
      const THRESHOLD = 0.3;
      const threshold = opened.current ? 1 - THRESHOLD : THRESHOLD;
      const width = side === 'left' ? leftWidth : rightWidth;

      if (width && offset > width * threshold) {
        open(side);
      } else {
        close(side);
      }
    };

    const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
      if (!props.disabled) {
        startOffset.current = moveOffset.current;
        touch.start(event);
      }
    };

    const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
      if (props.disabled || !content.current) {
        return;
      }

      if (!dragging) {
        setDragging(true);
      }

      touch.move(event);

      if (touch.isHorizontal()) {
        lockClick.current = true;
        const isEdge =
          !opened.current || touch.deltaX.current * startOffset.current < 0;
        if (isEdge) {
          preventDefault(event, props.stopPropagation);
        }

        renderWrapperOffset(
          clamp(
            touch.deltaX.current + startOffset.current,
            -rightWidth,
            leftWidth
          )
        );
      }
    };

    const onTouchEnd = () => {
      if (dragging) {
        setDragging(false);
        toggle(moveOffset.current > 0 ? 'left' : 'right');

        // compatible with desktop scenario
        setTimeout(() => {
          lockClick.current = false;
        }, 0);
      }
    };

    const renderSideContent = (
      side: SwipeCellSide,
      measuredRef: Ref<HTMLDivElement>
    ) => {
      const actions = side === 'left' ? props.leftActions : props.rightActions;
      if (actions) {
        return (
          <div
            ref={measuredRef}
            className={cn(
              'absolute top-0 h-full',
              side === 'left' && 'left-0 -translate-x-full',
              side === 'right' && 'right-0 translate-x-full'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {actions.map(({ key, className, onClick, ...buttonProps }) => (
              <button
                key={key}
                className={cn(
                  'inline-flex h-full items-center justify-center disabled:pointer-events-none disabled:opacity-60',
                  className
                )}
                onClick={(e) => {
                  if (buttonProps.disabled) {
                    return;
                  }
                  if (opened.current && !lockClick.current) {
                    onClick?.(e);
                    callPromiseInterceptor({
                      interceptor: () => props.onAction?.(key, e),
                      onPromiseBefore: () => (lockClose.current = true),
                      onPromiseFinally: () => (lockClose.current = false),
                      onFullfilled: () => {
                        lockClose.current = false;
                        close(side);
                      }
                    });
                  }
                }}
                {...buttonProps}
              />
            ))}
          </div>
        );
      }
      return null;
    };

    useClickAway(
      () => (closeOnTouchOutside ? close('outside') : void 0),
      wrapper,
      'touchstart'
    );

    useImperativeHandle(instanceRef, () => ({
      open,
      close: () => close('outside')
    }));

    useEventListener('touchmove', onTouchMove, {
      target: wrapper.current
    });

    return (
      <div
        ref={wrapper}
        className={cn(
          'relative cursor-grab overflow-hidden',
          props.wrapperClassName
        )}
        style={props.wrapperStyle}
        onClick={(e) => {
          if (!lockClick.current) props.onClick?.(e);
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div
          ref={content}
          className={cn(
            'transition-transform duration-500 ease-in-out',
            dragging && 'duration-20 pointer-events-none ease-linear',
            props.className
          )}
          style={props.style}
        >
          {renderSideContent('left', leftRef)}
          {props.children}
          {renderSideContent('right', rightRef)}
        </div>
      </div>
    );
  }
);
SwipeCell.displayName = 'SwipeCell';

export default SwipeCell;
