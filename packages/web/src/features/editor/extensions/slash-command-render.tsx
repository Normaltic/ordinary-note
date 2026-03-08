import { createRoot } from 'react-dom/client';
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import {
  SlashCommandMenu,
  type SlashCommandMenuRef,
} from '../components/SlashCommandMenu';
import type { SlashCommandItem } from './slash-commands';

export function slashCommandRender(): ReturnType<
  NonNullable<SuggestionOptions<SlashCommandItem>['render']>
> {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;
  let menuRef: SlashCommandMenuRef | null = null;

  return {
    onStart(props: SuggestionProps<SlashCommandItem>) {
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
      root.render(
        <SlashCommandMenu
          {...props}
          ref={(r) => {
            menuRef = r;
          }}
        />,
      );
    },

    onUpdate(props: SuggestionProps<SlashCommandItem>) {
      root?.render(
        <SlashCommandMenu
          {...props}
          ref={(r) => {
            menuRef = r;
          }}
        />,
      );
    },

    onKeyDown(props) {
      if (props.event.key === 'Escape') {
        root?.unmount();
        if (container) {
          document.body.removeChild(container);
          container = null;
        }
        return true;
      }
      return menuRef?.onKeyDown(props) ?? false;
    },

    onExit() {
      root?.unmount();
      if (container) {
        document.body.removeChild(container);
        container = null;
      }
    },
  };
}
