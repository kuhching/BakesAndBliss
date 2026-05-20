/** '$15 tier' = cookies, brownies, tartlets. '$20 tier' = cakes with frosting. */
export type ProductType = 'cookies' | 'cakes'
export type DeliveryMode = 'self-collect' | 'delivery'

export interface DeliveryFeeParams {
  mode: DeliveryMode
  subtotalCents: number
  productType?: ProductType
  hotelsHospitalsOrPeak?: boolean
  eveOrHoliday?: boolean
  specificTime?: boolean
}

export interface DeliveryFeeResult {
  baseCents: number
  surcharges: { label: string; cents: number }[]
  totalCents: number
  isFoc: boolean
}

export function calculateDeliveryFee(params: DeliveryFeeParams): DeliveryFeeResult {
  const { mode, subtotalCents, productType, hotelsHospitalsOrPeak, eveOrHoliday, specificTime } = params

  if (mode === 'self-collect') {
    return { baseCents: 0, surcharges: [], totalCents: 0, isFoc: false }
  }

  const surcharges: { label: string; cents: number }[] = []
  if (hotelsHospitalsOrPeak) surcharges.push({ label: 'Hotels / Hospitals / Peak', cents: 500 })
  if (eveOrHoliday) surcharges.push({ label: 'Eve or Public Holiday', cents: 500 })
  if (specificTime) surcharges.push({ label: 'Specific Time Request', cents: 1000 })

  const surchargeTotalCents = surcharges.reduce((s, x) => s + x.cents, 0)
  const isFoc = subtotalCents >= 20000
  // Default to cakes ($20) if productType not provided — the higher tier is the safer billing default
  const resolvedType = productType ?? 'cakes'
  const baseCents = isFoc ? 0 : (resolvedType === 'cookies' ? 1500 : 2000)

  return { baseCents, surcharges, totalCents: baseCents + surchargeTotalCents, isFoc }
}
