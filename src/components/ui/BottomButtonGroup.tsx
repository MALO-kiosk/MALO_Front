// src/components/common/BottomButtonGroup.tsx

interface Props {
  leftText?: string;   // 왼쪽 버튼 글자 (기본값 "이전")
  rightText?: string;  // 오른쪽 버튼 글자 (기본값 "다음")
  onLeftClick?: () => void;
  onRightClick?: () => void;
}

export const BottomButtonGroup = ({ 
  leftText = "이전", 
  rightText = "다음", 
  onLeftClick, 
  onRightClick 
}: Props) => {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '12px', 
      width: '100%', 
      padding: '20px',
      position: 'fixed', // 화면 맨 아래 고정
      bottom: 0,
      left: 0,
      backgroundColor: 'white',
      borderTop: '1px solid #eee'
    }}>
      <button 
        onClick={onLeftClick}
        style={{ 
          flex: 1, 
          padding: '18px', 
          backgroundColor: '#4A4A4A', // 디자인의 회색 버튼
          color: 'white', 
          borderRadius: '8px',
          fontSize: '18px',
          fontWeight: 'bold',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {leftText}
      </button>
      <button 
        onClick={onRightClick}
        style={{ 
          flex: 1, 
          padding: '18px', 
          backgroundColor: '#2b66f6', // 디자인의 파란색 버튼
          color: 'white', 
          borderRadius: '8px',
          fontSize: '18px',
          fontWeight: 'bold',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {rightText}
      </button>
    </div>
  );
};