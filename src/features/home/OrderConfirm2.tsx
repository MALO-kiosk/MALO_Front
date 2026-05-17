import '../../styles/OrderConfirm2.css'
import OrderProcess from '../../components/common/Orderprocess'
import type { OrderLineDraft } from '@/lib/orderLineDraft'
import { OrderConfirmContent } from './OrderConfirmContent'

type OrderConfirm2Props = {
  line: OrderLineDraft
  onNext?: () => void
  onPrev?: () => void
}

export default function OrderConfirm2({
  line,
  onNext,
  onPrev,
}: OrderConfirm2Props) {
  return (
    <div className="complete-page">
      <OrderProcess
        step={1}
        steps={['메뉴선택', '결제하기', '적립하기', '주문완료']}
      />
      <OrderConfirmContent line={line} onNext={onNext} onPrev={onPrev} />
    </div>
  )
}
