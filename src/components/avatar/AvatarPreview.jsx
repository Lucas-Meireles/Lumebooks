import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import './avatar.css'

function mapSkinColor(color) {
  const map = {
    light: 'f2d3b1',
    yellow: 'f1c27d',
    tanned: 'd08b5b',
    brown: 'ae5d29',
    darkBrown: '8d5524',
    black: '5c3836',
  }

  return map[color] || 'f2d3b1'
}

function buildAvatarUrl(config = {}) {
  try {
    const params = new URLSearchParams()

    params.set('seed', config.seed || 'User')
    params.set('top', config.top || 'shortFlat')
    params.set('eyes', config.eyes || 'default')
    params.set('eyebrows', config.eyebrows || 'default')
    params.set('mouth', config.mouth || 'smile')
    params.set('clothing', config.clothing || 'hoodie')
    params.set('backgroundColor', config.backgroundColor || 'b6e3f4')
    params.set('skinColor', mapSkinColor(config.skinColor))
    params.set('radius', '50')

    if (config.accessories && config.accessories !== 'none') {
      params.set('accessories', config.accessories)
    }

    if (config.facialHair && config.facialHair !== 'none') {
      params.set('facialHair', config.facialHair)
    }

    return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`
  } catch (err) {
    console.error('Erro ao montar avatar:', err)
    return ''
  }
}

export default function AvatarPreview({ config = {}, size = 'lg' }) {
  const [avatarUrl, setAvatarUrl] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    const safeConfig = {
      seed: config?.seed || 'User',
      top: config?.top || 'shortFlat',
      eyes: config?.eyes || 'default',
      eyebrows: config?.eyebrows || 'default',
      mouth: config?.mouth || 'smile',
      accessories: config?.accessories || 'none',
      clothing: config?.clothing || 'hoodie',
      facialHair: config?.facialHair || 'none',
      backgroundColor: config?.backgroundColor || 'b6e3f4',
      skinColor: config?.skinColor || 'light',
    }

    const url = buildAvatarUrl(safeConfig)

    console.log('🎯 Avatar URL:', url)
    console.log('🧠 Config usada:', safeConfig)

    setAvatarUrl(url)
    setError(false)
  }, [config])

  return (
    <div className={`avatar-preview avatar-preview--${size}`}>
      <div className="avatar-preview__glow" />

      {!error && avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="avatar-preview__image"
          loading="lazy"
          draggable={false}
          onError={() => {
            console.error('❌ Falha ao carregar avatar:', avatarUrl)
            setError(true)
          }}
        />
      ) : (
        <div className="avatar-fallback">
          😐
        </div>
      )}
    </div>
  )
}

AvatarPreview.propTypes = {
  config: PropTypes.object,
  size: PropTypes.string,
}