import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
      <div>
        <div className="text-7xl mb-6">🚗</div>
        <h1 className="text-4xl font-black text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-500 mb-8">This page doesn&apos;t exist or has been removed.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/" className="btn-navy">Go home</Link>
          <Link href="/cars" className="btn-outline">Browse cars</Link>
          <a href="tel:+923114642679" className="btn-gold">📞 Call us</a>
        </div>
      </div>
    </div>
  )
}
