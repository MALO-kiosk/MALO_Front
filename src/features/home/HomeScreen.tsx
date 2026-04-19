import { OutlineFrame } from '@/components/common'
import './HomeScreen.css'

export function HomeScreen() {
  return (
    <div className="home-screen">
      <OutlineFrame variant="home" className="home-screen__back-frame" />
      <OutlineFrame variant="staff" className="home-screen__staff-frame" />
    </div>
  )
}
