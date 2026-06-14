"use client";

// Tra cứu sáp nhập 2025: chọn 1 XÃ MỚI (Select2 có tìm kiếm) → hiện các đơn vị CŨ gộp vào.
// Bấm 1 đơn vị cũ → xem chi tiết (cũ → mới). Toàn bộ gói gọn theo bề rộng của ô chọn.
import { useState } from "react";
import { Combobox } from "@/components/lostfound/Combobox";

export type OldUnit = { slug: string; name: string; prefix: string; district: string; province: string };
export type ReorgGroup = { newCommune: string; newCommuneSlug: string; newProvince: string; units: OldUnit[] };

export function ReorgExplorer({ groups }: { groups: ReorgGroup[] }) {
  const [newSlug, setNewSlug] = useState("");
  const [oldSlug, setOldSlug] = useState("");

  const group = groups.find((g) => g.newCommuneSlug === newSlug);
  const oldUnit = group?.units.find((u) => u.slug === oldSlug);

  const options = groups.map((g) => ({
    value: g.newCommuneSlug,
    label: `Xã ${g.newCommune}`,
    hint: `${g.units.length} đơn vị · ${g.newProvince}`,
  }));

  return (
    <div className="qp-reorg">
      <div className="qp-form-group qp-reorg__picker">
        <label className="qp-label" htmlFor="reorg-new">Chọn xã mới (sau sáp nhập 1/7/2025)</label>
        <Combobox
          id="reorg-new"
          options={options}
          value={newSlug}
          onChange={(v) => { setNewSlug(v); setOldSlug(""); }}
          placeholder="— Chọn xã mới —"
          searchPlaceholder="Gõ tên xã…"
        />
      </div>

      {!group ? (
        <p className="qp-reorg__hint">Chọn một xã mới ở trên để xem nó được hợp nhất từ những xã/thị trấn cũ nào.</p>
      ) : (
        <>
          {/* Kết quả — các đơn vị cũ */}
          <div className="qp-reorg__result">
            <div className="qp-reorg__head">
              <span className="qp-reorg__newname">Xã {group.newCommune}</span>
              <span className="qp-reorg__province">{group.newProvince}</span>
              <span className="qp-reorg__count">Gồm {group.units.length} đơn vị cũ</span>
            </div>
            <div className="qp-reorg__chips">
              {group.units.map((u) => (
                <button key={u.slug} type="button"
                  className={`qp-reorg__chip${oldSlug === u.slug ? " is-active" : ""}`}
                  onClick={() => setOldSlug(u.slug === oldSlug ? "" : u.slug)}>{u.name}</button>
              ))}
            </div>
          </div>

          {/* Chi tiết — cũ → mới */}
          {oldUnit && (
            <div className="qp-reorg__detail">
              <div className="qp-reorg__box">
                <span className="qp-reorg__box-lbl">Đơn vị cũ (trước 2025)</span>
                <b className="qp-reorg__box-name">{oldUnit.name}</b>
                <span className="qp-reorg__box-sub">{oldUnit.district}, {oldUnit.province}</span>
              </div>
              <div className="qp-reorg__merge" aria-hidden>↓<span>sáp nhập</span></div>
              <div className="qp-reorg__box is-new">
                <span className="qp-reorg__box-lbl">Hiện nay (từ 2025)</span>
                <b className="qp-reorg__box-name">Xã {group.newCommune}</b>
                <span className="qp-reorg__box-sub">{group.newProvince}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
