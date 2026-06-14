import { NotFoundContent } from "@/components/common/NotFoundContent";

// 404 trong khu vực cổng thông tin — vẫn có TopBar/Footer (từ layout (site)).
export default function SiteNotFound() {
  return <NotFoundContent />;
}
