'use client'
import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  createCar, updateCar, getCarById,
  CITIES, REGISTERED_LOCATIONS, MAKES, CAR_COLOURS, FUEL_TYPES, CAR_CONDITIONS, ASSEMBLY_TYPES, CAR_FEATURES,
  getCarColourOption, getCarModelOptions, normalizeCarColourName, type Car,
} from '@/lib/cars'
import { createUserProfile, getUserProfile, onAuthChange } from '@/lib/auth'
import { isAdminIdentity } from '@/lib/admin'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import Link from 'next/link'
import type { User } from 'firebase/auth'

const MAX_PHOTOS = 12
const PHOTO_INPUT_ID = 'car-photo-upload'
const PHOTO_UPLOAD_TIMEOUT_MS = 120000
const IMAGE_FILE_PATTERN = /\.(jpe?g|png|webp|gif|heic|heif)$/i
const MAX_UPLOAD_IMAGE_DIMENSION = 1280
const TARGET_UPLOAD_IMAGE_BYTES = 450 * 1024
const INITIAL_UPLOAD_IMAGE_QUALITY = 0.68
const MIN_UPLOAD_IMAGE_QUALITY = 0.42
const QUALITY_STEP = 0.08
const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 45 }, (_, i) => String(CURRENT_YEAR - i))

type PreparedPhoto = {
  blob: Blob
  contentType: string
}

function getContainedSize(width: number, height: number, maxDimension: number) {
  const scale = Math.min(1, maxDimension / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(resolve, 'image/jpeg', quality)
  })
}

async function createCompressedJpeg(img: HTMLImageElement) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx || !img.width || !img.height) return null

  let maxDimension = MAX_UPLOAD_IMAGE_DIMENSION
  let bestBlob: Blob | null = null

  while (maxDimension >= 720) {
    const size = getContainedSize(img.width, img.height, maxDimension)
    canvas.width = size.width
    canvas.height = size.height

    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, size.width, size.height)
    ctx.drawImage(img, 0, 0, size.width, size.height)

    for (let quality = INITIAL_UPLOAD_IMAGE_QUALITY; quality >= MIN_UPLOAD_IMAGE_QUALITY; quality -= QUALITY_STEP) {
      const blob = await canvasToJpegBlob(canvas, Math.max(MIN_UPLOAD_IMAGE_QUALITY, quality))
      if (!blob) continue
      bestBlob = blob
      if (blob.size <= TARGET_UPLOAD_IMAGE_BYTES) return blob
    }

    if (bestBlob && bestBlob.size <= TARGET_UPLOAD_IMAGE_BYTES) return bestBlob
    maxDimension = Math.round(maxDimension * 0.85)
  }

  return bestBlob
}

// Compress image in browser before upload. It resizes within a box, never crops.
async function compressImage(file: File): Promise<PreparedPhoto> {
  return new Promise((resolve) => {
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)
    const useOriginal = () => {
      URL.revokeObjectURL(url)
      resolve({ blob: file, contentType: file.type || 'application/octet-stream' })
    }

    img.onload = async () => {
      URL.revokeObjectURL(url)
      try {
        const blob = await createCompressedJpeg(img)
        resolve(blob ? { blob, contentType: 'image/jpeg' } : { blob: file, contentType: file.type || 'application/octet-stream' })
      } catch {
        resolve({ blob: file, contentType: file.type || 'application/octet-stream' })
      }
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
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const [user, setUser]   = useState<User|null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [step, setStep]   = useState(1)
  const [images, setImages]     = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [filePreviews, setFilePreviews] = useState<string[]>([])
  const [loading, setLoading]   = useState(false)
  const [stage, setStage]       = useState('')
  const [done, setDone]         = useState(0)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [wantsVerification, setWantsVerification] = useState(false)
  const [makeChoice, setMakeChoice] = useState('')
  const [makePickerOpen, setMakePickerOpen] = useState(false)
  const [makeSearch, setMakeSearch] = useState('')
  const [customMake, setCustomMake] = useState('')
  const [modelChoice, setModelChoice] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [colourChoice, setColourChoice] = useState('')
  const [customColour, setCustomColour] = useState('')
  const [colourPickerOpen, setColourPickerOpen] = useState(false)
  const [registeredLocationChoice, setRegisteredLocationChoice] = useState('')
  const [customRegisteredLocation, setCustomRegisteredLocation] = useState('')
  const [customFeature, setCustomFeature] = useState('')
  const [form, setForm] = useState({
    make:'',model:'',year:'',mileage:'',transmission:'',
    fuelType:'',condition:'',assembly:'',
    colour:'',city:'',registeredLocation:'',engineSize:'',description:'',price:'',
    features:[] as string[],
  })
  const [contact, setContact] = useState({ name:'', phone:'' })
  const isEditMode = Boolean(editId)
  const isAdmin = isAdminIdentity(user)
  const totalPhotos = existingImages.length + images.length
  const previews = [...existingImages, ...filePreviews]
  const vehiclePhotoAlt = (index: number, label = 'vehicle photo') => {
    const vehicleName = [form.year, form.make, form.model].filter(Boolean).join(' ') || 'Vehicle'
    const color = form.colour || 'unknown color'
    const location = form.city ? ` in ${form.city}` : ''
    return `${vehicleName} in ${color}${location} - ${label} ${index + 1}`
  }
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
    setFilePreviews(urls)
    return () => urls.forEach(URL.revokeObjectURL)
  }, [images])

  useEffect(() => {
    if (selectedPhotoIndex >= totalPhotos) {
      setSelectedPhotoIndex(Math.max(0, totalPhotos - 1))
    }
  }, [totalPhotos, selectedPhotoIndex])

  useEffect(() => {
    if (!editId || !user) {
      setEditLoading(false)
      return
    }
    let active = true
    setEditError('')
    setEditLoading(true)
    getCarById(editId).then(car => {
      if (!active) return
      if (!car) {
        setEditError('This listing was not found.')
        return
      }
      const adminUser = isAdminIdentity(user)
      const inspected = Boolean(car.isTrusted) || car.verificationStatus === 'verified'
      if (car.sellerId !== user.uid && !adminUser) {
        setEditError('You can only edit your own listings.')
        return
      }
      if (car.status === 'sold' && !adminUser) {
        setEditError('Sold cars cannot be edited.')
        return
      }
      if (inspected && !adminUser) {
        setEditError('Inspected cars can only be edited by admin.')
        return
      }
      setEditingCar(car)
      setExistingImages(car.images ?? [])
      setImages([])
      setSelectedPhotoIndex(0)
      setWantsVerification(['requested','inspecting','verified'].includes(String(car.verificationStatus)) || Boolean(car.isTrusted))
      setMakePickerOpen(false)
      setMakeSearch('')
      const nextMakeChoice = findMakeChoice(car.make)
      const nextModelChoice = findModelChoice(car.make, car.model)
      const nextRegisteredLocationChoice = findRegisteredLocationChoice(car.registeredLocation)
      setMakeChoice(nextMakeChoice)
      setCustomMake(nextMakeChoice === 'Other' ? car.make : '')
      setModelChoice(nextMakeChoice === 'Other' ? 'Other' : nextModelChoice)
      setCustomModel(nextModelChoice === 'Other' ? car.model || '' : '')
      setRegisteredLocationChoice(nextRegisteredLocationChoice)
      setCustomRegisteredLocation(nextRegisteredLocationChoice === 'Other' ? car.registeredLocation || '' : '')
      setColourChoice(findColourChoice(car.colour))
      if (car.colour && !getCarColourOption(car.colour)) setCustomColour(car.colour)
      setForm({
        make:car.make || '',
        model:car.model || '',
        year:car.year || '',
        mileage:car.mileage ? String(car.mileage) : '',
        transmission:car.transmission || '',
        fuelType:car.fuelType || '',
        condition:car.condition || '',
        assembly:car.assembly || '',
        colour:car.colour || '',
        city:car.city || '',
        registeredLocation:car.registeredLocation || '',
        engineSize:car.engineSize || '',
        description:car.description || '',
        price:car.price ? String(car.price / 100000) : '',
        features:Array.isArray(car.features) ? car.features : [],
      })
      setContact({
        name:car.sellerName || (car.sellerId === user.uid ? profile?.name || user.displayName || '' : ''),
        phone:car.sellerPhone || (car.sellerId === user.uid ? profile?.phone || user.phoneNumber || '' : ''),
      })
    }).catch(error => {
      console.error('Edit listing load error:', error)
      if (active) setEditError('Could not load this listing for editing.')
    }).finally(() => {
      if (active) setEditLoading(false)
    })
    return () => { active = false }
  }, [editId, user, profile])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setContactField = (k: 'name'|'phone', v: string) => setContact(c => ({ ...c, [k]: v }))
  const TRANS = ['Automatic','Manual']

  const selectedFeatures = form.features ?? []
  const filteredMakes = MAKES
    .filter(make => make !== 'Other')
    .filter(make => make.toLowerCase().includes(makeSearch.trim().toLowerCase()))
  const modelOptions = getCarModelOptions(form.make)
  const modelHasDropdown = makeChoice !== 'Other' && modelOptions.length > 0
  const findFeature = (feature: string) => selectedFeatures.some(item => item.toLowerCase() === feature.toLowerCase())

  const findMakeChoice = (make?: string) => {
    if (!make) return ''
    return MAKES.some(item => item.toLowerCase() === make.toLowerCase()) ? make : 'Other'
  }

  const findModelChoice = (make?: string, model?: string) => {
    if (!model) return ''
    const match = getCarModelOptions(make).find(item => item.toLowerCase() === model.toLowerCase())
    return match ?? 'Other'
  }

  const findRegisteredLocationChoice = (registeredLocation?: string) => {
    if (!registeredLocation) return ''
    const match = REGISTERED_LOCATIONS.find(item => item.toLowerCase() === registeredLocation.trim().toLowerCase())
    return match ?? 'Other'
  }

  const handleMakeChoice = (value: string) => {
    setMakeChoice(value)
    setModelChoice(value === 'Other' ? 'Other' : '')
    setCustomModel('')
    if (value === 'Other') {
      setCustomMake(current => current || '')
      setForm(current => ({ ...current, make:customMake, model:'' }))
      setMakePickerOpen(false)
      return
    }
    setCustomMake('')
    setForm(current => ({ ...current, make:value, model:'' }))
    setMakePickerOpen(false)
    setMakeSearch('')
  }

  const handleCustomMake = (value: string) => {
    setCustomMake(value)
    set('make', value.trim())
  }

  const handleModelChoice = (value: string) => {
    setModelChoice(value)
    if (value === 'Other') {
      setCustomModel('')
      set('model', '')
      return
    }
    setCustomModel('')
    set('model', value)
  }

  const handleCustomModel = (value: string) => {
    setCustomModel(value)
    set('model', value.trim())
  }

  const handleRegisteredLocationChoice = (value: string) => {
    setRegisteredLocationChoice(value)
    if (value === 'Other') {
      set('registeredLocation', customRegisteredLocation.trim())
      return
    }
    setCustomRegisteredLocation('')
    set('registeredLocation', value)
  }

  const handleCustomRegisteredLocation = (value: string) => {
    setCustomRegisteredLocation(value)
    set('registeredLocation', value.trim())
  }

  const findColourChoice = (colour?: string) => {
    if (!colour) return ''
    return CAR_COLOURS.some(item => item.name.toLowerCase() === colour.toLowerCase()) ? colour : 'Other'
  }

  const toggleFeature = (feature: string) => {
    setForm(current => {
      const exists = current.features.some(item => item.toLowerCase() === feature.toLowerCase())
      return {
        ...current,
        features:exists ? current.features.filter(item => item.toLowerCase() !== feature.toLowerCase()) : [...current.features, feature],
      }
    })
  }

  const addCustomFeature = () => {
    const feature = customFeature.trim()
    if (!feature) return
    setForm(current => {
      if (current.features.some(item => item.toLowerCase() === feature.toLowerCase())) return current
      return { ...current, features:[...current.features, feature] }
    })
    setCustomFeature('')
  }

  const removePhoto = (index: number) => {
    if (index < existingImages.length) {
      setExistingImages(current => current.filter((_, i) => i !== index))
      return
    }
    const fileIndex = index - existingImages.length
    setImages(current => current.filter((_, i) => i !== fileIndex))
  }

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
        const remaining = Math.max(0, MAX_PHOTOS - existingImages.length - current.length)
        const next = [...current, ...imageFiles.slice(0, remaining)]
        setSelectedPhotoIndex(Math.min(existingImages.length + current.length, existingImages.length + next.length - 1))
        return next
      })
    }

    // Reset input so the same photo can be selected again.
    e.target.value = ''
  }

  const publish = async () => {
    if (!user) { router.push('/login?redirect=/sell&register=true'); return }
    if (isEditMode && !editingCar) { alert('Listing is still loading. Please try again in a moment.'); return }
    if (!form.price || Number(form.price) < 1) { alert('Enter a valid price.'); return }
    if (isEditMode && !isAdmin && editingCar?.status === 'sold') { alert('Sold cars cannot be edited.'); return }
    if (isEditMode && !isAdmin && (editingCar?.isTrusted || editingCar?.verificationStatus === 'verified')) { alert('Inspected cars can only be edited by admin.'); return }
    const sellerName = (contact.name || profile?.name || user.displayName || '').trim()
    const sellerPhone = (contact.phone || profile?.phone || user.phoneNumber || '').trim()
    if (!sellerName) { alert('Enter your contact name.'); return }
    if (!sellerPhone || sellerPhone.replace(/\D/g, '').length < 8) { alert('Enter a valid contact phone number.'); return }
    setLoading(true); setDone(0)
    try {
      const adminEditingExistingCar = isEditMode && isAdmin && editingCar
      if (!adminEditingExistingCar) {
        await createUserProfile(user.uid, {
          name:sellerName,
          phone:sellerPhone,
          role:profile?.role ?? 'sell',
          isBuyer:profile?.isBuyer ?? true,
          isSeller:true,
          savedCars:profile?.savedCars ?? [],
        })
      }

      const carPayload = {
        make:form.make, model:form.model, year:form.year,
        mileage:Number(form.mileage), transmission:form.transmission as any,
        fuelType:form.fuelType, condition:form.condition, assembly:form.assembly,
        colour:normalizeCarColourName(form.colour), city:form.city, registeredLocation:form.registeredLocation, engineSize:form.engineSize,
        description:form.description, price:Number(form.price)*100000,
        features:form.features,
        sellerId:editingCar?.sellerId ?? user.uid,
        sellerName,
        sellerPhone,
        verificationStatus:wantsVerification
          ? (editingCar?.isTrusted ? 'verified' : editingCar?.verificationStatus === 'inspecting' ? 'inspecting' : 'requested')
          : (editingCar?.isTrusted ? 'verified' : 'none'),
      } as any

      setStage(isEditMode ? 'Saving changes…' : 'Creating listing…')
      const docRef = isEditMode && editId
        ? { id: editId }
        : await createCar(carPayload)

      if (isEditMode && editId) {
        await updateCar(editId, carPayload)
      }

      const urls: string[] = []
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          setStage(`Preparing photo ${i + 1} of ${images.length}…`)
          const photo = await compressImage(images[i])
          setStage(`Uploading photo ${i + 1} of ${images.length}…`)
          const snap = await withTimeout(
            uploadBytes(
              ref(storage, `cars/${docRef.id}/img_${existingImages.length + i}_${Date.now()}.jpg`),
              photo.blob,
              { contentType: photo.contentType, cacheControl: 'public,max-age=31536000,immutable' }
            ),
            PHOTO_UPLOAD_TIMEOUT_MS,
            'Photo upload is taking too long. Please check your connection and try again.'
          )
          urls.push(await getDownloadURL(snap.ref))
          setDone(i + 1)
        }

        // Step 4 — save URLs
        setStage('Finishing…')
        await updateCar(docRef.id, { images:[...existingImages, ...urls] } as any)
      } else if (isEditMode && editId) {
        setStage('Finishing…')
        await updateCar(editId, { images:existingImages } as any)
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

  if (editError) return (
    <div className="card p-8 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="font-black text-gray-900 text-xl mb-2">Cannot edit listing</h2>
      <p className="text-gray-500 mb-6">{editError}</p>
      <Link href="/dashboard" className="btn-navy justify-center w-full">Back to dashboard</Link>
    </div>
  )

  if (!user) return (
    <div className="card p-8 text-center">
      <div className="text-5xl mb-4">🚗</div>
      <h2 className="font-black text-gray-900 text-xl mb-2">List your car for free</h2>
      <p className="text-gray-500 mb-2">Sign in with your phone number to continue</p>
      <p className="text-gray-400 text-sm mb-6">It only takes 30 seconds — no password needed</p>
      <Link href="/login?redirect=/sell&register=true" className="btn-navy justify-center w-full">Sign in / Register</Link>
    </div>
  )

  if (editLoading) return (
    <div className="card p-8 text-center">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      <h2 className="font-black text-gray-900 text-xl mb-2">Loading listing</h2>
      <p className="text-gray-500">Getting your car details ready for editing.</p>
    </div>
  )

  return (
    <div className="card overflow-hidden">
      {isEditMode && (
        <div className="border-b border-gold/30 bg-goldlight px-6 py-3 text-sm font-black text-yellow-900">
          Editing listing{editingCar ? ` · ${editingCar.make} ${editingCar.model} ${editingCar.year}` : ''}
        </div>
      )}
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative">
                <label className="label">Make *</label>
                <button
                  type="button"
                  onClick={()=>setMakePickerOpen(open=>!open)}
                  aria-expanded={makePickerOpen}
                  className="input flex items-center justify-between text-left"
                >
                  <span className="truncate">{form.make || (makeChoice === 'Other' ? 'Other' : 'Select make')}</span>
                  <span className="text-gray-400">▾</span>
                </button>
                {makePickerOpen&&(
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
                    <input
                      value={makeSearch}
                      onChange={e=>setMakeSearch(e.target.value)}
                      placeholder="Search make"
                      className="input mb-3 !py-2.5 text-sm"
                      autoFocus
                    />
                    <div className="max-h-64 overflow-y-auto pr-1">
                      {filteredMakes.length>0 ? filteredMakes.map(make=>(
                        <button
                          key={make}
                          type="button"
                          onClick={()=>handleMakeChoice(make)}
                          className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition-colors ${form.make.toLowerCase()===make.toLowerCase()?'bg-navylight text-navy':'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {make}
                        </button>
                      )) : (
                        <p className="px-3 py-3 text-sm font-semibold text-gray-400">No make found</p>
                      )}
                      <button
                        type="button"
                        onClick={()=>handleMakeChoice('Other')}
                        className={`mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm font-black transition-colors ${makeChoice==='Other'?'bg-navylight text-navy':'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Other
                      </button>
                    </div>
                  </div>
                )}
                {makeChoice==='Other'&&(
                  <input
                    value={customMake}
                    onChange={e=>handleCustomMake(e.target.value)}
                    placeholder="Enter make"
                    className="input mt-2"
                  />
                )}
              </div>
              <div>
                <label className="label">Model *</label>
                {modelHasDropdown ? (
                  <>
                    <select
                      value={modelChoice}
                      onChange={e=>handleModelChoice(e.target.value)}
                      className="input"
                    >
                      <option value="">Select model</option>
                      {modelOptions.map(model => <option key={model} value={model}>{model}</option>)}
                      <option value="Other">Other</option>
                    </select>
                    {modelChoice==='Other'&&(
                      <input
                        value={customModel}
                        onChange={e=>handleCustomModel(e.target.value)}
                        placeholder="Enter model / variant"
                        className="input mt-2"
                      />
                    )}
                  </>
                ) : (
                  <input
                    value={form.model}
                    onChange={e=>handleCustomModel(e.target.value)}
                    placeholder={form.make ? 'Enter model / variant' : 'Select make first'}
                    disabled={!form.make}
                    className="input disabled:bg-gray-50 disabled:text-gray-400"
                  />
                )}
              </div>
              <div><label className="label">Year *</label>
                <select value={form.year} onChange={e=>set('year',e.target.value)} className="input">
                  <option value="">Select</option>{YEAR_OPTIONS.map(y=><option key={y}>{y}</option>)}
                </select></div>
              <div><label className="label">Mileage (km) *</label><input value={form.mileage} onChange={e=>set('mileage',e.target.value)} type="number" placeholder="e.g. 45000" className="input"/></div>
              <div><label className="label">Transmission *</label>
                <select value={form.transmission} onChange={e=>set('transmission',e.target.value)} className="input">
                  <option value="">Select</option>{TRANS.map(t=><option key={t}>{t}</option>)}
                </select></div>
              <div><label className="label">Fuel type *</label>
                <select value={form.fuelType} onChange={e=>set('fuelType',e.target.value)} className="input">
                  <option value="">Select</option>{FUEL_TYPES.map(t=><option key={t}>{t}</option>)}
                </select></div>
              <div><label className="label">Condition *</label>
                <select value={form.condition} onChange={e=>set('condition',e.target.value)} className="input">
                  <option value="">Select</option>{CAR_CONDITIONS.map(t=><option key={t}>{t}</option>)}
                </select></div>
              <div><label className="label">Assembled *</label>
                <select value={form.assembly} onChange={e=>set('assembly',e.target.value)} className="input">
                  <option value="">Select</option>{ASSEMBLY_TYPES.map(t=><option key={t}>{t}</option>)}
                </select></div>
              <div><label className="label">City *</label>
                <select value={form.city} onChange={e=>set('city',e.target.value)} className="input">
                  <option value="">Select</option>{CITIES.map(c=><option key={c}>{c}</option>)}
                </select></div>
              <div><label className="label">Registered *</label>
                <select value={registeredLocationChoice} onChange={e=>handleRegisteredLocationChoice(e.target.value)} className="input">
                  <option value="">Select</option>{REGISTERED_LOCATIONS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                {registeredLocationChoice==='Other'&&(
                  <input
                    value={customRegisteredLocation}
                    onChange={e=>handleCustomRegisteredLocation(e.target.value)}
                    placeholder="Enter registered"
                    className="input mt-2"
                  />
                )}
              </div>
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
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <label className="label mb-3">Car features (optional)</label>
              <div className="-mx-1 overflow-x-auto pb-2">
                <div className="flex gap-2 px-1">
                  {CAR_FEATURES.map(feature => {
                    const selected = findFeature(feature)
                    return (
                      <button
                        key={feature}
                        type="button"
                        onClick={()=>toggleFeature(feature)}
                        className={`flex-none rounded-full border px-3 py-2 text-xs font-black transition-colors ${selected ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-navy/40'}`}
                      >
                        {selected ? '✓ ' : ''}{feature}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={customFeature}
                  onChange={e=>setCustomFeature(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addCustomFeature()}}}
                  placeholder="Add custom feature"
                  className="input !py-2.5 text-sm"
                />
                <button type="button" onClick={addCustomFeature} className="btn-navy shrink-0 text-sm !px-4 !py-2.5">Add</button>
              </div>
              {selectedFeatures.length>0&&(
                <div className="mt-3 -mx-1 overflow-x-auto pb-1">
                  <div className="flex gap-2 px-1">
                    {selectedFeatures.map(feature=>(
                      <button key={feature} type="button" onClick={()=>toggleFeature(feature)} className="flex-none rounded-full bg-greenlight px-3 py-1.5 text-xs font-black text-green">
                        {feature} ×
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
            <button type="button" onClick={()=>{if(!form.make||!form.model||!form.year||!form.mileage||!form.city||!form.registeredLocation||!form.transmission||!form.fuelType||!form.condition||!form.assembly||!contact.name.trim()||!contact.phone.trim()){alert('Fill all required fields (*)');return}if(contact.phone.replace(/\D/g,'').length<8){alert('Enter a valid contact phone number.');return}setStep(2)}} className="btn-navy w-full justify-center">Next — Add photos →</button>
          </div>
        )}
        {step===2 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">📸 Add photos of your car. First photo is the cover. Large photos are automatically compressed for fast upload and loading.</p>
            <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-navylight">
              {previews[selectedPhotoIndex] ? (
                <div className="relative aspect-[16/10]">
                  <img src={previews[selectedPhotoIndex]} alt={vehiclePhotoAlt(selectedPhotoIndex, 'selected listing photo')} className="h-full w-full object-contain"/>
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
                  <img src={src} alt={vehiclePhotoAlt(i, 'listing thumbnail photo')} className="h-full w-full object-contain bg-navylight"/>
                  {i===0&&<span className="absolute top-1 left-1 bg-gold text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded">Cover</span>}
                  <span onClick={(event)=>{event.stopPropagation();removePhoto(i)}} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">✕</span>
                </button>
              ))}
              {totalPhotos<MAX_PHOTOS&&<label htmlFor={PHOTO_INPUT_ID} className="aspect-square rounded-xl border-2 border-dashed border-navy flex cursor-pointer flex-col items-center justify-center bg-navylight text-navy hover:bg-blue-50 transition-colors"><span className="text-2xl">+</span><span className="text-xs font-semibold mt-1">Add photos</span></label>}
            </div>
            <input id={PHOTO_INPUT_ID} type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoChange}/>
            <p className="text-xs text-gray-400 text-center mb-4">{totalPhotos}/{MAX_PHOTOS} photos</p>
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
              <button type="button" onClick={publish} disabled={loading} className="btn-navy flex-1 justify-center text-sm disabled:opacity-60">{loading?stage||'Publishing…':isEditMode?'Save changes':'Publish listing 🚀'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
