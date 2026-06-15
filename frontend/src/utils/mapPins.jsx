import { getTagMeta } from '../constants/placeTags'

export function TagPin({ tagId, size, selected = false }) {
  const { pinClass, emoji } = getTagMeta(tagId)
  const pinSize = selected ? size + 4 : size

  return (
    <span
      className={`place-pin ${pinClass} ${selected ? 'selected-pin' : ''}`}
      style={{ width: pinSize, height: pinSize }}
    >
      <span className="pin-emoji" aria-hidden="true">
        {emoji}
      </span>
    </span>
  )
}
