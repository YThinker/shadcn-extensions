'use client';

import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva } from 'class-variance-authority';
import type {
  StepperStatus,
  StepperContextValue,
  StepperItemContextValue,
  StepperItemProps,
  StepperTrackProps,
  StepperConnectorProps,
  StepperMarkerProps,
  StepperContentProps,
  StepperMarkerVariant,
  StepperMarkerSize,
  StepperOrientation,
  StepperProps
} from './stepper.types';
import { cn } from '@/shadcn/lib/utils';

// ==================== Constants ====================

const STATUS_COLOR_MAP: Record<StepperStatus, string> = {
  current: 'bg-info-green-foreground border-info-green-foreground',
  completed: 'bg-info-green-foreground border-info-green-foreground',
  error: 'bg-info-red-foreground border-info-red-foreground',
  upcoming: 'bg-main-3 border-main-3',
  default: 'bg-main-3 border-main-3'
};

// ==================== Helpers ====================

function getStatusColor(status: StepperStatus): string {
  return STATUS_COLOR_MAP[status];
}

const markerVariants = cva(
  'relative z-10 flex items-center justify-center rounded-full border',
  {
    variants: {
      size: {
        default: 'size-3',
        sm: 'size-2',
        lg: 'size-4',
        icon: 'size-8'
      },
      variant: {
        default: '',
        outline: 'bg-white',
        ghost: 'border-transparent'
      }
    },
    defaultVariants: {
      size: 'default',
      variant: 'default'
    }
  }
);

// ==================== Context ====================

const StepperContext = React.createContext<StepperContextValue>({
  orientation: 'vertical'
});

function useStepperContext() {
  return React.useContext(StepperContext);
}

const StepperItemContext = React.createContext<StepperItemContextValue>({
  status: 'default'
});

function useStepperItemContext() {
  return React.useContext(StepperItemContext);
}

// ==================== Stepper Root ====================

const Root = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ orientation = 'vertical', className, asChild, ...rest }, ref) => {
    const Component = asChild ? Slot.Slot : 'div';

    return (
      <StepperContext.Provider value={{ orientation }}>
        <Component
          ref={ref}
          className={cn(
            orientation === 'vertical'
              ? 'flex flex-col'
              : 'flex w-full flex-row',
            className
          )}
          {...rest}
        />
      </StepperContext.Provider>
    );
  }
);

Root.displayName = 'StepperRoot';

// ==================== Stepper Item ====================

const Item = React.forwardRef<HTMLDivElement, StepperItemProps>(
  ({ status = 'default', className, asChild, ...rest }, ref) => {
    const { orientation } = useStepperContext();
    const Component = asChild ? Slot.Slot : 'div';

    return (
      <StepperItemContext.Provider value={{ status }}>
        <Component
          ref={ref}
          className={cn(
            'relative',
            orientation === 'vertical'
              ? 'flex flex-row items-stretch'
              : 'flex flex-1 flex-col',
            className
          )}
          {...rest}
        />
      </StepperItemContext.Provider>
    );
  }
);

Item.displayName = 'StepperItem';

// ==================== Stepper Track ====================

const Track = React.forwardRef<HTMLDivElement, StepperTrackProps>(
  ({ className, asChild, ...rest }, ref) => {
    const { orientation } = useStepperContext();
    const Component = asChild ? Slot.Slot : 'div';

    return (
      <Component
        ref={ref}
        className={cn(
          'relative',
          orientation === 'vertical'
            ? 'flex flex-col items-center'
            : 'flex w-full flex-row items-center justify-center',
          className
        )}
        {...rest}
      />
    );
  }
);

Track.displayName = 'StepperTrack';

// ==================== Stepper Connector ====================

const Connector = React.forwardRef<HTMLDivElement, StepperConnectorProps>(
  ({ variant = 'solid', className, asChild, ...rest }, ref) => {
    const { orientation } = useStepperContext();

    const baseClassName = cn(
      'flex-1 overflow-hidden border border-divide',
      variant === 'dashed' ? 'border-dashed' : 'border-solid',
      orientation === 'vertical'
        ? 'w-0'
        : 'absolute left-1/2 top-1/2 h-0 w-full -translate-y-1/2',
      className
    );

    const Component = asChild ? Slot.Slot : 'div';

    return <Component ref={ref} className={baseClassName} {...rest} />;
  }
);

Connector.displayName = 'StepperConnector';

// ==================== Stepper Marker ====================

const Marker = React.forwardRef<HTMLDivElement, StepperMarkerProps>(
  (
    { variant = 'default', size = 'default', className, asChild, ...rest },
    ref
  ) => {
    const { status } = useStepperItemContext();
    const color = getStatusColor(status);

    const Component = asChild ? Slot.Slot : 'div';

    return (
      <Component
        ref={ref}
        className={cn(color, markerVariants({ size, variant }), className)}
        {...rest}
      />
    );
  }
);

Marker.displayName = 'StepperMarker';

// ==================== Stepper Content ====================

const Content = React.forwardRef<HTMLDivElement, StepperContentProps>(
  ({ className, asChild, ...rest }, ref) => {
    const { orientation } = useStepperContext();
    const Component = asChild ? Slot.Slot : 'div';

    return (
      <Component
        ref={ref}
        className={cn(
          orientation === 'vertical'
            ? 'flex-1'
            : 'flex w-full flex-col items-center',
          className
        )}
        {...rest}
      />
    );
  }
);

Content.displayName = 'StepperContent';

// ==================== Exports ====================

const Stepper = Object.assign(Root, {
  Item,
  Track,
  Marker,
  Connector,
  Content
});

export { Stepper, useStepperContext, useStepperItemContext };

export type {
  StepperProps,
  StepperItemProps,
  StepperTrackProps,
  StepperConnectorProps,
  StepperMarkerProps,
  StepperContentProps,
  StepperStatus,
  StepperMarkerVariant,
  StepperMarkerSize,
  StepperOrientation
};
