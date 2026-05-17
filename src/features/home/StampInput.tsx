import { useState } from 'react';
import '../../styles/StampInput.css';
import OrderProcess from '../../components/common/Orderprocess';
import OrderComplete_receipt from './OrderComplete_receipt';
import OrderComplete_alarm from './OrderComplete_alarm';

type StampInputProps = {
  onNext?: () => void;
  onSkip?: () => void;
};

export default function StampInput({ onNext, onSkip }: StampInputProps) {
  const [phoneNumber, setPhoneNumber] = useState('010');
  const [skipPhase, setSkipPhase] = useState<'none' | 'receipt' | 'alarm'>('none');

  const handleKeyPress = (val: string) => {
    if (val === '←') {
      setPhoneNumber((prev) => (prev.length > 3 ? prev.slice(0, -1) : '010'));
      return;
    }
    if (phoneNumber.length >= 11) return;
    setPhoneNumber((prev) => prev + val);
  };

  const formatPhoneNumber = (num: string) => {
    const s = num.replace(/[^0-9]/g, '');
    if (s.length <= 3) return s;
    if (s.length <= 7) return `${s.slice(0, 3)} - ${s.slice(3)}`;
    return `${s.slice(0, 3)} - ${s.slice(3, 7)} - ${s.slice(7)}`;
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
      return;
    }
    setSkipPhase('receipt');
  };

  if (skipPhase === 'receipt') {
    return <OrderComplete_receipt onNext={() => setSkipPhase('alarm')} />;
  }

  if (skipPhase === 'alarm') {
    return <OrderComplete_alarm onHome={() => setSkipPhase('none')} />;
  }

  return (
    <div className="complete-page">
      <OrderProcess
        step={3}
        steps={['메뉴선택', '결제하기', '적립하기', '주문완료']}
      />
      <div className="complete-card">
        <h1 className="complete-title">스탬프 적립</h1>
        <p className="stamp-input-sub">적립할 휴대폰 번호를 입력하세요!</p>

        <div className="phone-display">{formatPhoneNumber(phoneNumber)}</div>

        <div className="keypad-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              className="key-btn"
              onClick={() => handleKeyPress(num.toString())}
            >
              {num}
            </button>
          ))}
          <button type="button" className="key-btn" onClick={() => setPhoneNumber('010')}>
            010
          </button>
          <button type="button" className="key-btn" onClick={() => handleKeyPress('0')}>
            0
          </button>
          <button type="button" className="key-btn back-btn" onClick={() => handleKeyPress('←')}>
            <svg width="42" height="32" viewBox="0 0 42 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 7L11 16L18 25" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M34 16H11" stroke="black" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="button-group">
          <button type="button" className="no-btn" onClick={handleSkip}>
            적립안함
          </button>
          <button type="button" className="yes-btn" onClick={onNext}>
            입력 완료
          </button>
        </div>
      </div>
    </div>
  );
}
