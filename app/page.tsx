import { Suspense } from "react";
import HomeClient from "@/components/HomeClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-white p-4">Loading...</div>}>
      <HomeClient />
    </Suspense>
  );
}
