// app/page.tsx
import dynamic from "next/dynamic";

// Use dynamic import for client-side only
const HomeClient = dynamic(() => import("@/components/HomeClient"), {
  ssr: false,
});

export default function HomePage() {
  return <HomeClient />;
}
