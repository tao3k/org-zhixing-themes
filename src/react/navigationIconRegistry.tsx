import type { Icon, IconProps } from "@phosphor-icons/react";
import { AirplaneTakeoffIcon } from "@phosphor-icons/react/dist/csr/AirplaneTakeoff";
import { BrainIcon } from "@phosphor-icons/react/dist/csr/Brain";
import { BooksIcon } from "@phosphor-icons/react/dist/csr/Books";
import { CalendarCheckIcon } from "@phosphor-icons/react/dist/csr/CalendarCheck";
import { CirclesThreePlusIcon } from "@phosphor-icons/react/dist/csr/CirclesThreePlus";
import { ImagesIcon } from "@phosphor-icons/react/dist/csr/Images";
import { NoteIcon } from "@phosphor-icons/react/dist/csr/Note";
import { PaletteIcon } from "@phosphor-icons/react/dist/csr/Palette";
import type { ComponentType } from "react";

export type NavigationIconKey =
  | "agenda"
  | "blogs"
  | "fallback"
  | "gallery"
  | "memory"
  | "notes"
  | "themes"
  | "travel";

export const navigationIconRegistry: Record<NavigationIconKey, Icon> = {
  blogs: BooksIcon,
  gallery: ImagesIcon,
  notes: NoteIcon,
  memory: BrainIcon,
  travel: AirplaneTakeoffIcon,
  agenda: CalendarCheckIcon,
  themes: PaletteIcon,
  fallback: CirclesThreePlusIcon,
};

export const navigationIconFor = (key: string): ComponentType<IconProps> =>
  navigationIconRegistry[key as NavigationIconKey] ?? navigationIconRegistry.fallback;

export const navigationIconKeyForView = (view: string): NavigationIconKey => {
  switch (view) {
    case "blog":
      return "blogs";
    case "gallery":
      return "gallery";
    case "records":
      return "notes";
    case "memory":
      return "memory";
    case "travel":
      return "travel";
    case "agenda":
      return "agenda";
    default:
      return "fallback";
  }
};
