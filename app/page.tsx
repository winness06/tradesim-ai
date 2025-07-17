import dynamic from "next/dynamic"

const Home = dynamic(() => import("@/components/HomeClient"), { ssr: false })

export default function Page() {
  return <Home />
}
