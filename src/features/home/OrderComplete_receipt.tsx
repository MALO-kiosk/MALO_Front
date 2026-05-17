import '../../styles/OrderComplete_receipt.css';
import '../../styles/StampProgress.css';
import OrderProcess from '../../components/common/Orderprocess';
import receiptImg from "../../assets/images/receipt.png";

export default function OrderComplete_receipt({ onNext }: any) {
  return (
    <div className="complete-page stamp-progress-view" style={{ position: 'relative', width: '1080px', height: '1920px' }}>
      <OrderProcess
        step={4}
        steps={['메뉴선택', '결제하기', '적립하기', '주문완료']}
      />
      {/* 카드박스 제외 전체를 덮는 오버레이 (파란 막대 포함) */}
      <div className="order-flow-overlay" aria-hidden />

      <div 
        className="complete-card"
        style={{
          width: '823px',
          height: '1220px',
          borderRadius: '36px',
          background: '#FFF',
          boxShadow: '0 0 8.9px 6px rgba(0, 0, 0, 0.04)',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          boxSizing: 'border-box',
          zIndex: 10001
        }}
      >
        <div className="stamp-progress-card-inner">
          <h1 className="stamp-progress-title">주문 완료</h1>
          <p className="stamp-progress-main">영수증을 출력 할까요?</p>
          <img 
            src={receiptImg} 
            alt="영수증" 
            className="receipt-img"
            style={{ position: 'absolute', top: '450px', left: '50%', transform: 'translateX(-50%)', width: '372px', height: '306px', objectFit: 'contain' }}
          />
          <div className="button-group">
            <button 
              className="no-btn" 
              onClick={onNext}
              style={{
                flex: '0 0 355px', // flex-grow: 0, flex-shrink: 0, flex-basis: 355px
                height: '128px',
                boxSizing: 'border-box', // 패딩이 너비에 포함되도록 설정
                display: 'flex',
                padding: '36px 0 35px 0', // 좌우 패딩을 0으로 조정하여 너비 확보
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '10px 0 0 10px',
                background: '#656666',
                boxShadow: '0 0 50.4px 0 rgba(0, 0, 0, 0.09)'
              }}
            >아니요</button>
            <button 
              className="yes-btn" 
              onClick={onNext}
              style={{
                display: 'flex',
                flex: '0 0 355px', // flex-grow: 0, flex-shrink: 0, flex-basis: 355px
                boxSizing: 'border-box', // 패딩이 너비에 포함되도록 설정
                height: '128px',
                padding: '36px 0 35px 0',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0,
                borderRadius: '0 10px 10px 0',
                background: '#4880EE'
              }}
            >예</button>
          </div>
        </div>
      </div>
    </div>
  );
}