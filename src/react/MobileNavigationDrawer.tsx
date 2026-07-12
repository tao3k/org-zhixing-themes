import * as Dialog from "@radix-ui/react-dialog";
import type { RefObject } from "react";
import type { ContentShellData } from "../services/contentServices";
import { NavigationItems } from "./NavigationItems";

export default function MobileNavigationDrawer({
  open,
  onOpenChange,
  returnFocusRef,
  shell,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  shell: ContentShellData;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="mobile-nav-overlay" />
        <Dialog.Content
          id="mobile-navigation-drawer"
          className="mobile-nav-drawer"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current?.focus();
          }}
        >
          <div className="mobile-nav-heading">
            <Dialog.Title>Navigate Zhixing</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="mobile-nav-close" aria-label="Close navigation">
                ×
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mobile-nav-description">
            Choose a view from the life archive.
          </Dialog.Description>
          <nav className="mobile-nav-list" aria-label="Mobile life archive navigation">
            <NavigationItems shell={shell} onNavigate={() => onOpenChange(false)} />
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
