import { Spinner } from "@/components/ui/spinner";
export default function CatalogLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner className="size-8 mx-auto" />
    </div>
  );
}