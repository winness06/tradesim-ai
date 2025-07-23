import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const RefCompleteClient = dynamic(() => import('./RefCompleteClient'), {
  ssr: false,
})

export default function RefCompletePage() {
  return (
    <main className="min-h-screen flex justify-center items-center text-white">
      <Suspense fallback={<p>Loading...</p>}>
        <RefCompleteClient />
      </Suspense>
    </main>
  )
}
