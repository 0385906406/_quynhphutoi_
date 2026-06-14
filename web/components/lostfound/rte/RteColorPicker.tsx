"use client";

// Bảng chọn màu (chữ / highlight) — port từ dự án innovation, bỏ i18n.
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

const PALETTE: string[][] = [
  ["#000000","#434343","#666666","#999999","#b7b7b7","#cccccc","#d9d9d9","#efefef","#f3f3f3","#ffffff"],
  ["#ff0000","#ff4444","#ff6666","#ff8888","#ffaaaa","#ffcccc","#ffe0e0","#fff0f0","#cc0000","#990000"],
  ["#ff6600","#ff8800","#ffaa00","#ffcc00","#ffdd00","#ffee00","#ffff00","#ffffaa","#cc6600","#996600"],
  ["#00aa00","#00cc00","#22cc22","#44dd44","#66ee66","#88ee88","#aaffaa","#ccffcc","#007700","#005500"],
  ["#006666","#008888","#00aaaa","#00cccc","#00dddd","#00eeee","#aaffff","#ccffff","#004444","#002222"],
  ["#0000ff","#2244cc","#3366dd","#4488ee","#6699ff","#88aaff","#aabbff","#ccddff","#001199","#000066"],
  ["#6600cc","#7711dd","#8833ee","#9944ff","#aa66ff","#bb88ff","#ccaaff","#ddccff","#440099","#220066"],
  ["#cc0066","#dd0077","#ee0088","#ff00aa","#ff44bb","#ff88cc","#ffaadd","#ffccee","#880044","#550033"],
];

type Props = { editor: Editor; mode: "text" | "highlight"; onClose: () => void };

export function RteColorPicker({ editor, mode, onClose }: Props) {
  type E = { getAttributes(name: string): Record<string, unknown> };
  const e = editor as unknown as E;
  const getCurrentColor = (): string =>
    mode === "text"
      ? (e.getAttributes("textStyle").color as string | undefined) ?? ""
      : (e.getAttributes("highlight").color as string | undefined) ?? "";

  const [hex, setHex] = useState(getCurrentColor);
  const [hexInput, setHexInput] = useState(getCurrentColor);
  const wrapRef = useRef<HTMLDivElement>(null);
  const nativeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDown(ev: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(ev.target as Node)) onClose();
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [onClose]);

  function applyColor(color: string) {
    setHex(color); setHexInput(color);
    if (mode === "text") {
      (editor.chain().focus() as unknown as { setColor(c: string): { run(): void } }).setColor(color).run();
    } else {
      (editor.chain().focus() as unknown as { setHighlight(o: { color: string }): { run(): void } }).setHighlight({ color }).run();
    }
  }

  function reset() {
    if (mode === "text") {
      (editor.chain().focus() as unknown as { unsetColor(): { run(): void } }).unsetColor().run();
    } else {
      (editor.chain().focus() as unknown as { unsetHighlight(): { run(): void } }).unsetHighlight().run();
    }
    setHex(""); setHexInput(""); onClose();
  }

  function handleHexInput(val: string) {
    setHexInput(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) applyColor(val);
  }

  return (
    <div ref={wrapRef} className="rte-color-picker">
      <div className="rte-color-picker__palette">
        {PALETTE.map((row, ri) => (
          <div key={ri} className="rte-color-picker__palette-row">
            {row.map((c) => (
              <button key={c} type="button" title={c} style={{ backgroundColor: c }}
                className={`rte-color-picker__swatch${hex.toLowerCase() === c.toLowerCase() ? " is-active" : ""}`}
                onClick={() => { applyColor(c); onClose(); }} />
            ))}
          </div>
        ))}
      </div>
      <div className="rte-color-picker__divider" />
      <div className="rte-color-picker__custom-row">
        <div className="rte-color-picker__native-wrap" title="Màu tuỳ chọn" onClick={() => nativeRef.current?.click()}>
          <div className="rte-color-picker__native-preview" style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#ffffff" }} />
          <span className="rte-color-picker__native-label">+</span>
          <input ref={nativeRef} type="color" className="rte-color-picker__native-input"
            value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000"} onChange={(ev) => applyColor(ev.target.value)} />
        </div>
        <input type="text" className="rte-color-picker__hex-input" value={hexInput} placeholder="#000000"
          maxLength={7} spellCheck={false} onChange={(ev) => handleHexInput(ev.target.value)} />
        <button type="button" className="rte-color-picker__apply-btn"
          onClick={() => { if (/^#[0-9a-fA-F]{6}$/.test(hexInput)) { applyColor(hexInput); onClose(); } }}>✓</button>
      </div>
      <button type="button" className="rte-color-picker__reset" onClick={reset}>Xoá màu</button>
    </div>
  );
}
