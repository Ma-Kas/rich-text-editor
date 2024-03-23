import { LexicalCommand, NodeKey, createCommand } from 'lexical';
import { InsertImagePayload } from '../plugins/ImagesPlugin';
import { InsertGalleryImagePayload } from '../plugins/ImageGalleryPlugin';
import { InsertTableCommandPayload } from '../plugins/TablePlugin';
import { EmbedPayload } from '../nodes/EmbedNode';

export const INSERT_EMBED_COMMAND: LexicalCommand<EmbedPayload> = createCommand(
  'INSERT_EMBED_COMMAND'
);

export const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> =
  createCommand('RIGHT_CLICK_IMAGE_COMMAND');

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand('INSERT_IMAGE_COMMAND');

export const INSERT_GALLERY_COMMAND: LexicalCommand<InsertGalleryImagePayload> =
  createCommand('INSERT_GALLERY_COMMAND');

export const INSERT_CAROUSEL_COMMAND: LexicalCommand<InsertGalleryImagePayload> =
  createCommand('INSERT_CAROUSEL_COMMAND');

export const INSERT_NEW_TABLE_COMMAND: LexicalCommand<InsertTableCommandPayload> =
  createCommand('INSERT_NEW_TABLE_COMMAND');

export const INSERT_LAYOUT_COMMAND: LexicalCommand<string> =
  createCommand<string>();

export const UPDATE_LAYOUT_COMMAND: LexicalCommand<{
  template: string;
  nodeKey: NodeKey;
}> = createCommand<{ template: string; nodeKey: NodeKey }>();
