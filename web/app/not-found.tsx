import { NotFoundContent } from "@/components/common/NotFoundContent";

// 404 toàn cục (URL không khớp route nào) — đứng độc lập, không chrome.
export default function NotFound() {
  return (
    <main className="qp-404-standalone">
      <NotFoundContent />
    </main>
  );
}
