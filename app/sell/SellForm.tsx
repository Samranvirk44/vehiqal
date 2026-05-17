'use client'
import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createCar, updateCar, CITIES, MAKES } from '@/lib/cars'
import { createUserProfile, getUserProfile, onAuthChange } from '@/lib/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import Link from 'next/link'
import type { User } from 'firebase/auth'

const MAX_PHOTOS = 12
const PHOTO_INPUT_ID = 'car-photo-upload'
const PHOTO_UPLOAD_TIMEOUT_MS = 120000
const IMAGE_FILE_PATTERN = /\.(jpe?g|png|webp|gif|heic|heif)$/i

type PreparedPhoto = {
  blob: Blob
  contentType: string
}

// Compress image in browser before upload - reduces multi-MB photos dramatically.
async function compressImage(file: File, maxWidth = 1200, quality = 0.75): Promise<PreparedPhoto> {
  return new Promise((resolve) => {
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)
    const useOriginal = () => {
      URL.revokeObjectURL(url)
      resolve({ blob: file, contentType: file.type || 'application/octet-stream' })
    }

    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (!width || !height) {
        resolve({ blob: file, contentType: file.type || 'application/octet-stream' })
        return
      }
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve({ blob: file, contentType: file.type || 'application/octet-stream' })
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => resolve(blob ? { blob, contentType: 'image/jpeg' } : { blob: file, contentType: file.type || 'application/octet-stream' }),
        'image/jpeg',
        quality
      )
    }
    img.onerror = useOriginal
    img.src = url
  })
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

function isImageFile(file: File) {
  return file.type.startsWith('image/') || IMAGE_FILE_PATTERN.test(file.name)
}

export function SellForm() {
  const router   = useRouter()
  const [user, setUser]   = useState<User|null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [step, setStep]   = useState(1)
  const [images, setImages]     = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading]   = useState(false)
  const [stage, setStage]       = useState('')
  const [done, setDone]         = useState(0)
  const [form, setForm] = useState({
    make:'',model:'',year:'',mileage:'',transmission:'',
    colour:'',city:'',engineSize:'',description:'',price:'',
  })
  const [contact, setContact] = useState({ name:'', phone:'' })
  useEffect(() => {
    return onAuthChange(async (u) => {
      setUser(u)
      if (!u) {
        setProfile(null)
        setContact({ name:'', phone:'' })
        return
      }

      try {
        const p = await getUserProfile(u.uid)
        setProfile(p)
        setContact(current => ({
          name:current.name || p?.name || u.displayName || '',
          phone:current.phone || p?.phone || u.phoneNumber || '',
        }))
      } catch {
        setProfile(null)
        setContact(current => ({
          name:current.name || u.displayName || '',
          phone:current.phone || u.phoneNumber || '',
        }))
      }
    })
  }, [])
  useEffect(() => {
    const urls = images.map(file => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach(URL.revokeObjectURL)
  }, [images])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setContactField = (k: 'name'|'phone', v: string) => setContact(c => ({ ...c, [k]: v }))
  const TRANS = ['Automatic','Manual']

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    const imageFiles = selected.filter(isImageFile)

    if (selected.length !== imageFiles.length) {
      alert('Only image files can be added.')
    }

    if (imageFiles.length > 0) {
      setImages(current => [...current, ...imageFiles].slice(0, MAX_PHOTOS))
    }

    // Reset input so the same photo can be selected again.
    e.target.value = ''
  }

  const publish = async () => {
    if (!user) { router.push('/login?redirect=/sell&register=true'); return }
    if (!form.price || Number(form.price) < 1) { alert('Enter a valid price.'); return }
    const sellerName = (contact.name || profile?.name || user.displayName || '').trim()
    const sellerPhone = (contact.phone || profile?.phone || user.phoneNumber || '').trim()
    if (!sellerName) { alert('Enter your contact name.'); return }
    if (!sellerPhone || sellerPhone.replace(/\D/g, '').length < 8) { alert('Enter a valid contact phone number.'); return }
    setLoading(true); setDone(0)
    try {
      await createUserProfile(user.uid, {
        name:sellerName,
        phone:sellerPhone,
        role:profile?.role ?? 'sell',
        isBuyer:profile?.isBuyer ?? true,
        isSeller:true,
        savedCars:profile?.savedCars ?? [],
      })

      // Step 1 — create car doc (instant)
      setStage('Creating listing…')
      const docRef = await createCar({
        make:form.make, model:form.model, year:form.year,
        mileage:Number(form.mileage), transmission:form.transmission as any,
        colour:form.colour, city:form.city, engineSize:form.engineSize,
        description:form.description, price:Number(form.price)*100000,
        sellerId:user.uid,
        sellerName,
        sellerPhone,
      } as any)

      const urls: string[] = []
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          setStage(`Preparing photo ${i + 1} of ${images.length}…`)
          const photo = await compressImage(images[i])
          setStage(`Uploading photo ${i + 1} of ${images.length}…`)
          const snap = await withTimeout(
            uploadBytes(
              ref(storage, `cars/${docRef.id}/img_${i}.jpg`),
              photo.blob,
              { contentType: photo.contentType }
            ),
            PHOTO_UPLOAD_TIMEOUT_MS,
            'Photo upload is taking too long. Please check your connection and try again.'
          )
          urls.push(await getDownloadURL(snap.ref))
          setDone(i + 1)
        }

        // Step 4 — save URLs
        setStage('Finishing…')
        await updateCar(docRef.id, { images: urls } as any)
      }

      router.push(`/cars/${docRef.id}`)
    } catch(e) {
      console.error(e)
      const message = e instanceof Error && e.message.includes('taking too long')
        ? e.message
        : 'Could not publish. Check your internet connection and try again.'
      alert(message)
    } finally {
      setLoading(false)
      setStage('')
    }
  }

  if (!user) return (
    <div className="card p-8 text-center">
      <div className="text-5xl mb-4">🚗</div>
      <h2 className="font-black text-gray-900 text-xl mb-2">List your car for free</h2>
      <p className="text-gray-500 mb-2">Sign in with your phone number to continue</p>
      <p className="text-gray-400 text-sm mb-6">It only takes 30 seconds — no password needed</p>
      <Link href="/login?redirect=/sell&register=true" className="btn-navy justify-center w-full">Sign in / Register</Link>
    </div>
  )

  return (
    <div className="card overflow-hidden">
      <div className="flex border-b border-gray-100">
        {['Details','Photos','Price'].map((s,i) => (
          <div key={s} className={`flex-1 py-3 text-center text-sm font-bold transition-colors ${step===i+1?'text-navy border-b-2 border-navy bg-navylight':step>i+1?'text-green':'text-gray-300'}`}>
            {step>i+1?'✓ ':''}{s}
          </div>
        ))}
      </div>
      <div className="p-6">
        {step===1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Make *</label>
                <select value={form.make} onChange={e=>set('make',e.target.value)} className="input">
                  <option value="">Select</option>{MAKES.map(m=><option key={m} value={m}>{m}</option>)}
                </select></div>
              <div><label className="label">Model *</label><input value={form.model} onChange={e=>set('model',e.target.value)} placeholder="e.g. Corolla" className="input"/></div>
              <div><label className="label">Year *</label>
                <select value={form.year} onChange={e=>set('year',e.target.value)} className="input">
                  <option value="">Select</option>{Array.from({length:25},(_,i)=>String(2024-i)).map(y=><option key={y}>{y}</option>)}
                </select></div>
              <div><label className="label">Mileage (km) *</label><input value={form.mileage} onChange={e=>set('mileage',e.target.value)} type="number" placeholder="e.g. 45000" className="input"/></div>
              <div><label className="label">Transmission *</label>
                <select value={form.transmission} onChange={e=>set('transmission',e.target.value)} className="input">
                  <option value="">Select</option>{TRANS.map(t=><option key={t}>{t}</option>)}
                </select></div>
              <div><label className="label">City *</label>
                <select value={form.city} onChange={e=>set('city',e.target.value)} className="input">
                  <option value="">Select</option>{CITIES.map(c=><option key={c}>{c}</option>)}
                </select></div>
              <div><label className="label">Engine size</label><input value={form.engineSize} onChange={e=>set('engineSize',e.target.value)} placeholder="e.g. 1300cc" className="input"/></div>
              <div><label className="label">Colour</label><input value={form.colour} onChange={e=>set('colour',e.target.value)} placeholder="e.g. White" className="input"/></div>
            </div>
            <div><label className="label">Description</label><textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe condition, features, history..." rows={4} className="input resize-none"/></div>
            <div className="border-t border-gray-100 pt-4">
              <h3 className="mb-3 text-sm font-black text-gray-900">Contact details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">Seller name *</label><input value={contact.name} onChange={e=>setContactField('name',e.target.value)} placeholder="e.g. Ahmed Khan" className="input" autoComplete="name"/></div>
                <div><label className="label">Contact phone *</label><input type="tel" value={contact.phone} onChange={e=>setContactField('phone',e.target.value)} placeholder="e.g. 03001234567" className="input" autoComplete="tel"/></div>
              </div>
            </div>
            <button type="button" onClick={()=>{if(!form.make||!form.model||!form.year||!form.mileage||!form.city||!form.transmission||!contact.name.trim()||!contact.phone.trim()){alert('Fill all required fields (*)');return}if(contact.phone.replace(/\D/g,'').length<8){alert('Enter a valid contact phone number.');return}setStep(2)}} className="btn-navy w-full justify-center">Next — Add photos →</button>
          </div>
        )}
        {step===2 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">📸 Add photos of your car. First photo is the cover. (optional but recommended)</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {previews.map((src,i)=>(
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                  <img src={src} alt={`Car photo ${i + 1}`} className="h-full w-full object-cover"/>
                  {i===0&&<span className="absolute top-1 left-1 bg-gold text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded">Cover</span>}
                  <button type="button" onClick={()=>setImages(a=>a.filter((_,j)=>j!==i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">✕</button>
                </div>
              ))}
              {images.length<MAX_PHOTOS&&<label htmlFor={PHOTO_INPUT_ID} className="aspect-square rounded-xl border-2 border-dashed border-navy flex cursor-pointer flex-col items-center justify-center bg-navylight text-navy hover:bg-blue-50 transition-colors"><span className="text-2xl">+</span><span className="text-xs font-semibold mt-1">Add photos</span></label>}
            </div>
            <input id={PHOTO_INPUT_ID} type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoChange}/>
            <p className="text-xs text-gray-400 text-center mb-4">{images.length}/{MAX_PHOTOS} photos</p>
            <div className="flex gap-3">
              <button type="button" onClick={()=>setStep(1)} className="btn-outline flex-1 justify-center text-sm">← Back</button>
              <button type="button" onClick={()=>setStep(3)} className="btn-navy flex-1 justify-center text-sm">Next — Set price →</button>
            </div>
          </div>
        )}
        {step===3 && (
          <div className="space-y-4">
            <div className="bg-navylight rounded-xl p-3 text-sm text-navy font-medium">{form.make} {form.model} {form.year} · {form.city} · {Number(form.mileage).toLocaleString()} km</div>
            <div>
              <label className="label">Asking price (lacs PKR) *</label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-navy">
                <span className="bg-gray-50 px-3 py-3.5 text-gray-400 text-sm border-r">PKR</span>
                <input type="number" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="e.g. 42" className="flex-1 px-3 py-3.5 text-xl font-bold text-gray-800 focus:outline-none"/>
                <span className="bg-gray-50 px-3 py-3.5 text-gray-400 text-sm border-l">lacs</span>
              </div>
              {form.price&&<p className="text-green text-xs mt-1 font-medium">= PKR {(Number(form.price)*100000).toLocaleString('en-PK')}</p>}
            </div>
            {loading&&images.length>0&&(
              <div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gold rounded-full transition-all" style={{width:`${Math.round((done/images.length)*100)}%`}}/></div>
                <p className="text-xs text-gray-400 text-center mt-1">{stage}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={()=>setStep(2)} disabled={loading} className="btn-outline flex-1 justify-center text-sm">← Back</button>
              <button type="button" onClick={publish} disabled={loading} className="btn-navy flex-1 justify-center text-sm disabled:opacity-60">{loading?stage||'Publishing…':'Publish listing 🚀'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
