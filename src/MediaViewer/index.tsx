import type { LightboxExternalProps, Plugin } from 'yet-another-react-lightbox';
import { Lightbox } from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import type { ImperativeProps } from '@fortissimo/util';
import { renderImperatively } from '@fortissimo/util';

interface Props extends LightboxExternalProps, ImperativeProps {
  /**
   * 传入Plugins数组，覆盖默认Plugins
   * @warn 此属性与mergePlugins冲突，优先级低于mergePlugins
   */
  plugins?: readonly Plugin[];
  /**
   * 传入Plugins数组，与默认Plugins合并
   * @warn 此属性与plugins冲突，优先级高于plugins
   */
  mergePlugins?: readonly Plugin[];
}
const MediaViewerRoot = ({
  controller,
  plugins,
  mergePlugins,
  open,
  container,
  onOpenChange,
  onAnimationEnd,
  ...rest
}: Props) => {
  console.log(open);
  return (
    <Lightbox
      open={open}
      close={() => onOpenChange?.(false)}
      portal={{
        root: container
      }}
      on={{
        exited: () => onAnimationEnd?.()
      }}
      controller={{
        ...controller,
        closeOnPullUp: controller?.closeOnPullUp ?? true,
        closeOnBackdropClick: controller?.closeOnBackdropClick ?? true,
        closeOnPullDown: controller?.closeOnPullDown ?? true
      }}
      plugins={
        plugins
          ? plugins
          : mergePlugins?.length
            ? [Counter, Zoom, ...mergePlugins]
            : [Counter, Zoom]
      }
      {...rest}
    />
  );
};

const MediaViewer = Object.assign(MediaViewerRoot, {
  show: (props?: Props) =>
    renderImperatively(MediaViewerRoot, {
      ...props,
      open: true
    })
});

export default MediaViewer;
