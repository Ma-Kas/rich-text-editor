import './fontSize.css';

import { $patchStyleText } from '@lexical/selection';
import { $getSelection, LexicalEditor } from 'lexical';
import * as React from 'react';
import { DropDownItem, FontSizeDropDown } from '../../ui/DropDown';

const MIN_ALLOWED_FONT_SIZE = 8;
const MAX_ALLOWED_FONT_SIZE = 96;
const DEFAULT_FONT_SIZE = 18;

// eslint-disable-next-line no-shadow
enum updateFontSizeType {
  increment = 1,
  decrement,
}

export default function FontSize({
  selectionFontSize,
  disabled,
  editor,
}: {
  selectionFontSize: string;
  disabled: boolean;
  editor: LexicalEditor;
}) {
  const [inputValue, setInputValue] = React.useState<string>(selectionFontSize);

  /**
   * Calculates the new font size based on the update type.
   * @param currentFontSize - The current font size
   * @param updateType - The type of change, either increment or decrement
   * @returns the next font size
   */
  const calculateNextFontSize = (
    currentFontSize: number,
    updateType: updateFontSizeType | null
  ) => {
    if (!updateType) {
      return currentFontSize;
    }

    let updatedFontSize: number = currentFontSize;
    switch (updateType) {
      case updateFontSizeType.decrement:
        switch (true) {
          case currentFontSize > MAX_ALLOWED_FONT_SIZE:
            updatedFontSize = MAX_ALLOWED_FONT_SIZE;
            break;
          case currentFontSize >= 48:
            updatedFontSize -= 12;
            break;
          case currentFontSize >= 24:
            updatedFontSize -= 4;
            break;
          case currentFontSize >= 14:
            updatedFontSize -= 2;
            break;
          case currentFontSize >= 9:
            updatedFontSize -= 1;
            break;
          default:
            updatedFontSize = MIN_ALLOWED_FONT_SIZE;
            break;
        }
        break;

      case updateFontSizeType.increment:
        switch (true) {
          case currentFontSize < MIN_ALLOWED_FONT_SIZE:
            updatedFontSize = MIN_ALLOWED_FONT_SIZE;
            break;
          case currentFontSize < 12:
            updatedFontSize += 1;
            break;
          case currentFontSize < 20:
            updatedFontSize += 2;
            break;
          case currentFontSize < 36:
            updatedFontSize += 4;
            break;
          case currentFontSize <= 60:
            updatedFontSize += 12;
            break;
          default:
            updatedFontSize = MAX_ALLOWED_FONT_SIZE;
            break;
        }
        break;

      default:
        break;
    }
    return updatedFontSize;
  };
  /**
   * Patches the selection with the updated font size.
   */

  const updateFontSizeInSelection = React.useCallback(
    (newFontSize: string | null, updateType: updateFontSizeType | null) => {
      const getNextFontSize = (prevFontSize: string | null): string => {
        if (!prevFontSize) {
          prevFontSize = `${DEFAULT_FONT_SIZE}px`;
        }
        prevFontSize = prevFontSize.slice(0, -2);
        const nextFontSize = calculateNextFontSize(
          Number(prevFontSize),
          updateType
        );
        return `${nextFontSize}px`;
      };

      editor.update(() => {
        if (editor.isEditable()) {
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, {
              'font-size': newFontSize || getNextFontSize,
            });
          }
        }
      });
    },
    [editor]
  );

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const inputValueNumber = Number(inputValue);

    if (['e', 'E', '+', '-'].includes(e.key) || isNaN(inputValueNumber)) {
      e.preventDefault();
      setInputValue('');
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();

      let updatedFontSize = inputValueNumber;
      if (inputValueNumber > MAX_ALLOWED_FONT_SIZE) {
        updatedFontSize = MAX_ALLOWED_FONT_SIZE;
      } else if (inputValueNumber < MIN_ALLOWED_FONT_SIZE) {
        updatedFontSize = MIN_ALLOWED_FONT_SIZE;
      }
      setInputValue(String(updatedFontSize));
      updateFontSizeInSelection(String(updatedFontSize) + 'px', null);
    }
  };

  React.useEffect(() => {
    setInputValue(selectionFontSize);
  }, [selectionFontSize]);

  const style = 'font-size';
  const value = '12px';

  const FONT_SIZE_OPTIONS: [string, string][] = [
    ['10px', '10px'],
    ['11px', '11px'],
    ['12px', '12px'],
    ['13px', '13px'],
    ['14px', '14px'],
    ['15px', '15px'],
    ['16px', '16px'],
    ['17px', '17px'],
    ['18px', '18px'],
    ['19px', '19px'],
    ['20px', '20px'],
  ];

  const handleClick = React.useCallback(
    (option: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, {
            'font-size': option,
          });
        }
      });
    },
    [editor]
  );

  function dropDownActiveClass(active: boolean) {
    if (active) {
      return 'active dropdown-item-active';
    } else {
      return '';
    }
  }

  const focusInput = (event: React.MouseEvent) => {
    const target = event.target;
    if (!target || !(target instanceof HTMLInputElement)) {
      return;
    }
    target.focus();
    target.select();
  };

  const FontSizeInput = () => {
    return (
      <input
        type='number'
        value={inputValue}
        disabled={disabled}
        className='toolbar-item font-size-input'
        min={MIN_ALLOWED_FONT_SIZE}
        max={MAX_ALLOWED_FONT_SIZE}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        onClick={focusInput}
      />
    );
  };

  return (
    <>
      <FontSizeDropDown
        disabled={disabled}
        FontSizeInput={FontSizeInput}
        buttonClassName={'toolbar-item ' + style}
        buttonAriaLabel={'Formatting options for font size'}
      >
        {FONT_SIZE_OPTIONS.map(([option, text]) => (
          <DropDownItem
            className={`item ${dropDownActiveClass(value === option)} ${
              style === 'font-size' ? 'fontsize-item' : ''
            }`}
            onClick={() => handleClick(option)}
            key={option}
          >
            <span className='text'>{text}</span>
          </DropDownItem>
        ))}
      </FontSizeDropDown>
    </>
  );
}
