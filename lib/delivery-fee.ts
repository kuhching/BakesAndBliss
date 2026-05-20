export type ProductType = 'cookies' | 'cakes'
export type DeliveryMode = 'self-collect' | 'delivery'

export interface DeliveryFeeParams {
  mode: DeliveryMode
  subtotalCents: number
  productType?: ProductType
  hotelsOrPeak?: boolean
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
  const { mode, subtotalCents, productType, hotelsOrPeak, eveOrHoliday, specificTime } = params

  if (mode === 'self-collect') {
    return { baseCents: 0, surcharges: [], totalCents: 0, isFoc: false }
  }

  const surcharges: { label: string; cents: number }[] = []
  if (hotelsOrPeak) surcharges.push({ label: 'Hotels / Hospitals / Peak', cents: 500 })
  if (eveOrHoliday) surcharges.push({ label: 'Eve or Public Holiday', cents: 500 })
  if (specificTime) surcharges.push({ label: 'Specific time request', cents: 1000 })

  const surchargeTotalCents = surcharges.reduce((s, x) => s + x.cents, 0)
  const isFoc = subtotalCents >= 20000
  const baseCents = isFoc ? 0 : (productType === 'cookies' ? 1500 : 2000)

  return { baseCents, surcharges, totalCents: baseCents + surchargeTotalCents, isFoc }
}
