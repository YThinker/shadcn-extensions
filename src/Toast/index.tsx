import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  ImperativeHandler,
  ImperativeProps,
  renderImperatively
} from '@fortissimo/util';
import { cn } from '@/shadcn/lib/utils';
import { ComponentProps, forwardRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Presence } from '@radix-ui/react-presence';

const DEFAULT_DURATION = 2000;

const ToastContent = forwardRef<
  HTMLDivElement,
  ComponentProps<'div'> & { open: boolean }
>(({ open, ...props }, ref) => (
  <Presence present={open}>
    <div ref={ref} data-state={open ? 'open' : 'closed'} {...props} />
  </Presence>
));
ToastContent.displayName = 'ToastContent';

interface Props extends ImperativeProps {
  mask?: boolean;
  content?: ReactNode;
  icon?: ReactNode | 'loading';
  className?: string;
}

/**
 * 组件必须接收container及onAnimationEnd
 * 暂未实现onAfterClose，实现后将删除renderImperatively中的onAfterClose实现
 */
const ToastInner = ({
  container,
  mask,
  className,
  content,
  icon,
  open,
  onAnimationEnd,
  ...props
}: Props) => {
  return (
    <DialogPrimitive.Root
      open={open}
      {...props}
      modal={false}
      onOpenChange={void 0}
    >
      <DialogPrimitive.Portal container={container}>
        {mask && (
          <DialogPrimitive.Overlay className='pointer-events-none fixed inset-0 z-50' />
        )}
        <ToastContent
          open={open}
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/2 bg-toast text-toast-foreground fixed left-1/2 top-1/2 z-50 inline-flex max-w-52 -translate-x-1/2 -translate-y-1/2 select-none flex-col items-center gap-2 rounded-2xl p-4 text-center text-base outline-none backdrop-blur-2xl duration-200',
            className
          )}
          onAnimationEnd={onAnimationEnd}
        >
          {icon === 'loading' ? (
            <Loader2 className='size-7 animate-spin' />
          ) : (
            icon
          )}
          <DialogPrimitive.Title className={!content ? 'sr-only' : ''}>
            {content ? content : icon === 'loading' ? '加载中' : null}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className='sr-only' />
        </ToastContent>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
ToastInner.displayName = 'ToastInner';

const handlers = new Set<ImperativeHandler<Props>>();

interface ToastProps extends Props {
  duration?: number;
}

const Toast = {
  show: (props: ToastProps) => {
    let timer: number;
    const toastHandler = renderImperatively(ToastInner, {
      ...props,
      onAfterClose: () => {
        if (timer) {
          window.clearTimeout(timer);
        }
        props.onAfterClose?.();
        handlers.delete(toastHandler);
      }
    });
    handlers.add(toastHandler);
    if (props.duration !== 0) {
      timer = window.setTimeout(
        () => toastHandler.close(),
        isFinite(props.duration) && props.duration > 0
          ? props.duration
          : DEFAULT_DURATION
      );
    }
    return toastHandler;
  },
  loading: (props?: ToastProps) => {
    return Toast.show({ icon: 'loading', duration: 0, ...props });
  },
  destory: () => {
    handlers.forEach((item) => item.close());
    handlers.clear();
  }
};

export default Toast;
