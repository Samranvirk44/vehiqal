import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules:{
      userAgent:'*',
      allow:'/',
      disallow:['/admin','/dashboard','/login','/api/','/test'],
    },
    sitemap:`${SITE_URL.replace(/\/$/, '')}/sitemap.xml`,
    host:SITE_URL,
  }
}
