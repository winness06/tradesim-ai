// app/page.tsx
import dynamic from "next/dynamic"

const HomeClient = dynamic(() => import("./Homeclient"), { ssr: false })

export default function Page() {
  return <HomeClient />
}
