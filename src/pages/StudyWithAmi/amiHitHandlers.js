/**
 * Click vào HitArea_Head / HitArea_Body (ptit_sdk.model3.json) -> ngẫu nhiên Hitbox 1-5.
 * Cursor pointer chỉ khi hover hai vùng đó.
 *
 * Lưu ý: pixi-live2d-display dùng HitArea.Name làm khóa; Name rỗng khiến các vùng đè lên nhau.
 */

/** @type {readonly string[]} — khớp Id/Name trong public/Ami/ptit_sdk.model3.json HitAreas */
const MODEL_HIT_AREAS = ['HitArea_Body', 'HitArea_Head']

const HITBOX_MOTIONS = [
  ['Hitbox1', 0],
  ['Hitbox2', 0],
  ['Hitbox3', 0],
  ['Hitbox4', 0],
  ['Hitbox5', 0],
]

/**
 * @param {object} model - Live2DModel instance
 * @param {HTMLCanvasElement} view - canvas element (app.view)
 * @param {function} onActivity - gọi khi có hoạt động (reset idle timer)
 * @returns {function} cleanup
 */
export function setupHitHandlers(model, view, onActivity) {
  if (!model) return () => {}

  const triggersHitMotion = (hitAreaNames) => {
    const names = Array.isArray(hitAreaNames) ? hitAreaNames : []
    return names.some((n) => MODEL_HIT_AREAS.includes(n))
  }

  const onHit = (hitAreaNames) => {
    if (!triggersHitMotion(hitAreaNames)) return
    const [group, index] = HITBOX_MOTIONS[Math.floor(Math.random() * HITBOX_MOTIONS.length)]
    model.motion(group, index).catch((err) => console.warn('Ami hitbox motion failed:', err))
    onActivity?.()
  }

  const onPointerDown = (e) => {
    model.tap(e.clientX, e.clientY)
  }

  const onPointerMove = (e) => {
    const hitAreas = model.hitTest?.(e.clientX, e.clientY) ?? []
    const isOnHitArea = triggersHitMotion(hitAreas)
    view.style.cursor = isOnHitArea ? 'pointer' : ''
  }

  const onPointerLeave = () => {
    view.style.cursor = ''
  }

  model.on('hit', onHit)

  if (view) {
    view.addEventListener('pointerdown', onPointerDown)
    view.addEventListener('pointermove', onPointerMove)
    view.addEventListener('pointerleave', onPointerLeave)
  }

  return () => {
    model.removeListener?.('hit', onHit)
    view?.removeEventListener('pointerdown', onPointerDown)
    view?.removeEventListener('pointermove', onPointerMove)
    view?.removeEventListener('pointerleave', onPointerLeave)
    if (view) view.style.cursor = ''
  }
}
