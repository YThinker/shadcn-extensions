import * as React from 'react';
import { useId, MouseEvent, useState, ChangeEvent } from 'react';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import clamp from 'lodash/clamp';
import { Star } from 'lucide-react';
import { useControllableValue } from 'ahooks';
import { cn } from '@/shadcn/lib/utils';
import { roundValueToPrecision } from './utils';

interface IconContainerProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
}

export interface RatingProps
  extends Omit<React.ComponentProps<'span'>, 'onChange'> {
  /**
   * The default value. Use when the component is not controlled.
   * @default null
   */
  defaultValue?: number;
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * 请在样式中添加size-full 否则Icon大小将不可控
   * The icon to display when empty.
   * @default <StarBorder fontSize="inherit" />
   */
  emptyIcon?: React.ReactNode;
  /**
   * The label read when the rating input is empty.
   * @default 'Empty'
   */
  emptyLabelText?: React.ReactNode;
  /**
   * Accepts a function which returns a string value that provides a user-friendly name for the current value of the rating.
   * This is important for screen reader users.
   *
   * For localization purposes, you can use the provided [translations](https://mui.com/material-ui/guides/localization/).
   * @param {number} value The rating label's value to format.
   * @returns {string}
   * @default function defaultLabelText(value) {
   *   return `${value || '0'} Star${value !== 1 ? 's' : ''}`;
   * }
   */
  getLabelText?: (value: number) => string;
  /**
   * If `true`, only the selected icon will be highlighted.
   * @default false
   */
  highlightSelectedOnly?: boolean;
  /**
   * 请在样式中添加size-full 否则Icon大小将不可控
   * The icon to display.
   * @default <Star fontSize="inherit" />
   */
  icon?: React.ReactNode;
  /**
   * The component containing the icon.
   * @default function IconContainer(props) {
   *   const { value, ...other } = props;
   *   return <span {...other} />;
   * }
   */
  IconContainerComponent?: React.ElementType<IconContainerProps>;
  /**
   * Maximum rating.
   * @default 5
   */
  max?: number;
  /**
   * The name attribute of the radio `input` elements.
   * This input `name` should be unique within the page.
   * Being unique within a form is insufficient since the `name` is used to generate IDs.
   */
  name?: string;
  /**
   * Callback fired when the value changes.
   * @param {React.SyntheticEvent} event The event source of the callback.
   * @param {number|null} value The new value.
   */
  onChange?: (event: React.SyntheticEvent, value: number | null) => void;
  /**
   * Callback function that is fired when the hover state changes.
   * @param {React.SyntheticEvent} event The event source of the callback.
   * @param {number} value The new value.
   */
  onChangeActive?: (event: React.SyntheticEvent, value: number) => void;
  /**
   * The minimum increment value change allowed.
   * @default 1
   */
  precision?: number;
  /**
   * Removes all hover effects and pointer events.
   * @default false
   */
  readOnly?: boolean;
  /**
   * The rating value.
   */
  value?: number | null;
}

interface RatingItemProps {
  disabled?: RatingProps['disabled'];
  emptyIcon?: RatingProps['emptyIcon'];
  getLabelText?: RatingProps['getLabelText'];
  highlightSelectedOnly?: RatingProps['highlightSelectedOnly'];
  icon?: RatingProps['icon'];
  IconContainerComponent?: RatingProps['IconContainerComponent'];
  readOnly?: RatingProps['readOnly'];
  name?: string;
  isActive?: boolean;
  itemValue?: number;
  hover?: number;
  focus?: number;
  labelProps?: { className?: string; style?: React.CSSProperties };
  ratingValue?: number;
  ratingValueRounded?: number;
  onBlur?: (event: React.SyntheticEvent) => void;
  onClick?: (event: React.SyntheticEvent) => void;
  onFocus?: (event: React.SyntheticEvent) => void;
  onChange?: (event: React.SyntheticEvent) => void;
  onChangeActive?: (event: React.SyntheticEvent) => void;
}

function IconContainer({ className, ...props }: IconContainerProps) {
  return (
    <span {...props} className={cn(className, 'size-[var(--cell-size)]')} />
  );
}

// RatingItem 组件
function RatingItem(props: RatingItemProps) {
  const {
    disabled,
    emptyIcon,
    // focus,
    getLabelText,
    highlightSelectedOnly,
    // hover,
    icon,
    IconContainerComponent,
    isActive,
    itemValue,
    labelProps,
    name,
    onBlur,
    onChange,
    onClick,
    onFocus,
    readOnly,
    ratingValue,
    ratingValueRounded
  } = props;

  const isFilled = highlightSelectedOnly
    ? itemValue === ratingValue
    : itemValue <= ratingValue;
  // const isHovered = itemValue <= hover;
  // const isFocused = itemValue <= focus;
  const isChecked = itemValue === ratingValueRounded;

  const id = `${name}-${useId()}`;

  const container = (
    <IconContainerComponent
      className={cn(
        'pointer-events-none flex transition-transform duration-200',
        !isFilled && 'text-placeholder',
        isActive && 'scale-125'
      )}
      value={itemValue}
    >
      {emptyIcon && !isFilled ? emptyIcon : icon}
    </IconContainerComponent>
  );

  if (readOnly) {
    return <span {...labelProps}>{container}</span>;
  }

  return (
    <>
      <label htmlFor={id} className='cursor-pointer' style={labelProps?.style}>
        {container}
        <span className='sr-only'>{getLabelText(itemValue)}</span>
      </label>
      <input
        className='sr-only'
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={onChange}
        onClick={onClick}
        disabled={disabled}
        value={itemValue}
        id={id}
        type='radio'
        name={name}
        checked={isChecked}
      />
    </>
  );
}

/**
 * Rating 组件 基于MUI源码定制
 * @link https://www.diceui.com/docs/components/rating 该地址指向与shadcn/ui兼容的Rating组件 供参考
 */
const Rating = React.forwardRef(function Rating(props: RatingProps, ref) {
  const {
    className = '',
    disabled = false,
    emptyIcon = <Star className='size-full fill-current' />,
    emptyLabelText = 'Empty',
    getLabelText = (value) => `${value || '0'}分`,
    highlightSelectedOnly = false,
    icon = <Star className='size-full fill-current' />,
    IconContainerComponent = IconContainer,
    max = 5,
    onChange,
    onChangeActive,
    onMouseLeave,
    onMouseMove,
    precision = 1,
    readOnly = false,
    name: nameProp,
    ...other
  } = props;

  const name = (nameProp ? nameProp + '-' : '') + useId();

  const [valueDerived, setValueState] = useControllableValue(props);

  const valueRounded = roundValueToPrecision(valueDerived, precision);

  const [{ hover, focus }, setState] = useState({
    hover: -1,
    focus: -1
  });

  let value = valueRounded;
  if (hover !== -1) {
    value = hover;
  }
  if (focus !== -1) {
    value = focus;
  }

  // const [focusVisible, setFocusVisible] = React.useState(false);
  const [emptyValueFocused, setEmptyValueFocused] = React.useState(false);

  const rootRef = React.useRef<HTMLDivElement>();
  const handleRef = useComposedRefs(rootRef, ref);

  const handleMouseMove = (event: MouseEvent<HTMLButtonElement>) => {
    if (onMouseMove) {
      onMouseMove(event);
    }

    const rootNode = rootRef.current;
    const {
      // right,
      left,
      width: containerWidth
    } = rootNode.getBoundingClientRect();

    const percent = (event.clientX - left) / containerWidth;

    let newHover = roundValueToPrecision(
      max * percent + precision / 2,
      precision
    );
    newHover = clamp(newHover, precision, max);

    setState((prev) =>
      prev.hover === newHover && prev.focus === newHover
        ? prev
        : {
            hover: newHover,
            focus: newHover
          }
    );

    // setFocusVisible(false);

    if (onChangeActive && hover !== newHover) {
      onChangeActive(event, newHover);
    }
  };

  const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>) => {
    if (onMouseLeave) {
      onMouseLeave(event);
    }

    const newHover = -1;
    setState({
      hover: newHover,
      focus: newHover
    });

    if (onChangeActive && hover !== newHover) {
      onChangeActive(event, newHover);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    let newValue =
      event.target.value === '' ? null : parseFloat(event.target.value);

    if (hover !== -1) {
      newValue = hover;
    }

    setValueState(newValue);

    if (onChange) {
      onChange(event, newValue);
    }
  };

  const handleClear = (event: MouseEvent<HTMLInputElement>) => {
    if (event.clientX === 0 && event.clientY === 0) {
      return;
    }

    setState({
      hover: -1,
      focus: -1
    });

    setValueState(null);

    if (onChange && parseFloat(event.currentTarget.value) === valueRounded) {
      onChange(event, null);
    }
  };

  const handleFocus = (event) => {
    // if (isFocusVisible(event.target)) {
    //   setFocusVisible(true);
    // }

    const newFocus = parseFloat(event.target.value);
    setState((prev) => ({
      hover: prev.hover,
      focus: newFocus
    }));
  };

  const handleBlur = () => {
    if (hover !== -1) {
      return;
    }

    // if (!isFocusVisible(event.target)) {
    //   setFocusVisible(false);
    // }

    const newFocus = -1;
    setState((prev) => ({
      hover: prev.hover,
      focus: newFocus
    }));
  };

  const ratingItemProps = {
    disabled,
    emptyIcon,
    focus,
    getLabelText,
    highlightSelectedOnly,
    hover,
    icon,
    IconContainerComponent,
    name,
    onBlur: handleBlur,
    onChange: handleChange,
    onClick: handleClear,
    onFocus: handleFocus,
    ratingValue: value,
    ratingValueRounded: valueRounded,
    readOnly
  };

  return (
    <span
      ref={handleRef}
      className={cn(
        'text-primary relative inline-flex min-w-min cursor-pointer text-left transition-opacity duration-200 [--cell-size:24px]',
        disabled && 'pointer-events-none opacity-40',
        readOnly && 'pointer-events-none',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role={readOnly ? 'img' : null}
      aria-label={readOnly ? getLabelText(value) : null}
      {...other}
    >
      {Array.from({ length: max }).map((_, index) => {
        const itemValue = index + 1;

        const isActive =
          itemValue === Math.ceil(value) && (hover !== -1 || focus !== -1);

        if (precision < 1) {
          const items = Array.from({ length: 1 / precision });
          return (
            <span
              key={itemValue}
              className={cn(
                'relative ml-2 first:ml-0',
                isActive && 'scale-125'
              )}
            >
              {items.map(($, indexDecimal) => {
                const itemDecimalValue = roundValueToPrecision(
                  itemValue - 1 + (indexDecimal + 1) * precision,
                  precision
                );

                return (
                  <RatingItem
                    key={itemDecimalValue}
                    {...ratingItemProps}
                    isActive={false}
                    itemValue={itemDecimalValue}
                    labelProps={{
                      className:
                        items.length - 1 !== indexDecimal
                          ? 'overflow-hidden absolute'
                          : '',
                      style:
                        items.length - 1 !== indexDecimal
                          ? {
                              width:
                                itemDecimalValue === value
                                  ? `${(indexDecimal + 1) * precision * 100}%`
                                  : '0%',
                              overflow: 'hidden',
                              position: 'absolute'
                            }
                          : void 0
                    }}
                  />
                );
              })}
            </span>
          );
        }

        return (
          <RatingItem
            key={itemValue}
            {...ratingItemProps}
            isActive={isActive}
            itemValue={itemValue}
          />
        );
      })}
      {!readOnly && !disabled && (
        <label
          className={cn(
            'cursor-pointer',
            emptyValueFocused &&
              'outline-ring absolute inset-0 outline outline-1'
          )}
        >
          <input
            className='sr-only'
            value=''
            id={`${name}-empty`}
            type='radio'
            name={name}
            checked={valueRounded == null}
            onFocus={() => setEmptyValueFocused(true)}
            onBlur={() => setEmptyValueFocused(false)}
            onChange={handleChange}
          />
          <span className='sr-only'>{emptyLabelText}</span>
        </label>
      )}
    </span>
  );
});

export default Rating;
