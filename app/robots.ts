import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const site = SITE_URL.replace(/\/$/, '')

  return {
    rules:{
      userAgent:'*',
      allow:'/',
      disallow:['/admin','/admin/','/dashboard','/dashboard/','/login','/api/','/test'],
    },
    sitemap:`${site}/sitemap.xml`,
    host:new URL(site).host,
  }
}
