"use client";

// Lỗi runtime trong khu vực cổng — vẫn giữ TopBar/Footer (từ layout (site)).
import { useEffect } from "react";
import { ErrorContent } from "@/components/common/ErrorContent";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ErrorContent reset={reset} />;
}
