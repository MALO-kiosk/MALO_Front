import cupIcon from '@/assets/icons/cup_icon.svg'
import togoCupIcon from '@/assets/icons/togocup_icon.svg'
import addImg from '@/assets/images/addimg.png'
import { OutlineFrame } from '@/components/common'
import './HomeScreen.css'

export type HomeScreenProps = {
  /** 매장·포장 중 하나를 탭했을 때 (예: 모드 선택 페이지로 이동) */
  onPlaceTypeSelected?: () => void
}

export function HomeScreen({ onPlaceTypeSelected }: HomeScreenProps) {
  return (
    <div className="home-screen">
      <OutlineFrame variant="home" className="home-screen__back-frame" />
      <OutlineFrame variant="staff" className="home-screen__staff-frame" />
      <img
        src={addImg}
        alt=""
        className="home-screen__addimg"
        width={1080}
        height={1344}
      />
      <div className="home-screen__bar">
        <p className="home-screen__bar-text">
          *현금결제는 직원에게 문의 바랍니다.*
        </p>
      </div>
      <button
        type="button"
        className="home-screen__tile-btn home-screen__tile-btn--dinein"
        aria-label="매장"
        onClick={() => onPlaceTypeSelected?.()}
      >
        <span className="home-screen__tile-btn-row">
          <img
            src={cupIcon}
            alt=""
            className="home-screen__tile-btn-icon"
            width={65}
            height={65}
          />
          <span className="home-screen__tile-btn-label">매장</span>
        </span>
      </button>
      <button
        type="button"
        className="home-screen__tile-btn home-screen__tile-btn--takeout"
        aria-label="포장"
        onClick={() => onPlaceTypeSelected?.()}
      >
        <span className="home-screen__tile-btn-row">
          <img
            src={togoCupIcon}
            alt=""
            className="home-screen__tile-btn-icon"
            width={65}
            height={65}
          />
          <span className="home-screen__tile-btn-label">포장</span>
        </span>
      </button>
    </div>
  )
}
