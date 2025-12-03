import type { AnimationEvent, ReactElement, ReactNode, RefObject } from 'react';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';

import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';

const MARK = '__rc_react_root__';

// ========================== Render ==========================
type ContainerType = (Element | DocumentFragment) & {
  [MARK]?: Root;
};

function render(node: ReactElement, container: ContainerType) {
  const root = container[MARK] || createRoot(container);

  root.render(node);

  container[MARK] = root;
}

// ========================= Unmount ==========================
async function unmount(container: ContainerType) {
  // Delay to unmount to avoid React 18 sync warning
  return Promise.resolve().then(() => {
    container[MARK]?.unmount();

    Reflect.deleteProperty(container, MARK);
    if (container instanceof Element) {
      container.remove();
    }
  });
}

function renderToBody(
  element: ReactElement,
  wrapperContainer: HTMLElement,
  rootContainer?: HTMLElement
) {
  if (rootContainer) {
    rootContainer.appendChild(wrapperContainer);
  } else {
    document.body.appendChild(wrapperContainer);
  }
  render(element, wrapperContainer);
  return () => unmount(wrapperContainer);
}

/** 组件必须接收container及onAnimationEnd */
export interface ImperativeProps {
  container?: HTMLElement;
  open?: boolean;
  onOpenChange?: (e: boolean) => void;
  onAnimationEnd?: (e: AnimationEvent<HTMLElement>) => void;
  onAfterClose?: () => void;
}

export interface ImperativeHandler<T> {
  close: () => void;
  changeProps: (props: T) => void;
  isRendered?: () => boolean;
}

type IComponentConstructor<P> = (props: ImperativeProps & P) => ReactNode;

export function renderImperatively<P>(
  ComponentConstructor: IComponentConstructor<P>,
  renderProps: ImperativeProps & P
) {
  const wrapperContainer = document.createElement('div');
  const Wrapper = forwardRef<ImperativeHandler<ImperativeProps & P>>(
    (_, ref) => {
      const closedRef = useRef(false);

      const [open, setOpen] = useState(false);
      const [externalProps, setExternalProps] = useState<P>();

      const mergeProps = useMemo(
        () => Object.assign({}, renderProps, externalProps),
        [externalProps]
      );

      function handleOpenChange(e: boolean) {
        closedRef.current = true;
        setOpen(false);
        mergeProps?.onOpenChange?.(e);
      }

      function handleAfterClose() {
        unmountRender();
        mergeProps?.onAfterClose?.();
      }

      function handleAnimationEnd(e: AnimationEvent<HTMLElement>) {
        mergeProps.onAnimationEnd?.(e);
        if (!open) {
          handleAfterClose();
        }
      }

      useEffect(() => {
        if (!closedRef.current) {
          setOpen(true);
        } else {
          handleAfterClose();
        }
      }, []);

      useImperativeHandle(ref, () => ({
        close: () => handleOpenChange(false),
        changeProps: (changedProps: ImperativeProps & P) => {
          setExternalProps(changedProps);
        }
      }));

      return (
        <ComponentConstructor
          {...mergeProps}
          container={wrapperContainer}
          open={open}
          onOpenChange={handleOpenChange}
          onAnimationEnd={handleAnimationEnd}
        />
      );
    }
  );
  Wrapper.displayName = 'ImperativeRenderWrapper';
  const wrapperRef: RefObject<ImperativeHandler<ImperativeProps & P>> = {
    current: null
  };
  const unmountRender = renderToBody(
    <Wrapper ref={wrapperRef} />,
    wrapperContainer,
    renderProps.container
  );
  return {
    close: async () => {
      if (!wrapperRef.current) {
        // it means the wrapper is not mounted yet, call `unmount` directly
        unmountRender();
        // call `afterClose` to make sure the callback is called
        renderProps.onAfterClose?.();
      } else {
        wrapperRef.current?.close();
      }
    },
    changeProps: (element) => {
      wrapperRef.current?.changeProps(element);
    },
    isRendered: () => !!wrapperRef.current
  } as ImperativeHandler<ImperativeProps & P>;
}
