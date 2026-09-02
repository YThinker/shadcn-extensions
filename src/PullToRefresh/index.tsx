import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { cn } from '@/shadcn/lib/utils';
import { useMemoizedFn } from 'ahooks';
import { Loader2 } from 'lucide-react';

// simple rubberband function
function rubberband(distance: number, limit: number) {
  const d = Math.max(0, distance);
  if (d === 0) return 0;
  const x = d / limit;
  // 组合函数：limit * (1 - (1 / (1 + x^alpha)))，alpha 控制曲线陡峭度
  const alpha = 1.6;
  return limit * (1 - 1 / Math.pow(1 + x, alpha));
}

function getScrollTop(node: EventTarget | null) {
  if (!(node instanceof Element)) return 0;
  let cur: Element | null = node;
  while (cur && cur !== document.body) {
    const overflowY = window.getComputedStyle(cur).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return cur.scrollTop;
    }
    cur = cur.parentElement;
  }
  return window.scrollY || document.documentElement.scrollTop || 0;
}

export type PullStatus = 'pulling' | 'canRelease' | 'refreshing' | 'complete';

export interface PullToRefreshProps {
  headerHeight?: number;
  threshold?: number;
  disabled?: boolean;
  completeDelay?: number;
  onRefresh?: () => Promise<void> | void;
}

const PullToRefreshContext = createContext<
  | {
      headerRef: RefObject<HTMLDivElement | null>;
      status?: PullStatus;
      headerHeight?: number;
    }
  | undefined
>(void 0);

const PullToRefresh = ({
  headerHeight = 60,
  threshold = 60,
  disabled,
  completeDelay = 500,
  onRefresh,
  ...props
}: ComponentProps<'div'> & PullToRefreshProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const isTouchingRef = useRef(false);

  const [status, setStatus] = useState<PullStatus>();

  const onTouchMove = useMemoizedFn(function (e: TouchEvent) {
    if (disabled) return;
    if (!isTouchingRef.current) return;
    if (!pullingRef.current) return;
    const startY = startYRef.current;
    if (startY == null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - startY;
    if (delta <= 0) return; // only handle downward pull
    // prevent native scroll when pulling
    if (e.cancelable) e.preventDefault();
    const applied = rubberband(delta, headerHeight * 2);
    if (headRef.current) headRef.current.style.height = applied + 'px';
    setStatus(applied > threshold ? 'canRelease' : 'pulling');
  });

  const onTouchStart = useMemoizedFn(function (e: TouchEvent) {
    if (disabled) return;
    if (e.touches.length !== 1) return;
    startYRef.current = e.touches[0].clientY;
    isTouchingRef.current = true;
    // determine if scroll is at top for the target
    const target = e.target as Element | null;
    const scrollTop = getScrollTop(target);
    pullingRef.current = scrollTop <= 0;
  });

  const onTouchEnd = useMemoizedFn(function () {
    if (disabled) return;
    isTouchingRef.current = false;
    startYRef.current = null;
    if (!pullingRef.current) return;
    pullingRef.current = false;
    if (status === 'canRelease') {
      // lock to headHeight and trigger refresh
      if (headRef.current) headRef.current.style.height = headerHeight + 'px';
      setStatus('refreshing');
      const maybePromise = onRefresh?.();
      const finish = async () => {
        try {
          if (maybePromise instanceof Promise) await maybePromise;
          setStatus('complete');
          if (completeDelay > 0) {
            await new Promise((r) => setTimeout(r, completeDelay));
          }
        } catch (err) {
          // onRefresh error -> just reset
          console.error('onRefresh Error', err);
        } finally {
          // animate back to 0
          if (headRef.current) headRef.current.style.height = '';
          setStatus(void 0);
        }
      };
      finish();
    } else {
      // animate back to 0
      if (headRef.current) headRef.current.style.height = '';
      setStatus(void 0);
    }
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // attach listeners to the container to scope the touch handling
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [disabled, headerHeight, threshold, completeDelay, status]);

  return (
    <PullToRefreshContext.Provider
      value={{
        headerRef: headRef,
        status,
        headerHeight
      }}
    >
      <div {...props} ref={containerRef} />
    </PullToRefreshContext.Provider>
  );
};

const PullToRefreshIndicator = ({
  className,
  style,
  children,
  ...props
}: Omit<ComponentProps<'div'>, 'children'> & {
  children?: (status?: PullStatus) => ReactNode;
}) => {
  const context = useContext(PullToRefreshContext);
  const { status, headerHeight } = context ?? {};

  const statusText = () => {
    if (status === 'pulling') return '下拉刷新';
    if (status === 'canRelease') return '释放立即刷新';
    if (status === 'refreshing')
      return (
        <>
          <Loader2 className='text-icon-secondary mr-2 size-5 animate-spin' />
          <span>加载中...</span>
        </>
      );
    if (status === 'complete') return '加载成功';
    return '';
  };

  return (
    <div
      {...props}
      className={cn(
        'text-main-3 flex items-center justify-center py-4 text-sm',
        className
      )}
      style={{ height: headerHeight, minHeight: headerHeight, ...style }}
    >
      {children?.(status) ?? statusText()}
    </div>
  );
};

const PullToRefreshHeader = ({
  className,
  children,
  ...props
}: ComponentProps<'div'>) => {
  const context = useContext(PullToRefreshContext);
  const { headerRef, status } = context ?? {};

  return (
    <div
      {...props}
      ref={headerRef}
      className={cn(
        'h-0 w-full overflow-hidden',
        status !== 'pulling' &&
          status !== 'canRelease' &&
          'transition-all ease-out',
        className
      )}
      aria-hidden
    >
      {children ?? <PullToRefreshIndicator />}
    </div>
  );
};

export { PullToRefresh, PullToRefreshHeader, PullToRefreshIndicator };
