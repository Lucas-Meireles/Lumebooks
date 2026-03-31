import { avatarOptions } from './avatarOptions'
import AvatarPreview from './AvatarPreview'
import './avatar.css'

const sections = [
  { key: 'top', title: 'Cabelo / topo' },
  { key: 'skinColor', title: 'Tom de pele' },
  { key: 'eyes', title: 'Olhos' },
  { key: 'eyebrows', title: 'Sobrancelhas' },
  { key: 'mouth', title: 'Boca' },
  { key: 'accessories', title: 'Acessórios' },
  { key: 'facialHair', title: 'Barba / bigode' },
  { key: 'clothing', title: 'Roupa' },
  { key: 'backgroundColor', title: 'Fundo' },
]

export default function AvatarBuilder({ value = {}, onChange, seed }) {
  function updateField(field, fieldValue) {
    if (typeof onChange !== 'function') return

    onChange({
      ...value,
      seed: seed || value?.seed || 'LumeBooks',
      [field]: String(fieldValue).trim(),
    })
  }

  return (
    <div className="avatar-builder">
      <aside className="avatar-builder__sticky-preview">
        <div className="avatar-builder__preview-card">
          <span className="avatar-builder__preview-badge">Preview ao vivo</span>

          <AvatarPreview
            config={{
              ...value,
              seed: seed || value?.seed || 'LumeBooks',
            }}
            size="xl"
          />
        </div>
      </aside>

      <div className="avatar-builder__controls">
        {sections.map((section) => (
          <div key={section.key} className="avatar-builder__section">
            <h4>{section.title}</h4>

            <div className="avatar-builder__grid">
              {avatarOptions[section.key]?.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    value?.[section.key] === option.value
                      ? 'avatar-builder__option active'
                      : 'avatar-builder__option'
                  }
                  onClick={() => updateField(section.key, option.value)}
                >
                  {section.key === 'backgroundColor' ? (
                    <span
                      className="avatar-builder__swatch"
                      style={{ backgroundColor: `#${option.value}` }}
                    />
                  ) : section.key === 'skinColor' ? (
                    <span
                      className="avatar-builder__swatch avatar-builder__swatch--skin"
                      style={{ backgroundColor: getSkinColorPreview(option.value) }}
                      title={option.label}
                    />
                  ) : (
                    <span className="avatar-builder__label">{option.label}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getSkinColorPreview(value) {
  const skinMap = {
    light: '#f2d3b1',
    yellow: '#f1c27d',
    tanned: '#d08b5b',
    brown: '#ae5d29',
    darkBrown: '#8d5524',
    black: '#5c3836',
  }

  return skinMap[value] || '#f2d3b1'
}