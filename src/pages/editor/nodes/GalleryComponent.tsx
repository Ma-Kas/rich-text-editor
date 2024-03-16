import { NodeKey } from 'lexical';
import { GalleryImage } from './GalleryContainerNode';

export default function ImageComponent({
  imageList,
  width,
  maxWidth,
  nodeKey,
  captionText,
  resizable,
}: {
  imageList: GalleryImage[];
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
  nodeKey: NodeKey;
  captionText?: string;
  resizable: boolean;
}): JSX.Element {
  return <div></div>;
}
