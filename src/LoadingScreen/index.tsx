import { ComponentProps } from 'react';
import AnimationLoader from '@/assets/icon/loader-animation-icon.svg?react';
import { cn } from '@/shadcn/lib/utils';

/**
 * font color是spinner的颜色
 * stroke color是容器圆环的颜色
 */
function LoadingIcon({ className, ...props }: ComponentProps<'svg'>) {
  return <AnimationLoader {...props} className={cn('size-8', className)} />;
}

function LoadingScreenWrapper({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'flex h-screen w-screen items-center justify-center',
        className
      )}
    />
  );
}

function LoadingScreen(props: ComponentProps<'div'>) {
  return (
    <LoadingScreenWrapper {...props}>
      <LoadingIcon className='text-[#323852]' />
    </LoadingScreenWrapper>
  );
}

export { LoadingIcon, LoadingScreenWrapper, LoadingScreen };
