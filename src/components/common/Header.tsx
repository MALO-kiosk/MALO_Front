import '../../styles/Header.css';
import homeIcon from '../../assets/icons/homeIcon.svg'; // 아이콘 파일의 정확한 경로로 수정해주세요
import bellIcon from '../../assets/icons/bell.svg';

interface HeaderProps {
  onHome?: () => void;
}

export default function Header({ onHome }: HeaderProps) {
  return (
    <header 
      className="kiosk-header" 
      style={{ 
        position: 'absolute', 
        top: '0px', 
        left: '0px', 
        width: '1080px', 
        height: '120px', 
        backgroundColor: 'transparent',
        margin: 0,
        padding: 0,
        zIndex: 1000 // 다른 컨텐츠보다 위에 오도록 설정
      }}
    >
      <button
        className="header-home-btn"
        onClick={onHome}
        type="button"
        style={{
          position: 'absolute',
          top: '35.55px',
          left: '44.92px',
          display: 'flex',
          width: '197px',
          height: '66px',
          padding: '10px',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '7px',
          borderRadius: '56px',
          border: '2px solid #656666',
          background: 'none',
          margin: 0,
          cursor: 'pointer',
        }}
      >
        <img
          src={homeIcon}
          alt="home"
          style={{
            width: '29.16666603088379px',
            height: '32.891666412353516px',
            opacity: 1,
            transform: 'rotate(0deg)',
            display: 'block'
          }}
        />
        <span style={{
          color: '#656666',
          fontFamily: 'Pretendard',
          fontSize: '32px',
          fontStyle: 'normal',
          fontWeight: 400,
          lineHeight: '1', // 텍스트 높이 때문에 아이콘 위치가 변하지 않게 고정
          whiteSpace: 'nowrap'
        }}>
          처음으로
        </span>
      </button>

      <button
        className="staff-call-btn"
        type="button"
        style={{
          position: 'absolute',
          right: '40.38px', // 화면 오른쪽에서 정확히 40.38px
          top: '35.55px',
          display: 'flex',
          width: '197px',
          height: '66px',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '7px',
          alignSelf: 'stretch',
          padding: '10px',
          borderRadius: '56px',
          border: '2px solid #656666',
          background: 'none',
          margin: 0,
          cursor: 'pointer',
        }}
      >
        <span style={{
          color: '#656666',
          fontFamily: 'Pretendard',
          fontSize: '32px',
          fontStyle: 'normal',
          fontWeight: 400,
          lineHeight: 'normal',
          whiteSpace: 'nowrap'
        }}>
          직원 호출
        </span>
        <img
          src={bellIcon}
          alt="bell"
          style={{
            width: '35px',
            height: '35px',
            aspectRatio: '1 / 1',
            display: 'block',
            opacity: 1,
            transform: 'rotate(0deg)'
          }}
        />
      </button>
    </header>
  );
}
