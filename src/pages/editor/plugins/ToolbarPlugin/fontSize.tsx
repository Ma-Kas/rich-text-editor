import './fontSize.css';

import { $patchStyleText } from '@lexical/selection';
import { $getSelection, BaseSelection, LexicalEditor } from 'lexical';
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

  // Get line height and font size for manually changed (= inline overwritten)
  // font size to inline style block;
  // Handle case where inline style would match default style, thus no overwrite
  // should take place
  const calculateInlineStyle = useCallback(
    (
      selection: BaseSelection,
      option: string
    ): Record<
      string,
      string | ((currentStyleValue: string | null) => string) | null
    > => {
      const selectedDOMElement = editor.getElementByKey(
        selection.getNodes()[0].__key
      );
      const newStyle = { 'font-size': '', 'line-height': '' };
      if (selectedDOMElement && selectedDOMElement.parentElement) {
        const computedStyle = window.getComputedStyle(
          selectedDOMElement.parentElement
        );
        const overwrittenFontSize = Number(option.slice(0, -2));
        const lineHeightFactor =
          Number(computedStyle.lineHeight.slice(0, -2)) /
          Number(computedStyle.fontSize.slice(0, -2));
        const newLineHeight = overwrittenFontSize * lineHeightFactor + 'px';
        if (computedStyle.fontSize !== option) {
          newStyle['font-size'] = option;
        }
        if (computedStyle.lineHeight !== newLineHeight) {
          newStyle['line-height'] = newLineHeight;
        }
      }
      return newStyle;
    },
    [editor]
  );

  // Apply inline style to selected block according to font-size dropdown
  const handleClick = useCallback(
    (option: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection !== null) {
          const newStyle = calculateInlineStyle(selection, option);
          $patchStyleText(selection, newStyle);
        }
      });
    },
    [editor, calculateInlineStyle]
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
