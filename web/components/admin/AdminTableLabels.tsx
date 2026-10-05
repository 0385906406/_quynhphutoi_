"use client";

// Gắn data-label (lấy từ tiêu đề cột <th>) cho từng ô <td> của mọi bảng .qp-table trong khu
// quản trị. CSS admin.css dùng nhãn này để biến bảng rộng thành THẺ trên điện thoại
// (mỗi dòng = 1 thẻ, mỗi ô = "Nhãn: giá trị") — không phải sửa từng trang quản lý.
// MutationObserver bắt cả bảng render sau (đổi trang, lọc, tải dữ liệu).
import { useEffect } from "react";

function label(root: ParentNode) {
  root.querySelectorAll<HTMLTableElement>("table.qp-table").forEach((table) => {
    const heads = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent?.trim() ?? "");
    if (!heads.length) return;
    table.querySelectorAll("tbody tr").forEach((tr) => {
      Array.from(tr.children).forEach((cell, i) => {
        const text = heads[i] ?? "";
        if (cell.getAttribute("data-label") !== text) cell.setAttribute("data-label", text);
      });
    });
  });
}

export function AdminTableLabels() {
  useEffect(() => {
    const root = document.querySelector(".qp-admin-content");
    if (!root) return;
    label(root);
    let frame = 0;
    const mo = new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; label(root); });
    });
    mo.observe(root, { childList: true, subtree: true });
    return () => { mo.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, []);
  return null;
}
