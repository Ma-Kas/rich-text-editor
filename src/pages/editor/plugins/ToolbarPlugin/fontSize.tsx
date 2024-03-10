import './fontSize.css';

import { $patchStyleText } from '@lexical/selection';
import { $getSelection, LexicalEditor } from 'lexical';
import { useState, useEffect, useCallback } from 'react';
import { DropDownItem, FontSizeDropDown } from '../../ui/DropDown';
import { FONT_SIZE_OPTIONS } from './fontSize.config';

function FontSize({
  selectionFontSize,
  disabled,
  editor,
}: {
  selectionFontSize: string;
  disabled: boolean;
  editor: LexicalEditor;
}) {
  const [inputValue, setInputValue] = useState<string>(selectionFontSize);

  const handleClick = useCallback(
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

  useEffect(() => {
    setInputValue(selectionFontSize);
  }, [selectionFontSize]);

  return (
    <>
      <FontSizeDropDown
        value={inputValue}
        disabled={disabled}
        buttonClassName={'toolbar-item font-size'}
        buttonAriaLabel={'Formatting options for font size'}
      >
        {FONT_SIZE_OPTIONS.map(([option, text]) => (
          <DropDownItem
            className={`item ${dropDownActiveClass(inputValue === option.slice(0, -2))} ${'fontsize-item'}`}
            onClick={() => handleClick(option)}
            key={option}
          >
            <span className='text'>{text.slice(0, -2)}</span>
          </DropDownItem>
        ))}
      </FontSizeDropDown>
    </>
  );
}

export default FontSize;
