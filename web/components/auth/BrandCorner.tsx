// Logo + tên thương hiệu ở góc các trang auth — bấm vào về trang chủ.
import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@/lib/nav";

export function BrandCorner() {
  return (
    <Link className="brand-corner" href="/" aria-label="Quỳnh Phụ Tôi — Về trang chủ">
      <div className="brand-icon">
        <Image src={BRAND.logo} alt="" fill sizes="32px" />
      </div>
      <span className="brand-corner-name">Quỳnh Phụ Tôi</span>
    </Link>
  );
}
