import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { AiChatBot } from '@/components/AiChatBot'
import { CONTACT_PHONE_DISPLAY, GOOGLE_SITE_VERIFICATION, SITE_NAME, SITE_URL, absoluteUrl, coreKeywords } from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName:SITE_NAME,
  title: { default: 'Buy and Sell Used Cars in Pakistan | Vehiqal', template: '%s | Vehiqal' },
  description: `Buy and sell inspected used cars in Pakistan. 300-point inspection, payment support, verified buyers, and safer deals. Call ${CONTACT_PHONE_DISPLAY}.`,
  keywords: coreKeywords,
  authors:[{ name:SITE_NAME, url:SITE_URL }],
  creator:SITE_NAME,
  publisher:SITE_NAME,
  category:'automotive marketplace',
  alternates:{
    canonical:absoluteUrl('/'),
    languages:{
      'en-PK':absoluteUrl('/'),
      'x-default':absoluteUrl('/'),
    },
  },
  verification:{ google:GOOGLE_SITE_VERIFICATION },
  openGraph: {
    type:'website', locale:'en_PK', url:SITE_URL, siteName:SITE_NAME,
    title:'Buy and Sell Used Cars in Pakistan | Vehiqal',
    description:'We take your headache. 300-point inspections, verified listings, and safer car deals.',
    images:[{ url:'/opengraph-image', width:1200, height:630, alt:'Vehiqal inspected car marketplace' }],
  },
  twitter:{
    card:'summary_large_image',
    title:'Buy and Sell Used Cars in Pakistan | Vehiqal',
    description:'Browse inspected cars or list your car free with Vehiqal.',
    images:['/opengraph-image'],
  },
  robots:{
    index:true,
    follow:true,
    googleBot:{ index:true, follow:true, 'max-image-preview':'large', 'max-snippet':-1, 'max-video-preview':-1 },
  },
  manifest:'/manifest.webmanifest',
  formatDetection:{ telephone:true, email:true, address:false },
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
        <AiChatBot />
      </body>
    </html>
  )
}
