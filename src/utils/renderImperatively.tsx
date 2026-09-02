import type {
  AnimationEvent,
  ReactElement,
  ComponentType,
  ForwardedRef,
  RefObject,
} from "react";
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

// ========================== Imperative Registry ==========================
// 模块级注册表：桥接命令式调用与 React 声明式渲染。
// 所有通过 renderImperatively 创建的组件都会注册在此，
// 由 ImperativeRenderOutlet 在其 React 上下文中渲染，从而共享 Context 等。

type RenderTask = {
  key: string;
  element: ReactElement<any>;
};

let keyCount = 5e-300;
const keyStep = 5e-300;
let renderTasks: RenderTask[] = [];
const taskListeners = new Set<() => void>();

/** 订阅 单例 */
function subscribeToRegistry(listener: () => void) {
  taskListeners.add(listener);
  return () => {
    taskListeners.delete(listener);
  };
}
/** 通知 单例 */
function notifyRegistry() {
  taskListeners.forEach((fn) => fn());
}
/** useSyncExternalStore获取最新状态 */
function getRegistrySnapshot(): RenderTask[] {
  return renderTasks;
}
/** 添加组件 */
function addTask(task: RenderTask) {
  if (!taskListeners.size) {
    console.warn(
      "You used renderImperatively(), but <ImperativeRenderOutlet> is not in the component tree. Please add <ImperativeRenderOutlet> to the component tree.",
    );
  }
  keyCount += keyStep;
  renderTasks = [...renderTasks, task];
  notifyRegistry();
}
/** 删除组件 */
function removeTask(key: string) {
  if (!taskListeners.size) {
    console.warn(
      "You used renderImperatively(), but <ImperativeRenderOutlet> is not in the component tree. Please add <ImperativeRenderOutlet> to the component tree.",
    );
  }
  renderTasks = renderTasks.filter((t) => t.key !== key);
  notifyRegistry();
}

// ========================== Outlet Component ==========================
/**
 * 命令式渲染的「插入点」组件。
 * 建议组件为单例 否则可能出现预期之外的问题
 *
 * 将此组件放置在 React 树的合适位置（如 App 根组件内），
 * 所有通过 `renderImperatively` 创建的组件都会在此上下文中渲染，
 * 从而自动继承 Context、Store 等。组件自身的 Portal 负责 DOM 定位。
 *
 * @example
 * function App() {
 *   return (
 *     <Provider store={store}>
 *       <ImperativeRenderOutlet />
 *       <YourRoutes />
 *     </Provider>
 *   );
 * }
 */
export function ImperativeRenderOutlet() {
  const tasks = useSyncExternalStore(
    subscribeToRegistry,
    getRegistrySnapshot,
    getRegistrySnapshot,
  );

  return <>{tasks.map((task) => task.element)}</>;
}

/** 组件必须接收container及onAnimationEnd */
export interface ImperativeProps {
  container?: HTMLElement;
  open?: boolean;
  onOpenChange?: (e: boolean) => void;
  onAnimationEnd?: (e?: AnimationEvent<HTMLElement>) => void;
  onAfterClose?: () => void;
}

export interface ImperativeHandler<P> {
  close: () => void;
  changeProps: (props: ImperativeProps & P) => void;
  isRendered?: () => boolean;
}

type IComponentConstructor<P> = ComponentType<ImperativeProps & P>;

// ========================== Internal Wrapper ==========================
// 每个命令式调用的组件都会包裹在此 Wrapper 中，
// 负责管理 open/close 动画生命周期，并通过 useImperativeHandle 暴露控制 API。
// 组件自身的 Portal 负责 DOM 定位，Wrapper 只做状态管理。

interface WrapperProps<P> {
  ComponentConstructor: IComponentConstructor<P>;
  renderProps?: ImperativeProps & P;
  onUnmount: () => void;
}

function ImperativeWrapperInner<P>(
  { ComponentConstructor, renderProps, onUnmount }: WrapperProps<P>,
  ref: ForwardedRef<ImperativeHandler<ImperativeProps & P>>,
) {
  const unmountedRef = useRef(false);

  const [open, setOpen] = useState(true);
  const [externalProps, setExternalProps] = useState<ImperativeProps & P>();

  const mergeProps = useMemo(
    () => Object.assign({}, renderProps, externalProps),
    [renderProps, externalProps],
  );

  function handleOpenChange(e: boolean) {
    setOpen(false);
    mergeProps?.onOpenChange?.(e);
  }

  function handleAfterClose() {
    if (unmountedRef.current) return;
    unmountedRef.current = true;
    onUnmount();
    mergeProps?.onAfterClose?.();
  }

  function handleAnimationEnd(e: AnimationEvent<HTMLElement>) {
    mergeProps.onAnimationEnd?.(e);
    if (!open) {
      handleAfterClose();
    }
  }

  useImperativeHandle(ref, () => ({
    close: () => handleOpenChange(false),
    changeProps: (changedProps: ImperativeProps & P) => {
      setExternalProps((prev) => ({ ...prev, ...changedProps }));
    },
  }));

  return (
    <ComponentConstructor
      {...mergeProps}
      open={open}
      onOpenChange={handleOpenChange}
      onAnimationEnd={handleAnimationEnd}
    />
  );
}
const ImperativeWrapper = forwardRef(ImperativeWrapperInner);
ImperativeWrapper.displayName = "ImperativeRenderWrapper";

// ========================== Render Imperatively ==========================
/**
 * 命令式地渲染一个组件。
 *
 * 组件会作为 {@link ImperativeRenderOutlet} 的子节点渲染，
 * 从而自动继承 React Context（如 Store、Theme 等）。
 * 组件自身需通过 Portal 处理 DOM 定位（如 Radix UI 的 Portal）。
 *
 * 注意：使用前必须确保 React 树中已放置 `<ImperativeRenderOutlet />`。
 *
 * @param ComponentConstructor - 目标组件（需接收 ImperativeProps）
 * @param renderProps - 传递给组件的 props，其中 container 字段会透传给组件
 * @returns 控制句柄，包含 close / changeProps / isRendered
 */
export function renderImperatively<P>(
  ComponentConstructor: IComponentConstructor<P>,
  renderProps?: ImperativeProps & P,
) {
  let key = "__imperative_component__" + keyCount;

  const wrapperRef: RefObject<ImperativeHandler<ImperativeProps & P>> = {
    current: null,
  };

  function unmountTask() {
    removeTask(key);
  }

  const element = (
    <ImperativeWrapper
      key={key}
      ref={wrapperRef}
      ComponentConstructor={ComponentConstructor}
      renderProps={renderProps}
      onUnmount={unmountTask}
    />
  );

  // 注册到全局注册表，由 ImperativeRenderOutlet 统一渲染
  addTask({ key, element });

  return {
    close: async () => {
      if (!wrapperRef.current) {
        // Wrapper 尚未挂载，直接清理
        unmountTask();
        renderProps?.onAfterClose?.();
      } else {
        wrapperRef.current?.close();
      }
    },
    changeProps: (changedProps: ImperativeProps & P) => {
      wrapperRef.current?.changeProps(changedProps);
    },
    isRendered: () => !!wrapperRef.current,
  } as ImperativeHandler<ImperativeProps & P>;
}
