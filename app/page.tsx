import { Suspense } from "react";
import HomeClient from "@/components/HomeClient";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <HomeClient />
      </Suspense>
    </main>
  );
}
