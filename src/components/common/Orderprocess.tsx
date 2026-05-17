export default function OrderProcess({ 
  step = 1, 
  steps = ['메뉴선택', '결제하기', '적립하기', '주문완료'] 
}: { step?: number; steps?: string[] }) {

  // 글자 가운데 정렬을 위한 계산 변수
  const stepWidth = 111; // 각 글자 컨테이너 너비
  const gap = 134;       // 글자 사이의 간격
  const totalBarWidth = 926; // 전체 진행바 너비
  const totalLabelWidth = (steps.length * stepWidth) + ((steps.length - 1) * gap); // 전체 글자 영역 너비
  const sideOffset = (totalBarWidth - totalLabelWidth) / 2; // 바 시작점과 첫 글자 시작점 사이의 여백

  return (
    <div 
      style={{
        position: 'absolute',
        top: '145.05px',   // 버튼 바닥(101.55) + 여백(43.5) = 145.05px
        left: '0px',
        width: '100%',
        maxWidth: '1080px',
        display: 'flex',
        flexDirection: 'column', // 글자행과 진행바를 세로로 배치
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: 'transparent',
        zIndex: 9999,      // 헤더나 다른 카드보다 무조건 위
        pointerEvents: 'none',
        gap: '23.5px'      // 글자 하단으로부터 진행바까지의 여백 23.5px
      }}
    >
      <div 
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '134px'     // 지들끼리 여백 134px
        }}
      >
        {steps.map((label, index) => {
          // 해당하는 단계(현재 단계) 글자만 파란색으로 표시
          const isCurrent = index + 1 === step;
          return (
            <div 
              key={label}
              style={{
                width: '111px',   // 너비 111px 고정
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <span style={{
                color: isCurrent ? '#4880EE' : '#505050',
                fontFamily: 'Pretendard',
                fontSize: '32px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: 'normal',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 진행바 (Progress Bar) 큰 틀 */}
      <div 
        style={{
          width: '926px',
          height: '19px',
          borderRadius: '20px',
          background: '#F4F4F4',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* 실제 진행도 표시 */}
        <div 
          style={{
            // 마지막 단계(주문완료)는 926px로 꽉 채우고, 나머지는 글자 중앙에 맞춤
            width: `${step === steps.length ? 926 : (sideOffset + (step - 1) * (stepWidth + gap) + (stepWidth / 2))}px`, 
            height: '19px',
            borderRadius: '22px',
            background: '#4880EE'
          }}
        />
      </div>
    </div>
  );
}