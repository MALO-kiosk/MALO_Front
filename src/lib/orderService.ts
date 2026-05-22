import type { OrderLineDraft } from './orderLineDraft'
import { supabase } from './supabase'

export type PlaceType = 'dine_in' | 'takeout'

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

export async function saveStampAndGetCount(
  orderId: string,
  phoneNumber: string,
): Promise<number> {
  // 전화번호로 기존 스탬프 조회
  const { data: existing } = await supabase
    .from('stamps')
    .select('id, count')
    .eq('phone_number', phoneNumber)
    .maybeSingle()

  let newCount: number

  if (existing) {
    newCount = existing.count + 1
    await supabase
      .from('stamps')
      .update({ count: newCount, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    newCount = 1
    await supabase
      .from('stamps')
      .insert({ phone_number: phoneNumber, count: 1 })
  }

  // order에 전화번호 기록
  await supabase
    .from('orders')
    .update({ phone_number: phoneNumber })
    .eq('id', orderId)

  return newCount
}
