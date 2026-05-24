import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vehiqal.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Vehiqal — Verified Car Deals in Pakistan', template: '%s | Vehiqal' },
  description: 'Buy and sell inspected used cars in Pakistan. We take full responsibility for payment and car on inspected deals. 300-point inspection. Win-win deals for buyer and seller. Call 0303 4642619.',
  keywords: ['used cars pakistan','buy car gujranwala','sell car lahore','verified used cars','car marketplace pakistan','vehiqal'],
  openGraph: {
    type:'website', locale:'en_PK', url:'https://vehiqal.com', siteName:'Vehiqal',
    title:'Vehiqal — Verified Car Deals in Pakistan',
    description:'We take your headache — Payment & Car Guarantee. 300-point inspections. Win-win deals.',
    images:[{ url:'/og-image.png', width:1200, height:630 }],
  },
  twitter:{ card:'summary_large_image' },
  robots:{ index:true, follow:true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'><rect width='180' height='180' rx='40' fill='%230D2D5E'/><rect x='22' y='100' width='136' height='38' rx='6' fill='%23F5A623'/><path d='M48 100 L58 72 Q62 64 70 64 L112 64 Q120 64 124 72 L134 100Z' fill='%23F5A623'/><circle cx='55' cy='145' r='19' fill='%230D1A30'/><circle cx='55' cy='145' r='5' fill='%23F5A623'/><circle cx='127' cy='145' r='19' fill='%230D1A30'/><circle cx='127' cy='145' r='5' fill='%23F5A623'/><circle cx='142' cy='55' r='17' fill='%231A9E6A'/><path d='M134 55 L140 61 L151 47' stroke='white' stroke-width='3' stroke-linecap='round' fill='none'/></svg>"/>
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
