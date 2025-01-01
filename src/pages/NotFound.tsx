import { NotFoundPage } from "@/components/ui/not-found-2";
import { useSEO } from "@/lib/seo";

const NotFound = () => {
  useSEO({ title: "404 — Page Not Found — Stoa" });

  return <NotFoundPage />;
};

export default NotFound;
