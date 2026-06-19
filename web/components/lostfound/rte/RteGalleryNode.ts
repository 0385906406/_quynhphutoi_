import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { RteGalleryView } from "./RteGalleryView";

export type GalleryImage = { src: string; alt: string };

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    gallery: { insertGallery: () => ReturnType };
  }
}

export const GalleryNode = Node.create({
  name: "gallery",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      images: { default: [] },
    };
  },

  parseHTML() {
    return [{
      tag: "figure.rte-gallery",
      getAttrs: (dom) => {
        const el = dom as HTMLElement;
        const imgs = el.querySelectorAll("img");
        return {
          images: Array.from(imgs).map((img) => ({
            src: img.getAttribute("src") ?? "",
            alt: img.getAttribute("alt") ?? "",
          })),
        };
      },
    }];
  },

  renderHTML({ node }) {
    const images: GalleryImage[] = node.attrs.images ?? [];
    const children = images.map((img) => [
      "img",
      mergeAttributes({ src: img.src, alt: img.alt || "", loading: "lazy", class: "rte-gallery__img" }),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ["figure", mergeAttributes({ class: "rte-gallery" }), ...children] as any;
  },

  addNodeView() {
    return ReactNodeViewRenderer(RteGalleryView);
  },

  addCommands() {
    return {
      insertGallery: () => ({ commands }) =>
        commands.insertContent({ type: this.name, attrs: { images: [] } }),
    };
  },
});
