'use client'
import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createCar, updateCar, CITIES, MAKES, CAR_COLOURS, getCarColourOption, normalizeCarColourName } from '@/lib/cars'
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
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [wantsVerification, setWantsVerification] = useState(false)
  const [colourChoice, setColourChoice] = useState('')
  const [customColour, setCustomColour] = useState('')
  const [colourPickerOpen, setColourPickerOpen] = useState(false)
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

  useEffect(() => {
    if (selectedPhotoIndex >= images.length) {
      setSelectedPhotoIndex(Math.max(0, images.length - 1))
    }
  }, [images.length, selectedPhotoIndex])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setContactField = (k: 'name'|'phone', v: string) => setContact(c => ({ ...c, [k]: v }))
  const TRANS = ['Automatic','Manual']

  const handleColourChoice = (value: string) => {
    setColourChoice(value)
    if (value === 'Other') {
      set('colour', customColour)
      setColourPickerOpen(false)
      return
    }
    setCustomColour('')
    set('colour', value)
    setColourPickerOpen(false)
  }

  const handleCustomColour = (value: string) => {
    setCustomColour(value)
    set('colour', normalizeCarColourName(value))
  }

  const selectedColour = getCarColourOption(form.colour)

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    const imageFiles = selected.filter(isImageFile)

    if (selected.length !== imageFiles.length) {
      alert('Only image files can be added.')
    }

    if (imageFiles.length > 0) {
      setImages(current => {
        const next = [...current, ...imageFiles].slice(0, MAX_PHOTOS)
        setSelectedPhotoIndex(Math.min(current.length, next.length - 1))
        return next
      })
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
        colour:normalizeCarColourName(form.colour), city:form.city, engineSize:form.engineSize,
        description:form.description, price:Number(form.price)*100000,
        sellerId:user.uid,
        sellerName,
        sellerPhone,
        verificationStatus:wantsVerification ? 'requested' : 'none',
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
              <div className="relative col-span-2">
                <label className="label">Colour</label>
                <button
                  type="button"
                  onClick={()=>setColourPickerOpen(open=>!open)}
                  aria-expanded={colourPickerOpen}
                  className="input flex items-center justify-between text-left"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-5 w-5 flex-shrink-0 rounded-full border border-gray-300"
                      style={{backgroundColor:selectedColour?.hex ?? (colourChoice==='Other' ? '#CBD5E1' : '#F8FAFC')}}
                    />
                    <span className="truncate">{form.colour || (colourChoice==='Other' ? 'Other' : 'Select colour')}</span>
                  </span>
                  <span className="text-gray-400">▾</span>
                </button>
                {colourPickerOpen&&(
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {CAR_COLOURS.map(item=>(
                        <button
                          key={item.name}
                          type="button"
                          onClick={()=>handleColourChoice(item.name)}
                          className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm font-bold transition-colors ${selectedColour?.name===item.name?'border-navy bg-navylight text-navy':'border-gray-100 text-gray-700 hover:border-navy/30 hover:bg-gray-50'}`}
                        >
                          <span className="h-7 w-7 flex-shrink-0 rounded-full border border-gray-300" style={{backgroundColor:item.hex}}/>
                          <span className="min-w-0 truncate">{item.name}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={()=>handleColourChoice('Other')}
                        className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm font-bold transition-colors ${colourChoice==='Other'?'border-navy bg-navylight text-navy':'border-gray-100 text-gray-700 hover:border-navy/30 hover:bg-gray-50'}`}
                      >
                        <span className="h-7 w-7 flex-shrink-0 rounded-full border border-gray-300 bg-gradient-to-br from-red-400 via-yellow-300 to-blue-500"/>
                        <span>Other</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {colourChoice==='Other'&&(
              <div>
                <label className="label">Other colour</label>
                <input value={customColour} onChange={e=>handleCustomColour(e.target.value)} placeholder="e.g. Rose Gold, Teal, Mat Grey" className="input"/>
              </div>
            )}
            {form.colour&&(
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-700">
                <span className="h-4 w-4 rounded-full border border-gray-300" style={{backgroundColor: selectedColour?.hex ?? '#CBD5E1'}}/>
                {selectedColour?.name ?? form.colour}
              </div>
            )}
            <div><label className="label">Description</label><textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe condition, features, history..." rows={4} className="input resize-none"/></div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-green/20 bg-greenlight/60 p-4 transition-colors hover:bg-greenlight">
              <input
                type="checkbox"
                checked={wantsVerification}
                onChange={e=>setWantsVerification(e.target.checked)}
                className="mt-1 accent-green"
              />
              <span>
                <span className="block text-sm font-black text-navy">Request Vehiqal inspection</span>
                <span className="block text-xs leading-relaxed text-gray-500">Admin will review this request. Once accepted, the car gets an Inspected badge and Vehiqal contact is shown on the listing.</span>
              </span>
            </label>
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
            <p className="text-sm text-gray-500 mb-4">📸 Add photos of your car. First photo is the cover. Tap any thumbnail to preview it large.</p>
            <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-navylight">
              {previews[selectedPhotoIndex] ? (
                <div className="relative aspect-[16/10]">
                  <img src={previews[selectedPhotoIndex]} alt={`Selected car photo ${selectedPhotoIndex + 1}`} className="h-full w-full object-cover"/>
                  {selectedPhotoIndex===0&&<span className="absolute left-3 top-3 bg-gold text-yellow-900 text-xs font-black px-2.5 py-1 rounded-full">Cover photo</span>}
                </div>
              ) : (
                <label htmlFor={PHOTO_INPUT_ID} className="flex aspect-[16/10] cursor-pointer flex-col items-center justify-center text-center text-navy">
                  <span className="text-4xl">+</span>
                  <span className="mt-2 text-sm font-black">Add car photos</span>
                  <span className="mt-1 text-xs text-gray-400">Photos help buyers trust your listing</span>
                </label>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {previews.map((src,i)=>(
                <button key={i} type="button" onClick={()=>setSelectedPhotoIndex(i)} className={`relative aspect-square overflow-hidden rounded-xl border text-left transition-all ${selectedPhotoIndex===i?'border-navy ring-2 ring-navy/20':'border-gray-200 hover:border-navy/40'}`}>
                  <img src={src} alt={`Car photo ${i + 1}`} className="h-full w-full object-cover"/>
                  {i===0&&<span className="absolute top-1 left-1 bg-gold text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded">Cover</span>}
                  <span onClick={(event)=>{event.stopPropagation();setImages(a=>a.filter((_,j)=>j!==i))}} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">✕</span>
                </button>
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
