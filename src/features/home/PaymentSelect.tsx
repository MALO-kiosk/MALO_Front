import { TopWhitePanel } from '@/components/common'
import '../../styles/PaymentSelect.css'
import OrderProcess from '../../components/common/Orderprocess'
import payIcon from '../../assets/icons/pay.svg';
import pay2Icon from '../../assets/icons/pay2.svg';
import pay3Icon from '../../assets/icons/pay3.svg';
import pay4Icon from '../../assets/icons/pay4.svg';
import pay5Icon from '../../assets/icons/pay5.svg';

export default function PaymentSelect({ onNext, onPrev }: any) {
  return (
    <div className="complete-page payment-select-page">
      <OrderProcess
        step={2}
        steps={['메뉴선택', '결제하기', '적립하기', '주문완료']}
      />
      <TopWhitePanel className="payment-select-page__panel" heightPx={269} />

      <div className="complete-card">
        <h1 className="complete-title">결제 수단을 선택해 주세요!</h1>

        {/* 모바일 페이 버튼 */}
        <button className="mobile-pay-container" onClick={onNext}>
          <img src={payIcon} alt="pay" className="pay-icon-select" />
          <span className="mobile-pay-text">모바일 페이</span>
        </button>

        {/* 쿠폰사용 버튼 */}
        <button className="coupon-pay-container" onClick={onNext}>
          <img src={pay2Icon} alt="coupon" className="pay2-icon-select" />
          <span className="coupon-pay-text">쿠폰사용</span>
        </button>

        {/* 할인 수단 버튼 */}
        <button className="discount-pay-container" onClick={onNext}>
          <img src={pay3Icon} alt="discount" className="pay3-icon-select" />
          <span className="discount-pay-text">할인 수단</span>
        </button>

        {/* 앱 카드 버튼 */}
        <button className="app-card-container" onClick={onNext}>
          <img src={pay4Icon} alt="app card" className="pay4-icon-select" />
          <span className="app-card-text">앱 카드</span>
        </button>

        {/* 신용카드 버튼 */}
        <button className="credit-card-container" onClick={onNext}>
          <img src={pay5Icon} alt="credit card" className="pay5-icon-select" />
          <span className="credit-card-text">신용카드</span>
        </button>

        {/* 이전 버튼 (회색) - 절대 위치 정렬을 위해 div 밖으로 이동 */}
        <button className="prev-btn-full" onClick={onPrev}>이전</button>
      </div>
    </div>
  );
}