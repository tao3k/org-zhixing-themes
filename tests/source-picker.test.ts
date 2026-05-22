import { afterEach, describe, expect, it, vi } from "vitest";
import type { SourceItem } from "../src/config";
import {
  destroySourcePicker,
  renderSourcePickerToDom,
  sourcePickerChangeEvent,
  type SourcePickerChangeDetail,
} from "../src/sourcePicker";

describe("source picker", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("uses a styled Zag select surface instead of the native select popup", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    const changes: string[] = [];
    root.addEventListener(sourcePickerChangeEvent, (event) => {
      changes.push((event as CustomEvent<SourcePickerChangeDetail>).detail.sourceFile);
    });

    renderSourcePickerToDom(root, sources(), "travel.org");

    expect(root.querySelector("select")).toBeNull();
    expect(root.querySelector(".source-select")?.textContent).toContain("Travel");

    const trigger = root.querySelector<HTMLButtonElement>(".source-select");
    await vi.waitFor(() => expect(trigger?.disabled).toBe(false));

    trigger?.click();
    await vi.waitFor(() => expect(root.querySelectorAll(".source-select-item")).toHaveLength(3));

    const selected = root.querySelector<HTMLElement>('.source-select-item[data-selected="true"]');
    expect(selected?.textContent).toContain("Travel");

    root.querySelectorAll<HTMLElement>(".source-select-item").item(0).click();
    await vi.waitFor(() => expect(changes).toEqual(["org-syntax-atlas.org"]));
    destroySourcePicker(root);
  });
});

const sources = (): SourceItem[] => [
  {
    id: "atlas",
    name: "Syntax Atlas",
    file: "org-syntax-atlas.org",
    sourceFile: "blog/org-syntax-atlas.org",
  },
  {
    id: "travel",
    name: "Travel",
    file: "travel.org",
    sourceFile: "blog/travel.org",
  },
  {
    id: "notes",
    name: "Notes",
    file: "org-zhixing-demo.org",
    sourceFile: "blog/org-zhixing-demo.org",
  },
];
