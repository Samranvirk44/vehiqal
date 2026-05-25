'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { CITIES, MAKES, formatPrice, getCars, type Car } from '@/lib/cars'

type ChatLink = {
  label: string
  href: string
}

type ChatMessage = {
  id: number
  role: 'bot' | 'user'
  text: string
  links?: ChatLink[]
}

const CONTACT_PHONE_DISPLAY = '0303 4642619'
const CONTACT_PHONE_TEL = '+923034642619'
const CONTACT_WHATSAPP = '923034642619'
const CONTACT_EMAIL = 'info@vehiqal.com'

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'bot',
    text: 'Hi, I can help with cities, inspected cars, contact details, and public car listings.',
  },
]

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function findMake(question: string) {
  const normalizedQuestion = normalize(question)
  return MAKES.find(make => make !== 'Other' && normalizedQuestion.includes(normalize(make)))
    ?? MAKES.find(make => make !== 'Other' && normalize(make).split(' ').some(part => part.length > 2 && normalizedQuestion.includes(part)))
    ?? ''
}

function findCity(question: string) {
  const normalizedQuestion = normalize(question)
  return CITIES.find(city => normalizedQuestion.includes(normalize(city))) ?? ''
}

function asksForContact(question: string) {
  return /\b(contact|phone|call|whatsapp|email|number|support|help)\b/i.test(question)
}

function asksForCities(question: string) {
  return /\b(cities|city|operate|location|locations|where)\b/i.test(question)
}

function asksForTrustedCars(question: string) {
  return /\b(trusted|verified|inspected|inspection)\b/i.test(question)
}

function asksForCars(question: string) {
  return /\b(car|cars|vehicle|vehicles|toyota|honda|suzuki|kia|hyundai|mg|changan|audi|bmw|mercedes|tesla)\b/i.test(question)
}

function isSensitiveQuestion(question: string) {
  return /\b(password|credential|credentials|otp|code|admin|login|user data|user phone|buyer phone|seller phone|bids|bidder|private|secret|database dump|firestore rules|token)\b/i.test(question)
}

function carLinks(cars: Car[]) {
  return cars.map(car => ({
    label: `${car.make} ${car.model} ${car.year} - ${formatPrice(car.price)}`,
    href: `/cars/${car.id}`,
  }))
}

function filterCars(cars: Car[], make: string) {
  if (!make) return cars
  const target = normalize(make)
  return cars.filter(car => {
    const carMake = normalize(car.make)
    return carMake === target || carMake.includes(target) || target.includes(carMake)
  })
}

export function AiChatBot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const nextId = useRef(2)

  const quickQuestions = useMemo(() => ['Cities', 'Inspected cars', 'Contact', 'Toyota cars'], [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, open])

  const addMessage = (message: Omit<ChatMessage, 'id'>) => {
    setMessages(current => [...current, { ...message, id: nextId.current++ }])
  }

  const answerQuestion = async (rawQuestion: string) => {
    const question = rawQuestion.trim()
    if (!question) return

    addMessage({ role:'user', text:question })
    setLoading(true)

    try {
      if (isSensitiveQuestion(question)) {
        addMessage({
          role:'bot',
          text:'I can only help with public listing information. I cannot share credentials, OTPs, admin data, user records, bids, or private contact data.',
        })
        return
      }

      if (asksForContact(question)) {
        addMessage({
          role:'bot',
          text:`You can call Vehiqal at ${CONTACT_PHONE_DISPLAY} or email ${CONTACT_EMAIL}.`,
          links:[
            { label:'Call Vehiqal', href:`tel:${CONTACT_PHONE_TEL}` },
            { label:'WhatsApp Vehiqal', href:`https://wa.me/${CONTACT_WHATSAPP}` },
            { label:'Email Vehiqal', href:`mailto:${CONTACT_EMAIL}` },
          ],
        })
        return
      }

      if (asksForCities(question) && !asksForCars(question)) {
        addMessage({
          role:'bot',
          text:`We operate in ${CITIES.join(', ')}.`,
          links:CITIES.slice(0, 6).map(city => ({
            label:`Cars in ${city}`,
            href:`/cars?city=${encodeURIComponent(city)}`,
          })),
        })
        return
      }

      const make = findMake(question)
      const city = findCity(question)
      const trustedOnly = asksForTrustedCars(question)

      if (asksForCars(question) || trustedOnly || make || city) {
        const cars = filterCars(await getCars({ city:city || undefined, trustedOnly, pageLimit:100 }), make).slice(0, 5)
        if (cars.length === 0) {
          const parts = [trustedOnly ? 'inspected' : '', make, city ? `in ${city}` : ''].filter(Boolean).join(' ')
          addMessage({
            role:'bot',
            text:`I could not find ${parts || 'matching'} cars right now. You can browse all public listings or call us for help.`,
            links:[
              { label:'Browse cars', href:'/cars' },
              { label:'Call Vehiqal', href:`tel:${CONTACT_PHONE_TEL}` },
            ],
          })
          return
        }

        const summary = [
          trustedOnly ? 'inspected' : '',
          make,
          city ? `in ${city}` : '',
        ].filter(Boolean).join(' ')

        addMessage({
          role:'bot',
          text:`I found ${cars.length} ${summary || 'public'} car${cars.length === 1 ? '' : 's'}.`,
          links:carLinks(cars),
        })
        return
      }

      addMessage({
        role:'bot',
        text:'I can help with public car listings, inspected cars, operating cities, and Vehiqal contact details.',
        links:[
          { label:'Browse cars', href:'/cars' },
          { label:'Sell your car', href:'/sell' },
          { label:'Call Vehiqal', href:`tel:${CONTACT_PHONE_TEL}` },
        ],
      })
    } catch (error) {
      console.error('AI chat assistant error:', error)
      addMessage({
        role:'bot',
        text:'I could not load car listings right now. Please try again or contact Vehiqal directly.',
        links:[{ label:'Call Vehiqal', href:`tel:${CONTACT_PHONE_TEL}` }],
      })
    } finally {
      setLoading(false)
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const question = input
    setInput('')
    await answerQuestion(question)
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] sm:bottom-5 sm:right-5">
      {open && (
        <div className="mb-3 w-[calc(100vw-2rem)] max-w-[390px] overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-2xl shadow-navy/20">
          <div className="flex items-center justify-between bg-navy px-4 py-3 text-white">
            <div>
              <p className="text-sm font-black">Vehiqal AI</p>
              <p className="text-xs text-blue-200">Public car help</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg font-black hover:bg-white/20"
              aria-label="Close chat"
            >
              x
            </button>
          </div>

          <div className="max-h-[430px] min-h-[280px] overflow-y-auto bg-gray-50 px-4 py-4">
            <div className="space-y-3">
              {messages.map(message => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.role === 'user' ? 'bg-navy text-white' : 'bg-white text-gray-700 shadow-sm'}`}>
                    <p>{message.text}</p>
                    {message.links && message.links.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.links.map(link => (
                          <a
                            key={`${message.id}-${link.href}-${link.label}`}
                            href={link.href}
                            target={link.href.startsWith('http') ? '_blank' : undefined}
                            rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="block rounded-xl border border-navy/10 bg-navylight px-3 py-2 text-xs font-black text-navy hover:border-navy/30"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="inline-flex rounded-2xl bg-white px-3 py-2 text-sm font-bold text-gray-400 shadow-sm">
                  Checking public listings...
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </div>

          <div className="border-t border-gray-100 bg-white p-3">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {quickQuestions.map(question => (
                <button
                  key={question}
                  type="button"
                  onClick={() => answerQuestion(question)}
                  className="flex-none rounded-full border border-gray-200 px-3 py-1.5 text-xs font-black text-gray-600 hover:border-navy/30 hover:bg-navylight hover:text-navy"
                >
                  {question}
                </button>
              ))}
            </div>
            <form onSubmit={submit} className="flex gap-2">
              <input
                value={input}
                onChange={event => setInput(event.target.value)}
                placeholder="Ask about cars"
                className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
              <button type="submit" disabled={loading || !input.trim()} className="rounded-xl bg-navy px-4 py-2 text-sm font-black text-white hover:bg-navydark disabled:cursor-not-allowed disabled:opacity-50">
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-black text-yellow-950 shadow-xl shadow-navy/20 transition-transform hover:-translate-y-0.5 hover:bg-golddark"
        aria-expanded={open}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[11px] text-white">AI</span>
        Ask Vehiqal
      </button>
    </div>
  )
}
