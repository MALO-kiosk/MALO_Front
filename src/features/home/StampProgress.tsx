import '../../styles/StampProgress.css';
import OrderProcess from '../../components/common/Orderprocess';

type StampProgressProps = {
  currentCount: number
  totalCount: number
  gotCoupon?: boolean
  onNext?: () => void
}

export default function StampProgress({ currentCount, totalCount, gotCoupon = false, onNext }: StampProgressProps) {
  const progressWidth = (currentCount / totalCount) * 100;
  return (
    <div className="complete-page stamp-progress-view" style={{ position: 'relative', width: '1080px', height: '1920px' }}>
      <OrderProcess
        step={3}
        steps={['메뉴선택', '결제하기', '적립하기', '주문완료']}
      />
      {/* 카드박스 제외 전체를 덮는 오버레이 (파란 막대 포함) */}
      <div className="order-flow-overlay" aria-hidden />

      <div className="complete-card" style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        zIndex: 10001 
      }}>
        <div className="stamp-progress-card-inner">
          <h1 className="stamp-progress-title">
            {gotCoupon ? '쿠폰 발급!' : '스탬프 적립'}
          </h1>
          <p className="stamp-progress-main">
            {gotCoupon ? '스탬프 10개 달성! 쿠폰이 발급되었습니다.' : '포인트 1개가 적립되었습니다!'}
          </p>
          <p className="stamp-progress-sub">포인트 10개 적립시 음료 쿠폰 증정</p>
          <div className="stamp-progress-container">
            <div className="stamp-progress-bar">
              <div className="stamp-progress-fill" style={{ width: `${progressWidth}%` }}>
                {currentCount}/{totalCount}
              </div>
            </div>
          </div>
          <div className="button-group">
            <button className="stamp-progress-complete-btn" onClick={onNext}>완료</button>
          </div>
        </div>
      </div>
    </div>
  );
}