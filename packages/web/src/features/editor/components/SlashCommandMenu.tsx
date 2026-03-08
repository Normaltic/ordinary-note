import {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { createPortal } from 'react-dom';
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import type { SlashCommandItem } from '../extensions/slash-commands';

export interface SlashCommandMenuRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

export const SlashCommandMenu = forwardRef<
  SlashCommandMenuRef,
  SuggestionProps<SlashCommandItem>
>(function SlashCommandMenu(props, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useLayoutEffect(() => {
    const item = menuRef.current?.querySelector('[data-selected="true"]');
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const selectItem = useCallback(
    (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command(item);
      }
    },
    [props],
  );

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      if (event.key === 'Escape') {
        return true;
      }
      return false;
    },
  }));

  if (props.items.length === 0) return null;

  const rect = props.clientRect?.();
  if (!rect) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="slash-command-menu"
      style={{
        top: rect.bottom + 4,
        left: rect.left,
      }}
    >
      {props.items.map((item, index) => (
        <button
          key={item.title}
          type="button"
          data-selected={index === selectedIndex}
          className={`slash-command-item ${index === selectedIndex ? 'is-selected' : ''}`}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span className="slash-command-title">{item.title}</span>
        </button>
      ))}
    </div>,
    document.body,
  );
});
