import { useEffect, useState } from 'react'
import cupIcon from '@/assets/icons/cup_icon.svg'
import togoCupIcon from '@/assets/icons/togocup_icon.svg'
import addImg from '@/assets/images/addimg.png'
import { OutlineFrame } from '@/components/common'
import { fetchBanners, type Banner } from '@/lib/bannerService'
import './HomeScreen.css'

export type HomeScreenProps = {
  onPlaceTypeSelected?: (type: 'dine_in' | 'takeout') => void
  onStaffCall?: () => void
}

export function HomeScreen({ onPlaceTypeSelected, onStaffCall }: HomeScreenProps) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    fetchBanners().then(setBanners).catch(console.error)
  }, [])

  // 배너가 2개 이상일 때만 5초마다 랜덤 전환
  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIdx((prev) => {
        const others = banners.map((_, i) => i).filter((i) => i !== prev)
        return others[Math.floor(Math.random() * others.length)]!
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  const bannerSrc = banners.length > 0 ? (banners[currentIdx]?.image_url ?? addImg) : addImg

  return (
    <div className="home-screen">
      <OutlineFrame variant="home" className="home-screen__back-frame" />
      <OutlineFrame variant="staff" className="home-screen__staff-frame" onStaffCall={onStaffCall} />
      <img
        key={currentIdx}
        src={bannerSrc}
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
        onClick={() => onPlaceTypeSelected?.('dine_in')}
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
        onClick={() => onPlaceTypeSelected?.('takeout')}
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
