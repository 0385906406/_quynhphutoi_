"use client";

// Rich text editor đầy đủ — port từ dự án innovation (admin tạo bài viết).
// Khác bản gốc: bỏ i18n (label tiếng Việt cứng), bỏ upload ảnh qua API (chèn ảnh
// bằng URL), bỏ kéo-thả upload. Giữ nguyên toolbar & giao diện rich-text-editor__*.
import { useEffect, useRef, useState, startTransition } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import YoutubeExtension from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CharacterCount from "@tiptap/extension-character-count";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import Typography from "@tiptap/extension-typography";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Details from "@tiptap/extension-details";
import DetailsSummary from "@tiptap/extension-details-summary";
import DetailsContent from "@tiptap/extension-details-content";

import { RteLinkModal } from "./rte/RteLinkModal";
import { RteVideoModal } from "./rte/RteVideoModal";
import { RteColorPicker } from "./rte/RteColorPicker";
import { GalleryNode } from "./rte/RteGalleryNode";

// ── Type helper cho các command extension chưa có trong @types ──
interface RteChain {
  run(): boolean; focus(): RteChain;
  setParagraph(): RteChain; toggleHeading(attrs: { level: 1 | 2 | 3 | 4 }): RteChain;
  toggleBold(): RteChain; toggleItalic(): RteChain; toggleUnderline(): RteChain; toggleStrike(): RteChain; toggleCode(): RteChain;
  setTextAlign(align: "left" | "center" | "right" | "justify"): RteChain;
  toggleSuperscript(): RteChain; toggleSubscript(): RteChain;
  toggleBulletList(): RteChain; toggleOrderedList(): RteChain; toggleBlockquote(): RteChain; toggleCodeBlock(): RteChain;
  setImage(attrs: { src: string; alt: string }): RteChain; setHorizontalRule(): RteChain;
  undo(): RteChain; redo(): RteChain; insertGallery(): RteChain;
  insertTable(opts: { rows: number; cols: number; withHeaderRow: boolean }): RteChain;
  addRowBefore(): RteChain; addRowAfter(): RteChain; addColumnBefore(): RteChain; addColumnAfter(): RteChain;
  deleteRow(): RteChain; deleteColumn(): RteChain; deleteTable(): RteChain; mergeOrSplit(): RteChain;
  toggleTaskList(): RteChain; setDetails(): RteChain;
}
interface RteEditor {
  getAttributes(name: string): Record<string, unknown>;
  isActive(name: string, attrs?: Record<string, unknown>): boolean;
  getHTML(): string;
  chain(): { focus(): RteChain };
  commands: { setContent(html: string, emitUpdate?: boolean): void };
  on(event: "update", handler: () => void): void;
  off(event: "update", handler: () => void): void;
}
function rte(editor: Editor): RteEditor { return editor as unknown as RteEditor; }

type Props = { value: string; onChange: (html: string) => void; placeholder?: string };

/* ── SVG icons (port nguyên) ── */
const I = (p: React.SVGProps<SVGSVGElement>) => ({ width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...p });
const IcBold = () => <svg {...I({})}><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>;
const IcItalic = () => <svg {...I({})}><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>;
const IcUnderline = () => <svg {...I({})}><path d="M6 3v7a6 6 0 0 0 12 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>;
const IcStrike = () => <svg {...I({})}><path d="M17.3 12H6.7"/><path d="M12 3a4 4 0 0 0-4 4c0 1.5.83 2.7 2 3.3"/><path d="M12 21a4 4 0 0 0 4-4c0-1.5-.83-2.7-2-3.3"/></svg>;
const IcCode = () => <svg {...I({})}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const IcAlignLeft = () => <svg {...I({})}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>;
const IcAlignCenter = () => <svg {...I({})}><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>;
const IcAlignRight = () => <svg {...I({})}><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>;
const IcAlignJustify = () => <svg {...I({})}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IcLink = () => <svg {...I({})}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IcImage = () => <svg {...I({})}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IcVideo = () => <svg {...I({})}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
const IcHr = () => <svg {...I({})}><line x1="3" y1="12" x2="21" y2="12"/></svg>;
const IcBulletList = () => <svg {...I({})}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></svg>;
const IcOrderedList = () => <svg {...I({})}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4" strokeWidth={2}/><path d="M4 10h2" strokeWidth={2}/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeWidth={2}/></svg>;
const IcBlockquote = () => <svg {...I({ fill: "currentColor", stroke: "none" })}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>;
const IcCodeBlock = () => <svg {...I({})}><rect x="2" y="3" width="20" height="18" rx="2"/><path d="m8 9-3 3 3 3"/><path d="m16 9 3 3-3 3"/><line x1="11" y1="9" x2="13" y2="15"/></svg>;
const IcTable = () => <svg {...I({})}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>;
const IcUndo = () => <svg {...I({})}><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>;
const IcRedo = () => <svg {...I({})}><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>;
const IcGallery = () => <svg {...I({})}><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const IcFull = () => <svg {...I({})}><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>;
const IcExitFull = () => <svg {...I({})}><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>;
const IcTextColor = () => <svg {...I({})}><path d="M4 20h16"/><path d="m6 16 6-12 6 12"/><path d="M8 12h8"/></svg>;
const IcHighlight = () => <svg {...I({})}><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>;
const IcSuper = () => <svg {...I({})}><path d="m4 19 8-8"/><path d="m12 19-8-8"/><path d="M20 12h-4c0-1.5.44-2 1.5-2.5S20 8.33 20 7.25c0-.47-.17-.93-.46-1.29a2 2 0 0 0-1.62-.71c-.69 0-1.58.32-1.92 1.16"/></svg>;
const IcSub = () => <svg {...I({})}><path d="m4 5 8 8"/><path d="m12 5-8 8"/><path d="M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14.25c0-.47-.17-.93-.46-1.29a2 2 0 0 0-1.62-.71c-.69 0-1.58.32-1.92 1.16"/></svg>;
const IcChevron = () => <svg {...I({ width: 10, height: 10, strokeWidth: 3 })}><polyline points="6 9 12 15 18 9"/></svg>;
const IcTaskList = () => <svg {...I({})}><rect x="3" y="5" width="4" height="4" rx="1"/><polyline points="3.8 7 4.8 8 6.5 5.5"/><line x1="11" y1="7" x2="21" y2="7"/><rect x="3" y="13" width="4" height="4" rx="1"/><line x1="11" y1="15" x2="21" y2="15"/></svg>;
const IcDetails = () => <svg {...I({})}><polyline points="9 18 15 12 9 6"/><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2}/></svg>;

function syncCount(editor: Editor, setW: (n: number) => void, setC: (n: number) => void) {
  const text = (editor as unknown as { state: { doc: { textContent: string } } }).state.doc.textContent;
  const trimmed = text.trim();
  setW(trimmed ? trimmed.split(/\s+/).length : 0);
  setC(text.length);
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [colorMode, setColorMode] = useState<"text" | "highlight" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTableInsert, setShowTableInsert] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const headingMenuRef = useRef<HTMLDivElement>(null);
  const tableInsertRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] }, codeBlock: { HTMLAttributes: { class: "language-text" } } }),
      LinkExtension.configure({ openOnClick: false, autolink: true, protocols: ["http", "https", "mailto", "tel"], HTMLAttributes: { rel: "noopener noreferrer" } }),
      ImageExtension.configure({ allowBase64: false, HTMLAttributes: { loading: "lazy", class: "rte-image" } }),
      YoutubeExtension.configure({ controls: true, nocookie: true, modestBranding: true }),
      Placeholder.configure({ placeholder: placeholder ?? "Nhập nội dung…" }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle, Color, Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: false }), TableRow, TableHeader, TableCell,
      CharacterCount, Superscript, Subscript, Typography,
      GalleryNode,
      TaskList, TaskItem.configure({ nested: true }),
      Details.configure({ persist: true, HTMLAttributes: { class: "rte-details" } }), DetailsSummary, DetailsContent,
    ],
    content: value,
    editorProps: { attributes: { class: "rich-text-editor__content" } },
    onUpdate: ({ editor: ed }) => {
      const html = ed.isEmpty ? "" : ed.getHTML();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => { startTransition(() => onChangeRef.current(html)); }, 250);
    },
  });

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const empty = (h: string) => !h || h === "<p></p>";
    if (!(empty(value) && empty(current)) && (value ?? "") !== current && !editor.isFocused) {
      rte(editor).commands.setContent(value ?? "", false);
    }
    syncCount(editor, setWordCount, setCharCount);
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    const handler = () => syncCount(editor, setWordCount, setCharCount);
    rte(editor).on("update", handler);
    return () => rte(editor).off("update", handler);
  }, [editor]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (headingMenuRef.current && !headingMenuRef.current.contains(e.target as Node)) setShowHeadingMenu(false);
      if (tableInsertRef.current && !tableInsertRef.current.contains(e.target as Node)) setShowTableInsert(false);
      if (imageInputRef.current && !imageInputRef.current.contains(e.target as Node)) setShowImageInput(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && isFullscreen) setIsFullscreen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  if (!editor) return <div className="rich-text-editor rich-text-editor--loading" aria-hidden />;

  const r = rte(editor);
  const active = (name: string, attrs?: Record<string, unknown>) => editor.isActive(name, attrs);
  const headingLabel = active("heading", { level: 1 }) ? "H1" : active("heading", { level: 2 }) ? "H2" : active("heading", { level: 3 }) ? "H3" : active("heading", { level: 4 }) ? "H4" : "Đoạn";
  const activeTextColor = (r.getAttributes("textStyle").color as string | undefined) ?? "";
  const activeHighlightColor = (r.getAttributes("highlight").color as string | undefined) ?? "";
  const inTable = editor.isActive("table");

  // Chèn ảnh bằng popover input inline (không dùng window.prompt — một số webview di động chặn prompt).
  const insertImage = () => {
    const url = imageUrl.trim();
    if (url) r.chain().focus().setImage({ src: url, alt: "" }).run();
    setImageUrl("");
    setShowImageInput(false);
  };
  const insertTable = () => { r.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run(); setShowTableInsert(false); };

  return (
    <>
      <div className={`rich-text-editor${isFullscreen ? " rich-text-editor--fullscreen" : ""}`}>
        <div className="rich-text-editor__toolbar" role="toolbar" aria-label="Định dạng">
          {/* Heading dropdown */}
          <Group>
            <div ref={headingMenuRef} className="rte-heading-wrap">
              <Btn label="Kiểu chữ" active={active("heading")} onClick={() => setShowHeadingMenu((v) => !v)}>
                <span style={{ fontSize: 11, minWidth: 30 }}>{headingLabel}</span><IcChevron />
              </Btn>
              {showHeadingMenu && (
                <div className="rte-heading-dropdown">
                  {[
                    { label: "Đoạn văn", action: () => r.chain().focus().setParagraph().run(), isActive: !active("heading") },
                    { label: "Tiêu đề 1 (H1)", action: () => r.chain().focus().toggleHeading({ level: 1 }).run(), isActive: active("heading", { level: 1 }) },
                    { label: "Tiêu đề 2 (H2)", action: () => r.chain().focus().toggleHeading({ level: 2 }).run(), isActive: active("heading", { level: 2 }) },
                    { label: "Tiêu đề 3 (H3)", action: () => r.chain().focus().toggleHeading({ level: 3 }).run(), isActive: active("heading", { level: 3 }) },
                    { label: "Tiêu đề 4 (H4)", action: () => r.chain().focus().toggleHeading({ level: 4 }).run(), isActive: active("heading", { level: 4 }) },
                  ].map((it) => (
                    <button key={it.label} type="button" className={`rte-heading-dropdown__item${it.isActive ? " is-active" : ""}`}
                      onClick={() => { it.action(); setShowHeadingMenu(false); }}>{it.label}</button>
                  ))}
                </div>
              )}
            </div>
          </Group>

          {/* Inline */}
          <Group>
            <Btn label="Đậm (Ctrl+B)" active={active("bold")} onClick={() => r.chain().focus().toggleBold().run()}><IcBold /></Btn>
            <Btn label="Nghiêng (Ctrl+I)" active={active("italic")} onClick={() => r.chain().focus().toggleItalic().run()}><IcItalic /></Btn>
            <Btn label="Gạch chân (Ctrl+U)" active={active("underline")} onClick={() => r.chain().focus().toggleUnderline().run()}><IcUnderline /></Btn>
            <Btn label="Gạch ngang" active={active("strike")} onClick={() => r.chain().focus().toggleStrike().run()}><IcStrike /></Btn>
            <Btn label="Mã inline" active={active("code")} onClick={() => r.chain().focus().toggleCode().run()}><IcCode /></Btn>
          </Group>

          {/* Color / Highlight */}
          <Group>
            <div className="rte-color-picker-wrap">
              <Btn label="Màu chữ" active={!!activeTextColor || colorMode === "text"} onClick={() => setColorMode((v) => v === "text" ? null : "text")}>
                <IcTextColor /><span className="rte-color-dot" style={{ backgroundColor: activeTextColor || "transparent" }} />
              </Btn>
              {colorMode === "text" && <RteColorPicker editor={editor} mode="text" onClose={() => setColorMode(null)} />}
            </div>
            <div className="rte-color-picker-wrap">
              <Btn label="Tô nền chữ" active={active("highlight") || colorMode === "highlight"} onClick={() => setColorMode((v) => v === "highlight" ? null : "highlight")}>
                <IcHighlight /><span className="rte-color-dot" style={{ backgroundColor: activeHighlightColor || "transparent" }} />
              </Btn>
              {colorMode === "highlight" && <RteColorPicker editor={editor} mode="highlight" onClose={() => setColorMode(null)} />}
            </div>
          </Group>

          {/* Align */}
          <Group>
            <Btn label="Căn trái" active={active("paragraph", { textAlign: "left" })} onClick={() => r.chain().focus().setTextAlign("left").run()}><IcAlignLeft /></Btn>
            <Btn label="Căn giữa" active={active("paragraph", { textAlign: "center" })} onClick={() => r.chain().focus().setTextAlign("center").run()}><IcAlignCenter /></Btn>
            <Btn label="Căn phải" active={active("paragraph", { textAlign: "right" })} onClick={() => r.chain().focus().setTextAlign("right").run()}><IcAlignRight /></Btn>
            <Btn label="Căn đều" active={active("paragraph", { textAlign: "justify" })} onClick={() => r.chain().focus().setTextAlign("justify").run()}><IcAlignJustify /></Btn>
          </Group>

          {/* Insert */}
          <Group>
            <div ref={tableInsertRef} className="rte-heading-wrap">
              <Btn label="Bảng" active={inTable || showTableInsert} onClick={() => setShowTableInsert((v) => !v)}><IcTable /></Btn>
              {showTableInsert && (
                <div className="rte-heading-dropdown" style={{ width: 180, padding: "12px 14px" }}>
                  <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700 }}>Chèn bảng</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Số hàng</label>
                      <input type="number" min={1} max={20} value={tableRows} onChange={(e) => setTableRows(Math.max(1, Math.min(20, Number(e.target.value))))}
                        style={{ width: "100%", padding: "4px 6px", border: "1px solid var(--gray-200)", borderRadius: 6, fontSize: 13, outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Số cột</label>
                      <input type="number" min={1} max={10} value={tableCols} onChange={(e) => setTableCols(Math.max(1, Math.min(10, Number(e.target.value))))}
                        style={{ width: "100%", padding: "4px 6px", border: "1px solid var(--gray-200)", borderRadius: 6, fontSize: 13, outline: "none" }} />
                    </div>
                  </div>
                  <button type="button" onClick={insertTable}
                    style={{ width: "100%", padding: "6px 0", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Chèn</button>
                </div>
              )}
            </div>
            <Btn label="Chèn link (Ctrl+K)" active={active("link")} onClick={() => setShowLinkModal(true)}><IcLink /></Btn>
            <div ref={imageInputRef} className="rte-heading-wrap">
              <Btn label="Chèn ảnh (URL)" active={showImageInput} onClick={() => setShowImageInput((v) => !v)}><IcImage /></Btn>
              {showImageInput && (
                <div className="rte-heading-dropdown" style={{ width: 250, padding: "12px 14px" }}>
                  <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700 }}>Chèn ảnh từ URL</p>
                  <input
                    type="url"
                    inputMode="url"
                    autoFocus
                    placeholder="https://…/anh.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertImage(); } }}
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--gray-200)", borderRadius: 6, fontSize: 13, outline: "none", marginBottom: 10 }}
                  />
                  <button type="button" onClick={insertImage} disabled={!imageUrl.trim()}
                    style={{ width: "100%", padding: "6px 0", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: imageUrl.trim() ? "pointer" : "not-allowed", opacity: imageUrl.trim() ? 1 : 0.5 }}>Chèn</button>
                </div>
              )}
            </div>
            <Btn label="Bộ ảnh (gallery)" active={active("gallery")} onClick={() => r.chain().focus().insertGallery().run()}><IcGallery /></Btn>
            <Btn label="Chèn video YouTube" onClick={() => setShowVideoModal(true)}><IcVideo /></Btn>
            <Btn label="Đường kẻ ngang" onClick={() => r.chain().focus().setHorizontalRule().run()}><IcHr /></Btn>
          </Group>

          {/* Lists */}
          <Group>
            <Btn label="Danh sách chấm" active={active("bulletList")} onClick={() => r.chain().focus().toggleBulletList().run()}><IcBulletList /></Btn>
            <Btn label="Danh sách số" active={active("orderedList")} onClick={() => r.chain().focus().toggleOrderedList().run()}><IcOrderedList /></Btn>
            <Btn label="Danh sách công việc" active={active("taskList")} onClick={() => r.chain().focus().toggleTaskList().run()}><IcTaskList /></Btn>
            <Btn label="Trích dẫn" active={active("blockquote")} onClick={() => r.chain().focus().toggleBlockquote().run()}><IcBlockquote /></Btn>
            <Btn label="Khối mã" active={active("codeBlock")} onClick={() => r.chain().focus().toggleCodeBlock().run()}><IcCodeBlock /></Btn>
            <Btn label="Khối thu gọn" active={active("details")} onClick={() => r.chain().focus().setDetails().run()}><IcDetails /></Btn>
          </Group>

          {/* History + fullscreen */}
          <Group>
            <Btn label="Hoàn tác (Ctrl+Z)" onClick={() => r.chain().focus().undo().run()}><IcUndo /></Btn>
            <Btn label="Làm lại (Ctrl+Y)" onClick={() => r.chain().focus().redo().run()}><IcRedo /></Btn>
            <Btn label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"} active={isFullscreen} onClick={() => setIsFullscreen((v) => !v)}>{isFullscreen ? <IcExitFull /> : <IcFull />}</Btn>
          </Group>
        </div>

        {/* Table context bar */}
        {inTable && (
          <div className="rich-text-editor__table-bar" role="toolbar" aria-label="Thao tác bảng">
            <Group>
              <Btn label="Thêm hàng trên" onClick={() => r.chain().focus().addRowBefore().run()}>↑ Hàng</Btn>
              <Btn label="Thêm hàng dưới" onClick={() => r.chain().focus().addRowAfter().run()}>↓ Hàng</Btn>
              <Btn label="Thêm cột trái" onClick={() => r.chain().focus().addColumnBefore().run()}>← Cột</Btn>
              <Btn label="Thêm cột phải" onClick={() => r.chain().focus().addColumnAfter().run()}>→ Cột</Btn>
            </Group>
            <Group><Btn label="Gộp/tách ô" onClick={() => r.chain().focus().mergeOrSplit().run()}>Gộp ô</Btn></Group>
            <Group>
              <Btn label="Xoá hàng" onClick={() => r.chain().focus().deleteRow().run()}><span style={{ color: "#dc2626" }}>Xoá hàng</span></Btn>
              <Btn label="Xoá cột" onClick={() => r.chain().focus().deleteColumn().run()}><span style={{ color: "#dc2626" }}>Xoá cột</span></Btn>
              <Btn label="Xoá bảng" onClick={() => r.chain().focus().deleteTable().run()}><span style={{ color: "#dc2626" }}>Xoá bảng</span></Btn>
            </Group>
          </div>
        )}

        <EditorContent editor={editor} />

        <div className="rich-text-editor__footer">
          <div className="rich-text-editor__footer-left">
            <Btn label="Chỉ số trên" active={active("superscript")} onClick={() => r.chain().focus().toggleSuperscript().run()}><IcSuper /></Btn>
            <Btn label="Chỉ số dưới" active={active("subscript")} onClick={() => r.chain().focus().toggleSubscript().run()}><IcSub /></Btn>
          </div>
          <span className="rich-text-editor__word-count">{wordCount} từ · {charCount} ký tự</span>
        </div>
        <p className="rich-text-editor__hint">Có thể dán nội dung từ Word/Google Docs — định dạng sẽ được làm sạch khi lưu.</p>
      </div>

      {showLinkModal && <RteLinkModal editor={editor} onClose={() => setShowLinkModal(false)} />}
      {showVideoModal && <RteVideoModal editor={editor} onClose={() => setShowVideoModal(false)} />}
    </>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="rich-text-editor__group">{children}</div>;
}
function Btn({ children, label, active, onClick }: { children: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`rich-text-editor__btn${active ? " is-active" : ""}`} title={label} aria-label={label} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}
