import '../../styles/OrderComplete_alarm.css';
import '../../styles/StampProgress.css';
import OrderProcess from '../../components/common/Orderprocess';
import alarmImg from "../../assets/images/alarm.svg";

export default function OrderComplete_alarm({ onHome }: any) {
  return (
    <div className="complete-page order-complete-alarm-view stamp-progress-view">
      <OrderProcess
        step={4}
        steps={['메뉴선택', '결제하기', '적립하기', '주문완료']}
      />
      <div className="order-flow-overlay" aria-hidden />

      <div className="complete-card custom-complete-card">
        <div className="stamp-progress-card-inner">
          <h1 className="stamp-progress-title">주문 완료</h1>
          <p 
            className="stamp-progress-main alarm-main-text"
            style={{
              width: '643px',
              color: '#000',
              textAlign: 'center',
              fontFamily: 'Pretendard',
              fontSize: '48px',
              fontStyle: 'normal',
              fontWeight: '500',
              lineHeight: 'normal',
            }}
          >옆에있는 진동벨을 가지고 가세요!</p>
          <img 
            src={alarmImg} 
            alt="진동벨" 
            className="receipt-img alarm-img-position" 
            style={{
              position: 'absolute',
              top: '415px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '440px',
              height: '440px',
              aspectRatio: '1 / 1',
            }}
          />
          <div className="button-group">
            <button
              type="button"
              className="stamp-progress-complete-btn"
              onClick={onHome}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}