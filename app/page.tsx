import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import HomeClient (client-side)
const HomeClient = dynamic(() => import("@/components/HomeClient"), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={<p className="text-white text-center">Loading...</p>}>
      <HomeClient />
    </Suspense>
  );
}
