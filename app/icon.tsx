import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width:512, height:512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width:'100%',
          height:'100%',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          background:'#0D2D5E',
          borderRadius:'96px',
        }}
      >
        <div
          style={{
            width:'330px',
            height:'210px',
            borderRadius:'34px',
            background:'#F5A623',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            color:'#0D2D5E',
            fontSize:'120px',
            fontWeight:900,
          }}
        >
          V
        </div>
      </div>
    ),
    size
  )
}
