import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  LexicalEditor,
} from 'lexical';
import { useEffect, useRef, useState } from 'react';
import { INSERT_IMAGE_COMMAND } from '../../utils/exportedCommands';

import landscapeImage from '../../images/landscape.jpg';
import yellowFlowerImage from '../../images/yellow-flower.jpg';
import {
  $createImageNode,
  ImageNode,
  ImagePayload,
} from '../../nodes/ImageNode';
import Button from '../../ui/Button';
import { DialogActions, DialogButtonsList } from '../../ui/Dialog';
import FileInput from '../../ui/FileInput';
import TextInput from '../../ui/TextInput';
import { $createImageBlockNode } from '../../nodes/ImageBlockNode';

export type InsertImagePayload = Readonly<ImagePayload>;

export function InsertImageUriDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void;
}) {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');

  const isDisabled = src === '';

  return (
    <>
      <TextInput
        label='Image URL'
        placeholder='i.e. https://source.unsplash.com/random'
        onChange={setSrc}
        value={src}
        data-test-id='image-modal-url-input'
      />
      <TextInput
        label='Alt Text'
        placeholder='Random unsplash image'
        onChange={setAltText}
        value={altText}
        data-test-id='image-modal-alt-text-input'
      />
      <DialogActions>
        <Button
          data-test-id='image-modal-confirm-btn'
          disabled={isDisabled}
          onClick={() => onClick({ altText, src })}
        >
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertImageUploadedDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void;
}) {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');

  const isDisabled = src === '';

  const loadImage = (files: FileList | null) => {
    const reader = new FileReader();
    reader.onload = function () {
      if (typeof reader.result === 'string') {
        setSrc(reader.result);
      }
      return '';
    };
    if (files !== null) {
      reader.readAsDataURL(files[0]);
    }
  };

  return (
    <>
      <FileInput
        label='Image Upload'
        onChange={loadImage}
        accept='image/*'
        data-test-id='image-modal-file-upload'
      />
      <TextInput
        label='Alt Text'
        placeholder='Descriptive alternative text'
        onChange={setAltText}
        value={altText}
        data-test-id='image-modal-alt-text-input'
      />
      <DialogActions>
        <Button
          data-test-id='image-modal-file-upload-btn'
          disabled={isDisabled}
          onClick={() => onClick({ altText, src })}
        >
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertImageDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [mode, setMode] = useState<null | 'url' | 'file'>(null);
  const hasModifier = useRef(false);

  useEffect(() => {
    hasModifier.current = false;
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey;
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [activeEditor]);

  const onClick = (payload: InsertImagePayload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    onClose();
  };

  return (
    <>
      {!mode && (
        <DialogButtonsList>
          <Button
            data-test-id='image-modal-option-sample'
            onClick={() =>
              onClick(
                hasModifier.current
                  ? {
                      altText:
                        'Daylight fir trees forest glacier green high ice landscape',
                      src: landscapeImage,
                    }
                  : {
                      altText: 'Yellow flower in tilt shift lens',
                      src: yellowFlowerImage,
                    }
              )
            }
          >
            Sample
          </Button>
          <Button
            data-test-id='image-modal-option-url'
            onClick={() => setMode('url')}
          >
            URL
          </Button>
          <Button
            data-test-id='image-modal-option-file'
            onClick={() => setMode('file')}
          >
            File
          </Button>
        </DialogButtonsList>
      )}
      {mode === 'url' && <InsertImageUriDialogBody onClick={onClick} />}
      {mode === 'file' && <InsertImageUploadedDialogBody onClick={onClick} />}
    </>
  );
}

const TRANSPARENT_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const img = document.createElement('img');
img.src = TRANSPARENT_IMAGE;

export default function ImagesPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagesPlugin: ImageNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const newImageBlock = $createImageBlockNode();
          $insertNodes([newImageBlock]);

          const imageNode = $createImageNode(payload);
          $insertNodes([imageNode]);

          // Add new paragraph node below created image
          const newParagraphNode = $createParagraphNode();
          $insertNodes([newParagraphNode]);

          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);

  return null;
}
