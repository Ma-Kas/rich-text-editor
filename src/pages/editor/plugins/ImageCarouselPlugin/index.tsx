import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  LexicalEditor,
} from 'lexical';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';

import { INSERT_CAROUSEL_COMMAND } from '../../utils/exportedCommands';

import landscapeImage from '../../images/landscape.jpg';
import yellowFlowerImage from '../../images/yellow-flower.jpg';
import Button from '../../ui/Button';
import { DialogActions, DialogButtonsList } from '../../ui/Dialog';
import { MultiFileInput } from '../../ui/FileInput';
import TextInput from '../../ui/TextInput';
import { $createCarouselBlockNode } from '../../nodes/CarouselBlockNode';
import {
  $createCarouselContainerNode,
  CarouselContainerNode,
  CarouselImage,
} from '../../nodes/CarouselContainerNode';

export type InsertCarouselImagePayload = CarouselImage[];

const stringSchema = z.string();

export function InsertCarouselImagesUriDialogBody({
  onClick,
}: {
  onClick: (payload: InsertCarouselImagePayload) => void;
}) {
  const MIN_IMAGE_COUNT = 2;
  const MAX_IMAGE_COUNT = 6;
  // Set initial state to a new array of length MIN_IMAGE_COUNT with image.id
  // set to increment starting from 1, and src and altText set to ''
  const [imageList, setImageList] = useState<CarouselImage[]>(
    Array.from({ length: MIN_IMAGE_COUNT }, (_, index) => index + 1).map(
      (index) => {
        return { id: index, src: '', altText: '' };
      }
    )
  );

  const incrementImageList = () => {
    const currentLength = imageList.length;
    if (currentLength >= MAX_IMAGE_COUNT) {
      return;
    }
    setImageList([
      ...imageList,
      { id: currentLength + 1, src: '', altText: '' },
    ]);
  };

  const removeLastImageFromList = () => {
    const currentLength = imageList.length;
    if (currentLength <= MIN_IMAGE_COUNT) {
      return;
    }
    setImageList(imageList.filter((image) => image.id !== currentLength));
  };

  const handleChange = (
    image: CarouselImage,
    type: 'src' | 'altText',
    input: unknown
  ) => {
    switch (type) {
      case 'src': {
        const parseResult = stringSchema.safeParse(input);
        if (parseResult.success) {
          const newSrc = parseResult.data;
          image.src = newSrc;
          const changedImageList = imageList.map((img) =>
            img.id !== image.id ? img : image
          );
          setImageList(changedImageList);
        }
        break;
      }
      case 'altText': {
        const parseResult = stringSchema.safeParse(input);
        if (parseResult.success) {
          const newAltText = parseResult.data;
          image.altText = newAltText;
          const changedImageList = imageList.map((img) =>
            img.id !== image.id ? img : image
          );
          setImageList(changedImageList);
        }
        break;
      }
    }
  };

  const canSubmit = (): boolean => {
    for (let i = 0; i < imageList.length; i++) {
      if (imageList[i].src === '' || imageList[i].altText === '') {
        return false;
      }
    }
    return true;
  };

  const disabled = !canSubmit();

  return (
    <>
      {imageList.map((image) => {
        return (
          <div key={image.id} className='Input__carouselInputGroup'>
            <div className='Input__carouselInputGroupTitle'>{`Image ${image.id}:`}</div>
            <TextInput
              label='Image URL'
              placeholder='i.e. https://source.unsplash.com/random'
              onChange={(value) => handleChange(image, 'src', value)}
              value={image.src}
              data-test-id='carousel-image-modal-url-input'
            />
            <TextInput
              label='Alt Text'
              placeholder='Random unsplash image'
              onChange={(value) => handleChange(image, 'altText', value)}
              value={image.altText}
              data-test-id='carousel-image-modal-alt-text-input'
            />
          </div>
        );
      })}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          data-test-id='carousel-image-modal-add-btn'
          disabled={imageList.length >= MAX_IMAGE_COUNT}
          onClick={incrementImageList}
        >
          Add new image
        </Button>
        <Button
          data-test-id='carousel-image-modal-add-btn'
          disabled={imageList.length <= MIN_IMAGE_COUNT}
          onClick={removeLastImageFromList}
        >
          Remove last image
        </Button>
      </div>

      <DialogActions>
        <Button
          data-test-id='carousel-image-modal-confirm-btn'
          disabled={disabled}
          onClick={() => onClick(imageList)}
        >
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertCarouselImagesUploadedDialogBody({
  onClick,
}: {
  onClick: (payload: InsertCarouselImagePayload) => void;
}) {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');

  const isDisabled = src === '';

  const loadImages = (files: FileList | null) => {
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
      <MultiFileInput
        label='Image Upload'
        onChange={loadImages}
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
          onClick={() => onClick([{ id: 1, altText, src }])}
        >
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertCarouselContainerDialog({
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

  const onClick = (payload: InsertCarouselImagePayload) => {
    activeEditor.dispatchCommand(INSERT_CAROUSEL_COMMAND, payload);
    onClose();
  };

  return (
    <>
      {!mode && (
        <DialogButtonsList>
          <Button
            data-test-id='image-modal-option-sample'
            onClick={() =>
              onClick([
                {
                  id: 1,
                  altText: 'Yellow flower in tilt shift lens',
                  src: yellowFlowerImage,
                },
                {
                  id: 2,
                  altText:
                    'Daylight fir trees forest glacier green high ice landscape',
                  src: landscapeImage,
                },
                {
                  id: 3,
                  altText: 'Yellow flower in tilt shift lens',
                  src: yellowFlowerImage,
                },
                {
                  id: 4,
                  altText:
                    'Daylight fir trees forest glacier green high ice landscape',
                  src: landscapeImage,
                },
              ])
            }
          >
            Sample
          </Button>
          <Button
            data-test-id='carousel-modal-option-url'
            onClick={() => setMode('url')}
          >
            URL
          </Button>
          <Button
            data-test-id='carousel-modal-option-file'
            onClick={() => setMode('file')}
          >
            File
          </Button>
        </DialogButtonsList>
      )}
      {mode === 'url' && (
        <InsertCarouselImagesUriDialogBody onClick={onClick} />
      )}
      {mode === 'file' && (
        <InsertCarouselImagesUploadedDialogBody onClick={onClick} />
      )}
    </>
  );
}

const TRANSPARENT_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const img = document.createElement('img');
img.src = TRANSPARENT_IMAGE;

export default function ImageCarouselPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([CarouselContainerNode])) {
      throw new Error(
        'ImageCarouselPlugin: CarouselContainerNode not registered on editor'
      );
    }

    return mergeRegister(
      editor.registerCommand<InsertCarouselImagePayload>(
        INSERT_CAROUSEL_COMMAND,
        (payload) => {
          const newCarouselBlock = $createCarouselBlockNode();
          const newCarouselContainer = $createCarouselContainerNode({
            imageList: payload,
            carouselType: 'slideshow',
          });
          $insertNodes([newCarouselBlock]);

          $insertNodes([newCarouselContainer]);

          // Add new paragraph node below created image carousel
          const newParagraphNode = $createParagraphNode();
          newCarouselBlock.insertAfter(newParagraphNode).selectNext();

          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);

  return null;
}
