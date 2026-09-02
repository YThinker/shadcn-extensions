import { Slot } from 'radix-ui';
import type { SetStateAction } from 'react';
import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import Toast from '../Toast';
import { Plus, RotateCcw, X, File } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import VideoPlugin from 'yet-another-react-lightbox/plugins/video';
import MediaViewer from '../MediaViewer';
import type { Slide } from 'yet-another-react-lightbox';
import { useFileUploaderControllableState } from './useFileUploaderControllableState';

/* ---------------------------------- 类型 ---------------------------------- */
type FileUploaderStatus = 'pending' | 'uploading' | 'done' | 'failed';

interface FileUploaderItem {
  key: string;
  status: FileUploaderStatus;
  fileName?: string;
  fileSize?: number;
  mimeType?: string; // 来自 File.type，可能为空
  url?: string; // 上传完成后的远程 URL
  file?: File; // Web File 对象
  previewUrl?: string; // 本地预览 URL（createObjectURL）
  extra?: Record<string, any>; // 用户自定义数据
}

interface FileUploaderProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'value' | 'defaultValue' | 'onChange'
  > {
  value?: FileUploaderItem[];
  defaultValue?: FileUploaderItem[];
  onValueChange?: (value?: FileUploaderItem[]) => void;
  onBeforeUpload?: (
    item: FileUploaderItem
  ) =>
    | Promise<boolean | Partial<FileUploaderItem>>
    | boolean
    | Partial<FileUploaderItem>;
  onUpload?: (
    item: FileUploaderItem
  ) => Promise<Partial<FileUploaderItem> | undefined>;
  multiple?: boolean;
  maxCount?: number;
  maxFileSize?: number;
  disabled?: boolean;
  columns?: number;
  gap?: number; // px
  accept?: string; // 直接作为 input accept 属性，如 "image/*,.pdf"
  capture?: boolean | 'user' | 'environment';
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
  asChild?: boolean;
}

interface TriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  showUploadWhenDisabled?: boolean;
  showUploadWhenFulled?: boolean;
  asChild?: boolean;
}

interface ListProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  style?: React.CSSProperties;
  deletable?: boolean;
  deletableWhenDisabled?: boolean;
  onPreview?: (
    item: FileUploaderItem,
    index: number
  ) => undefined | boolean | Promise<void> | Promise<boolean>;
  onDelete?: (
    item: FileUploaderItem,
    index: number
  ) => Promise<boolean> | boolean;
  children?:
    | React.ReactNode
    | ((props: {
        item: FileUploaderItem;
        items: FileUploaderItem[];
        index: number;
        showDelete: boolean;
        triggerDelete: () => void;
      }) => React.ReactNode);
}

interface ListItemProps {
  item: FileUploaderItem;
}

interface FileUploaderContextValue {
  value?: FileUploaderItem[];
  onValueChange: (prev: SetStateAction<FileUploaderItem[] | undefined>) => void;
  triggerUpload: () => void;
  requestUploadFetch: (item: FileUploaderItem) => void;
  disabled?: boolean;
  reachMax: boolean;
}

/* --------------------------------- 工具函数 --------------------------------- */
const generateKey = () =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const getFileExtension = (item: FileUploaderItem): string => {
  const extension = item.fileName?.split('.').pop();
  if (extension) {
    return extension.toLowerCase();
  }
  return 'file';
};

const isImage = (item: FileUploaderItem): boolean => {
  if (item.mimeType?.startsWith('image/')) return true;
  const ext = getFileExtension(item);
  return [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'bmp',
    'svg',
    'heic',
    'heif'
  ].includes(ext);
};

const isVideo = (item: FileUploaderItem): boolean => {
  if (item.mimeType?.startsWith('video/')) return true;
  const ext = getFileExtension(item);
  return ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v'].includes(ext);
};

/* -------------------------------- Context -------------------------------- */
const FileUploaderContext = createContext<FileUploaderContextValue>({
  value: [],
  onValueChange: () => void 0,
  triggerUpload: () => void 0,
  requestUploadFetch: () => void 0,
  disabled: undefined,
  reachMax: false
});

/* ---------------------------------- Root ---------------------------------- */
const Root = ({
  value: valueProp,
  defaultValue,
  onValueChange: onValueChangeProp,
  onBeforeUpload,
  onUpload,
  multiple = true,
  maxCount,
  maxFileSize,
  disabled,
  columns = 4,
  gap = 8,
  accept,
  capture,
  style,
  className,
  children,
  asChild,
  ...props
}: FileUploaderProps) => {
  const [value, onValueChange] = useFileUploaderControllableState({
    prop: valueProp,
    defaultProp: defaultValue ?? [],
    onChange: onValueChangeProp
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const items = value ?? [];
  const reachMax = useMemo(
    () =>
      multiple
        ? typeof maxCount === 'number'
          ? items.length >= maxCount
          : false
        : items.length > 0,
    [multiple, maxCount, items.length]
  );

  // 更新单个 item
  const patchItem = useCallback(
    (key: string, patch: Partial<FileUploaderItem>) => {
      onValueChange((prev) =>
        prev?.length
          ? prev.map((it) => (it.key === key ? { ...it, ...patch } : it))
          : (prev ?? [])
      );
      [];
    },
    [onValueChange]
  );

  // 执行上传
  const requestUploadFetch = useCallback(
    async (item: FileUploaderItem) => {
      if (disabled) return;
      try {
        if (!onUpload) {
          patchItem(item.key, { status: 'done' });
          return;
        }
        patchItem(item.key, { status: 'uploading' });
        const uploadResult = await onUpload(item);
        patchItem(item.key, { status: 'done', ...(uploadResult || {}) });
      } catch {
        patchItem(item.key, { status: 'failed' });
      }
    },
    [disabled, onUpload, patchItem]
  );
  // 追加文件（仅校验文件大小）
  const appendItems = useCallback(
    (picked: Omit<FileUploaderItem, 'key' | 'status'>[]) => {
      const valid = picked.filter((p) => {
        if (
          maxFileSize !== undefined &&
          p.fileSize !== undefined &&
          p.fileSize > maxFileSize
        ) {
          Toast.show({ content: `文件 ${p.fileName ?? ''} 超出大小限制` });
          return false;
        }
        return true;
      });
      if (valid.length === 0) return;

      const remain =
        maxCount === undefined
          ? valid
          : valid.slice(0, Math.max(0, maxCount - (value?.length ?? 0)));
      if (remain.length < valid.length) {
        Toast.show({ content: `最多上传 ${maxCount} 个文件` });
      }
      if (remain.length === 0) return;

      remain.forEach(async (p) => {
        let item: FileUploaderItem = {
          ...p,
          key: generateKey(),
          status: 'pending'
        };
        if (onBeforeUpload) {
          const result = await onBeforeUpload(item);
          if (result === false) return;
          if (result && typeof result === 'object') {
            item = { ...item, ...result };
          }
        }
        onValueChange((prev) => (prev?.length ? [...prev, item] : [item]));
        requestUploadFetch(item);
      });
    },
    [
      maxFileSize,
      maxCount,
      value,
      onBeforeUpload,
      onValueChange,
      requestUploadFetch
    ]
  );

  // 处理 input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = ''; // 允许重复选择相同文件
      if (files.length === 0) return;

      const picked = files.map((file) => ({
        file,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || undefined,
        previewUrl: URL.createObjectURL(file)
      }));
      appendItems(picked);
    },
    [appendItems]
  );

  // 触发文件选择（直接点击 input）
  const triggerUpload = useCallback(() => {
    if (!inputRef.current) return;
    inputRef.current.click();
  }, []);

  // Grid 布局样式
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: `${gap}px`
  };

  const Component = asChild ? Slot.Slot : 'div';

  return (
    <FileUploaderContext.Provider
      value={{
        value,
        onValueChange,
        triggerUpload,
        requestUploadFetch,
        disabled,
        reachMax
      }}
    >
      <Component
        className={cn('w-full', className)}
        style={{ ...gridStyle, ...style }}
        {...props}
      >
        {/* 隐藏的文件输入 */}
        <input
          ref={inputRef}
          type='file'
          className='sr-only'
          accept={accept}
          capture={capture}
          multiple={multiple}
          onChange={handleInputChange}
        />
        {children ? (
          children
        ) : (
          <>
            <Trigger />
            <List />
          </>
        )}
      </Component>
    </FileUploaderContext.Provider>
  );
};

/* --------------------------------- Trigger -------------------------------- */
const Trigger = ({
  className,
  disabled: disabledProp,
  showUploadWhenDisabled = true,
  showUploadWhenFulled = false,
  asChild,
  onClick,
  ...props
}: TriggerProps) => {
  const { triggerUpload, disabled, reachMax } = useContext(FileUploaderContext);

  const shouldDisablePress = disabledProp || disabled || reachMax;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!shouldDisablePress) {
      triggerUpload();
    }
  };

  if (reachMax && showUploadWhenFulled !== true) return null;
  if (disabled && showUploadWhenDisabled !== true) return null;

  const Component = asChild ? Slot.Slot : 'button';

  return (
    <Component
      onClick={handleClick}
      disabled={shouldDisablePress}
      className={cn(
        'bg-component flex aspect-square size-full items-center justify-center rounded-lg',
        shouldDisablePress && 'cursor-not-allowed opacity-60',
        className
      )}
      type='button'
      {...props}
    >
      <Plus className='text-icon-secondary size-6' />
    </Component>
  );
};

/* --------------------------------- ListItem -------------------------------- */
const ListItem = ({ item }: ListItemProps) => {
  const itemIsVideo = isVideo(item);
  const itemIsImage = isImage(item);
  const previewSrc = item.url ?? item.previewUrl;

  if (itemIsImage && previewSrc) {
    return (
      <img
        src={previewSrc}
        alt={item.fileName ?? ''}
        className='size-full object-cover'
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  if (itemIsVideo && previewSrc) {
    return (
      <div className='relative size-full'>
        <video
          src={previewSrc}
          className='size-full object-cover'
          preload='metadata'
        />
        <div className='pointer-events-none absolute inset-0 m-auto'>
          <svg width={24} height={24} viewBox='0 0 24 24' fill='none'>
            <path
              opacity='0.65'
              fillRule='evenodd'
              clipRule='evenodd'
              d='M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z'
              fill='black'
              fillOpacity='0.85'
            />
            <path
              fillRule='evenodd'
              clipRule='evenodd'
              d='M15.7832 12.3748L10.238 15.5442C10.0327 15.6615 9.77187 15.5891 9.65533 15.3825C9.61881 15.3177 9.59961 15.2445 9.59961 15.17V8.83067C9.59961 8.59303 9.79096 8.40039 10.027 8.40039C10.101 8.40039 10.1737 8.41972 10.238 8.4565L15.7832 11.6264C15.9884 11.7437 16.0603 12.0064 15.9438 12.213C15.9057 12.2805 15.8502 12.3364 15.7832 12.3748Z'
              fill='white'
            />
          </svg>
        </div>
      </div>
    );
  }

  // 其他文件占位
  return (
    <div className='flex size-full flex-col items-center justify-center gap-1'>
      <File className='text-icon-secondary size-7' />
      <span className='text-main-3 max-w-full truncate px-2 text-xs'>
        {getFileExtension(item)}
      </span>
    </div>
  );
};

/* ----------------------------------- List ---------------------------------- */
const List = ({
  deletable = true,
  deletableWhenDisabled,
  onPreview,
  onDelete,
  children,
  className,
  ...props
}: ListProps) => {
  const { value, onValueChange, disabled, requestUploadFetch } =
    useContext(FileUploaderContext);

  const showDelete =
    deletable && (disabled ? deletableWhenDisabled === true : true);

  const previewSlidesMap = useMemo(
    () =>
      value?.reduce<Record<string, Slide>>((map, v, idx) => {
        const itemIsVideo = isVideo(v);
        const itemIsImage = isImage(v);
        const previewSrc = v.url ?? v.previewUrl;
        if ((!itemIsVideo && !itemIsImage) || !previewSrc) return map;
        if (itemIsVideo)
          map[idx] = {
            type: 'video',
            sources: [
              {
                src: previewSrc,
                type: v.mimeType ?? ''
              }
            ],
            controls: true,
            playsInline: true
          };
        map[idx] = { src: previewSrc };
        return map;
      }, {}),
    [value]
  );

  const handleDeleteItem = async (item: FileUploaderItem, index: number) => {
    if (!value?.length) return;
    if (onDelete) {
      const allowed = await onDelete(item, index);
      if (!allowed) return;
    }
    if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(item.previewUrl);
    }
    onValueChange(value.filter((it) => it.key !== item.key));
  };

  const handlePressItem = (item: FileUploaderItem, index: number) => {
    if (item.status === 'failed') {
      requestUploadFetch(item);
      return;
    }
    const previewResult = onPreview?.(item, index);
    if (previewResult === false) return;
    const slide = previewSlidesMap?.[index];
    if (!slide) return;
    MediaViewer.show({
      mergePlugins: [VideoPlugin],
      slides: [slide]
    });
  };

  if (!value) return null;

  return (
    <>
      {value.map((item, index) =>
        typeof children === 'function' ? (
          children({
            item,
            items: value,
            index,
            showDelete,
            triggerDelete: () => handleDeleteItem(item, index)
          })
        ) : children ? (
          children
        ) : (
          <button
            key={item.key}
            type='button'
            onClick={() => handlePressItem(item, index)}
            disabled={item.status !== 'done'}
            className={cn(
              'bg-component relative aspect-square size-full overflow-hidden rounded-lg',
              className
            )}
            {...props}
          >
            <ListItem item={item} />
            {item.status === 'uploading' && (
              <div className='absolute inset-0 flex items-center justify-center bg-black/60'>
                <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent' />
              </div>
            )}
            {item.status === 'failed' && (
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60'>
                <RotateCcw className='h-4 w-4 text-white' />
                <span className='text-xs text-white'>重试</span>
              </div>
            )}
            {showDelete && (
              <div
                className='text-none absolute right-0 top-0 z-10 rounded-bl-lg bg-black/60 p-1 leading-none active:bg-black/40'
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item, index);
                }}
              >
                <X className='size-3 text-white' />
              </div>
            )}
          </button>
        )
      )}
    </>
  );
};

/* ------------------------------ 导出组件 ------------------------------ */
const FileUploader = Object.assign(Root, { Trigger, List });
export { FileUploader };
export type { FileUploaderProps, FileUploaderItem };
