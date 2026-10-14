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
  StepperItemSize,
  StepperOrientation,
  StepperProps
} from './stepper.types';
import { cn } from '@/shadcn/lib/utils';
import { useControllableValue } from 'ahooks';
import { Children, cloneElement, isValidElement } from 'react';

// ==================== Helpers ====================

const itemVariants = cva('relative', {
  variants: {
    orientation: {
      vertical: 'flex flex-row items-stretch',
      horizontal: 'flex flex-1 flex-col'
    }
  },
  defaultVariants: {
    orientation: 'vertical'
  }
});

const verticalTrackVariants = cva('relative', {
  variants: {
    size: {
      default: 'w-3',
      sm: 'w-2',
      lg: 'w-4',
      icon: 'w-8'
    },
    orientation: {
      vertical: 'flex flex-col items-center'
    }
  },
  defaultVariants: {
    size: 'default',
    orientation: 'vertical'
  }
});

const horizontalTrackVariants = cva('relative', {
  variants: {
    size: {
      default: 'h-3',
      sm: 'h-2',
      lg: 'h-4',
      icon: 'h-8'
    },
    orientation: {
      horizontal: 'flex w-full flex-row items-center justify-center'
    }
  },
  defaultVariants: {
    size: 'default',
    orientation: 'horizontal'
  }
});

const connectorVariants = cva('flex-1 overflow-hidden border', {
  variants: {
    variant: {
      solid: 'border-solid',
      dashed: 'border-dashed'
    },
    orientation: {
      vertical: 'w-0',
      horizontal: 'absolute left-1/2 top-1/2 h-0 w-full -translate-y-1/2'
    },
    status: {
      current: 'border-divide',
      completed: 'border-info-green-foreground',
      error: 'border-info-red-foreground',
      upcoming: 'border-divide',
      default: 'border-main-3'
    }
  },
  defaultVariants: {
    variant: 'solid',
    orientation: 'vertical',
    status: 'default'
  }
});

const markerVariants = cva(
  'relative z-[1] flex items-center justify-center rounded-full border',
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
      },
      status: {
        current: 'bg-info-blue-foreground border-info-blue-foreground',
        completed: 'bg-info-green-foreground border-info-green-foreground',
        error: 'bg-info-red-foreground border-info-red-foreground',
        upcoming: 'bg-divide border-divide',
        default: 'bg-main-3 border-main-3'
      }
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
      status: 'default'
    }
  }
);

// ==================== Context ====================

const StepperContext = React.createContext<StepperContextValue>({
  orientation: 'vertical',
  value: void 0,
  onValueChange: () => void 0
});

function useStepperContext() {
  return React.useContext(StepperContext);
}

const StepperItemContext = React.createContext<StepperItemContextValue>({
  status: 'default',
  size: 'default'
});

function useStepperItemContext() {
  return React.useContext(StepperItemContext);
}

// ==================== Stepper Root ====================

const Root = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      orientation = 'vertical',
      value: valueProp,
      defaultValue: defaultValueProp,
      onValueChange: onValueChangeProp,
      className,
      asChild,
      children: childrenProp,
      ...rest
    },
    ref
  ) => {
    const Component = asChild ? Slot.Slot : 'div';

    const [value, onValueChange] = useControllableValue({
      value: valueProp,
      defaultValue: defaultValueProp,
      onChange: onValueChangeProp
    });

    let max = 0;
    const children = Children.map(childrenProp, (child) => {
      if (!isValidElement(child)) return child;
      if (child.type === Item) {
        const clonedEle = cloneElement(
          child as React.ReactElement<StepperItemProps>,
          {
            _index: max
          }
        );
        // eslint-disable-next-line react-hooks/immutability
        max += 1;
        return clonedEle;
      }
      return child;
    });

    return (
      <StepperContext.Provider value={{ orientation, value, onValueChange }}>
        <Component
          ref={ref}
          className={cn(
            'text-sm',
            orientation === 'vertical'
              ? 'flex flex-col'
              : 'flex w-full flex-row',
            className
          )}
          {...rest}
        >
          {children}
        </Component>
      </StepperContext.Provider>
    );
  }
);

Root.displayName = 'StepperRoot';

// ==================== Stepper Item ====================

const Item = React.forwardRef<HTMLDivElement, StepperItemProps>(
  ({ status, size = 'default', _index, className, asChild, ...rest }, ref) => {
    const { orientation, value } = useStepperContext();
    const Component = asChild ? Slot.Slot : 'div';

    const mergedStatus: StepperStatus =
      typeof status === 'string'
        ? status
        : !(typeof value === 'number' && typeof _index === 'number')
          ? 'default'
          : value === _index
            ? 'current'
            : value > _index
              ? 'completed'
              : 'upcoming';

    return (
      <StepperItemContext.Provider
        value={{ status: mergedStatus, size, _index }}
      >
        <Component
          ref={ref}
          className={cn('relative', itemVariants({ orientation }), className)}
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
    const { size } = useStepperItemContext();
    const Component = asChild ? Slot.Slot : 'div';

    return (
      <Component
        ref={ref}
        className={cn(
          'relative',
          orientation === 'horizontal'
            ? horizontalTrackVariants({ orientation, size })
            : verticalTrackVariants({ orientation, size }),
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
    const { status } = useStepperItemContext();

    const Component = asChild ? Slot.Slot : 'div';

    return (
      <Component
        ref={ref}
        className={cn(
          connectorVariants({ variant, orientation, status }),
          className
        )}
        {...rest}
      />
    );
  }
);

Connector.displayName = 'StepperConnector';

// ==================== Stepper Marker ====================

const Marker = React.forwardRef<HTMLDivElement, StepperMarkerProps>(
  ({ variant = 'default', className, asChild, onClick, ...rest }, ref) => {
    const { onValueChange } = useStepperContext();
    const { status, size, _index } = useStepperItemContext();

    const Component = asChild ? Slot.Slot : 'div';

    return (
      <Component
        ref={ref}
        className={cn(markerVariants({ size, variant, status }), className)}
        onClick={(e) => {
          onValueChange?.(_index);
          onClick?.(e);
        }}
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
    const { status } = useStepperItemContext();
    const Component = asChild ? Slot.Slot : 'div';

    return (
      <Component
        ref={ref}
        className={cn(
          orientation === 'vertical'
            ? 'flex-1'
            : 'flex w-full flex-col items-center',
          status === 'upcoming' && 'text-placeholder',
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
  StepperItemSize,
  StepperOrientation
};
