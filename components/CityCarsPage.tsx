import { CarsClient } from '@/app/cars/CarsClient'

export function CityCarsPage({ city }: { city: string }) {
  return <CarsClient initialCity={city} initialMake="All" initialTrusted={false} />
}
