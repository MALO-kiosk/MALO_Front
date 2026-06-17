import { useEffect, useRef, useState } from 'react'
import { addBanner, deleteBanner, fetchBanners, type Banner } from '@/lib/bannerService'
import './BannerAdminPage.css'

const MAX_BANNERS = 3

export function BannerAdminPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const data = await fetchBanners()
    setBanners(data)
  }

  useEffect(() => { load().catch(console.error) }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (banners.length >= MAX_BANNERS) {
      setError('배너는 최대 3개까지 등록할 수 있습니다.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await addBanner(file)
      await load()
    } catch (err) {
      setError('업로드 실패: ' + String(err))
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (banner: Banner) => {
    if (!window.confirm('이 배너를 삭제하시겠습니까?')) return
    setLoading(true)
    setError(null)
    try {
      await deleteBanner(banner.id, banner.image_url)
      await load()
    } catch (err) {
      setError('삭제 실패: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="banner-admin">
      <header className="banner-admin__header">
        <h1 className="banner-admin__title">배너 관리</h1>
        <span className="banner-admin__count">{banners.length} / {MAX_BANNERS}</span>
      </header>

      {error && <p className="banner-admin__error">{error}</p>}

      <div className="banner-admin__list">
        {banners.length === 0 && !loading && (
          <p className="banner-admin__empty">등록된 배너가 없습니다.</p>
        )}
        {banners.map((b, i) => (
          <div key={b.id} className="banner-admin__item">
            <span className="banner-admin__item-num">{i + 1}</span>
            <img
              src={b.image_url}
              alt={`배너 ${i + 1}`}
              className="banner-admin__item-img"
            />
            <div className="banner-admin__item-info">
              <span className="banner-admin__item-date">
                {new Date(b.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
            <button
              type="button"
              className="banner-admin__item-delete"
              onClick={() => handleDelete(b)}
              disabled={loading}
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      <div className="banner-admin__upload-area">
        {banners.length < MAX_BANNERS ? (
          <label className={`banner-admin__upload-btn${loading ? ' banner-admin__upload-btn--loading' : ''}`}>
            {loading ? '처리 중...' : '+ 배너 이미지 추가'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={loading}
              className="banner-admin__upload-input"
            />
          </label>
        ) : (
          <p className="banner-admin__full-msg">
            배너가 최대 {MAX_BANNERS}개 등록되었습니다. 삭제 후 추가할 수 있습니다.
          </p>
        )}
        <p className="banner-admin__hint">
          배너는 최대 3개까지 등록할 수 있으며, 메인 화면에서 5초마다 랜덤으로 전환됩니다.
        </p>
      </div>
    </div>
  )
}
