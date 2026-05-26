import { CarsClient } from '@/app/cars/CarsClient'
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  breadcrumbJsonLd,
  carsCollectionJsonLd,
  cityFaqJsonLd,
  citySlug,
  jsonLdGraph,
} from '@/lib/seo'

export function CityCarsPage({ city }: { city: string }) {
  const path = `/cars-for-sale-${citySlug(city)}`
  const title = `Used Cars for Sale in ${city}`
  const description = `Browse used cars for sale in ${city}. Inspected cars appear first, include vehicle health checks, and can be supported by Vehiqal during the deal.`
  const cityJsonLd = jsonLdGraph([
    carsCollectionJsonLd({ title, description, path, city }),
    breadcrumbJsonLd([
      { name:'Home', path:'/' },
      { name:'Cars', path:'/cars' },
      { name:`Cars in ${city}`, path },
    ]),
    cityFaqJsonLd(city),
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html:JSON.stringify(cityJsonLd) }}/>
      <CarsClient initialCity={city} initialMake="All" initialTrusted={false} />
      <section className="border-t border-gray-100 bg-white px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr] md:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gold">Local car search</p>
              <h2 className="mt-2 text-2xl font-black text-gray-900">Buying used cars in {city} with more confidence</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Vehiqal helps buyers compare used cars in {city} by make, city, inspection status, price, mileage, fuel type, condition, and seller contact. Inspected cars are shown first so buyers can quickly find listings with stronger vehicle information.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Sellers in {city} can list a car for free and request inspection when they want the listing to stand out as an inspected car.
              </p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-navylight p-5">
              <h3 className="font-black text-navy">Need help in {city}?</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Talk to Vehiqal before you bid, sell, or request inspection.
              </p>
              <a href={`tel:${CONTACT_PHONE_TEL}`} className="mt-4 inline-flex rounded-lg bg-navy px-4 py-2 text-sm font-black text-white hover:bg-navydark">
                Call {CONTACT_PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
