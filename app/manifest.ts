import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:'Vehiqal - Inspected Car Marketplace',
    short_name:'Vehiqal',
    description:'Buy and sell inspected used cars in Pakistan with 300-point checks and safer deal support.',
    start_url:'/',
    display:'standalone',
    background_color:'#0D2D5E',
    theme_color:'#0D2D5E',
    categories:['autos','shopping','business'],
    icons:[
      {
        src:'/icon',
        sizes:'any',
        type:'image/png',
      },
    ],
  }
}
