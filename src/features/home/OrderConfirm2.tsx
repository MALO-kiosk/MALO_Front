import { TopWhitePanel } from '@/components/common'
import '../../styles/OrderConfirm2.css'
import OrderProcess from '../../components/common/Orderprocess'
import type { OrderLineDraft } from '@/lib/orderLineDraft'
import { OrderConfirmContent } from './OrderConfirmContent'

type OrderConfirm2Props = {
  lines: OrderLineDraft[]
  onNext?: () => void
  onPrev?: () => void
}

export default function OrderConfirm2({
  lines,
  onNext,
  onPrev,
}: OrderConfirm2Props) {
  return (
    <div className="complete-page order-confirm-page">
      <OrderProcess
        step={1}
        steps={['메뉴선택', '결제하기', '적립하기', '주문완료']}
      />
      <TopWhitePanel className="order-confirm-page__panel" heightPx={269} />
      <OrderConfirmContent lines={lines} onNext={onNext} onPrev={onPrev} />
    </div>
  )
}
