import type { OrderLineDraft } from './orderLineDraft'
import { supabase } from './supabase'

export type PlaceType = 'dine_in' | 'takeout'

const STAMP_MAX = 10

export async function saveOrder(
  placeType: PlaceType,
  lines: OrderLineDraft[],
): Promise<string | null> {
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({ place_type: placeType })
    .select('id')
    .single()

  if (orderError || !orderData) {
    console.error('[saveOrder] order insert error:', orderError?.message)
    return null
  }

  const orderId = orderData.id

  const items = lines.map((line) => ({
    order_id: orderId,
    menu_item_id: line.id,
    menu_name: line.name,
    quantity: line.quantity,
    unit_price_won: line.unitPriceWon,
    temp: line.isDessert ? null : line.temp,
    size: line.isDessert ? null : line.size,
    cup: line.isDessert ? null : line.cup,
    sweetness: line.isDessert ? null : line.sweetness,
    shot_qty: line.shotQty,
    syrup_qty: line.syrupQty,
    pearl_qtys: line.pearlQtys,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(items)

  if (itemsError) {
    console.error('[saveOrder] order_items insert error:', itemsError.message)
  }

  return orderId
}

/**
 * 스탬프 적립. 10개 달성 시 쿠폰 1개 발급 후 스탬프 초기화.
 * stamps 테이블에 coupon_count integer default 0 컬럼 필요.
 */
export async function saveStampAndGetCount(
  orderId: string,
  phoneNumber: string,
): Promise<{ count: number; gotCoupon: boolean }> {
  const { data: existing } = await supabase
    .from('stamps')
    .select('id, count, coupon_count')
    .eq('phone_number', phoneNumber)
    .maybeSingle()

  let newCount: number
  let newCouponCount: number
  let gotCoupon = false

  if (existing) {
    const next = (existing.count ?? 0) + 1
    if (next >= STAMP_MAX) {
      newCount = 0
      newCouponCount = (existing.coupon_count ?? 0) + 1
      gotCoupon = true
    } else {
      newCount = next
      newCouponCount = existing.coupon_count ?? 0
    }
    await supabase
      .from('stamps')
      .update({ count: newCount, coupon_count: newCouponCount, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    newCount = 1
    newCouponCount = 0
    await supabase
      .from('stamps')
      .insert({ phone_number: phoneNumber, count: 1, coupon_count: 0 })
  }

  await supabase
    .from('orders')
    .update({ phone_number: phoneNumber })
    .eq('id', orderId)

  return { count: newCount, gotCoupon }
}

/**
 * 쿠폰 확인 후 차감. 쿠폰이 있으면 true, 없으면 false.
 */
export async function checkAndUseCoupon(phoneNumber: string): Promise<boolean> {
  const { data } = await supabase
    .from('stamps')
    .select('id, coupon_count')
    .eq('phone_number', phoneNumber)
    .maybeSingle()

  if (!data || !data.coupon_count || data.coupon_count <= 0) return false

  await supabase
    .from('stamps')
    .update({ coupon_count: data.coupon_count - 1 })
    .eq('id', data.id)

  return true
}
