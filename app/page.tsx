import dynamic from "next/dynamic"

// Load the charting interface with SSR disabled
const Home = dynamic(() => import("@/components/HomeClient"), { ssr: false })

export default function Page() {
  return <Home />
}
