import { ComponentProps, CSSProperties, ReactNode, MouseEvent } from 'react';

export type SwipeCellSide = 'left' | 'right';

export type SwipeCellPosition = SwipeCellSide | 'cell' | 'outside';

export interface SwipeActionButtonProps extends ComponentProps<'button'> {
  key: string;
}

export interface SwipeActionProps {
  className?: string;
  style?: CSSProperties;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
  /** 指定左侧滑动区域宽度，单位为px */
  leftWidth?: string | number;
  /** 指定右侧滑动区域宽度，单位为 px */
  rightWidth?: string | number;
  /** 左侧滑动区域的内容 */
  leftActions?: SwipeActionButtonProps[];
  /** 右侧滑动区域的内容 */
  rightActions?: SwipeActionButtonProps[];
  /** 点击外部关闭 */
  closeOnTouchOutside?: boolean;
  /** 是否阻止滑动事件冒泡	 */
  stopPropagation?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 打开时触发 */
  onOpenChange?: (
    isOpen: boolean,
    params: { openPosition?: SwipeCellSide; closeTrigger?: SwipeCellPosition }
  ) => void;
  onAction?: (key: string, e: MouseEvent<HTMLButtonElement>) => void;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  children?: ReactNode;
}

export interface SwipeCellInstance {
  open: (side: SwipeCellSide) => void;
  close: () => void;
}
