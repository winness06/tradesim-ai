import { Suspense } from "react";
import RefCompleteClient from "./RefCompleteClient";

export default function RefCompletePage() {
  return (
    <main className="min-h-screen flex justify-center items-center text-white">
      <Suspense fallback={<p>Setting up referral...</p>}>
        <RefCompleteClient />
      </Suspense>
    </main>
  );
}
