import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Vehiqal - inspected car deals in Pakistan'
export const size = { width:1200, height:630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width:'100%',
          height:'100%',
          display:'flex',
          flexDirection:'column',
          justifyContent:'center',
          background:'linear-gradient(135deg, #0D2D5E 0%, #1A4A9E 55%, #07152C 100%)',
          color:'white',
          padding:'76px',
          fontFamily:'Arial, sans-serif',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:'24px', marginBottom:'42px' }}>
          <div
            style={{
              width:'96px',
              height:'96px',
              borderRadius:'24px',
              background:'#F5A623',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              fontSize:'54px',
            }}
          >
            🚗
          </div>
          <div style={{ display:'flex', fontSize:'58px', fontWeight:900, letterSpacing:'-1px' }}>
            <span>Veh</span><span style={{ color:'#F5A623' }}>iq</span><span>al</span>
          </div>
        </div>
        <div style={{ fontSize:'74px', fontWeight:900, lineHeight:1.05, maxWidth:'930px' }}>
          Pakistan&apos;s inspected car marketplace
        </div>
        <div style={{ marginTop:'30px', fontSize:'32px', color:'#C7D7F4', maxWidth:'860px', lineHeight:1.35 }}>
          300-point inspections. Payment & car support. We take your headache.
        </div>
        <div style={{ display:'flex', gap:'18px', marginTop:'54px' }}>
          {['Inspected cars', 'Verified buyers', '0303 4642619'].map(item => (
            <div
              key={item}
              style={{
                border:'2px solid rgba(255,255,255,0.18)',
                borderRadius:'999px',
                padding:'14px 24px',
                fontSize:'24px',
                fontWeight:800,
                color:item.includes('0303') ? '#F5A623' : '#EAF1FF',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  )
}
