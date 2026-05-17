// src/components/ui/NumberPad.tsx

interface Props {
  onNumberClick: (num: string) => void; // 숫자를 눌렀을 때 실행할 함수
  onDelete: () => void;                // 지우기를 눌렀을 때 실행할 함수
}

export const NumberPad = ({ onNumberClick, onDelete }: Props) => {
  const buttons = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "010", "0", "←"];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(3, 1fr)', 
      gap: '10px', 
      padding: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      {buttons.map((btn) => (
        <button
          key={btn}
          onClick={() => btn === "←" ? onDelete() : onNumberClick(btn)}
          style={{
            padding: '20px',
            fontSize: '24px',
            fontWeight: 'bold',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {btn}
        </button>
      ))}
    </div>
  );
};