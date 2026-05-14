/**
 * Bộ đếm idle: nếu 20s không có hoạt động nào (tự động hoặc người dùng),
 * gọi một hoạt động tự động ngẫu nhiên.
 */
import { DEFAULT_ACTIVITY_MOTIONS, DEFAULT_EXPRESSIONS } from './amiDefaultActivities.js'

const IDLE_TIMEOUT_MS = 20_000
const EXPRESSION_ROTATE_MS = 20_000

/**
 * Khởi tạo idle timer.
 * @param {object} model - Live2DModel instance
 * @returns {{ notifyActivity: function, stop: function }}
 */
export function startIdleTimer(model) {
  if (!model) {
    return { notifyActivity: () => {}, stop: () => {} }
  }

  let timeoutId = null
  let expressionIntervalId = null
  let paused = false

  const applyRandomExpression = () => {
    if (!DEFAULT_EXPRESSIONS.length) return
    const name =
      DEFAULT_EXPRESSIONS[Math.floor(Math.random() * DEFAULT_EXPRESSIONS.length)]
    try {
      model.expression(name)
    } catch (err) {
      console.warn('Ami random expression failed:', err)
    }
  }

  const playRandom = () => {
    const [group, index] =
      DEFAULT_ACTIVITY_MOTIONS[Math.floor(Math.random() * DEFAULT_ACTIVITY_MOTIONS.length)]
    model.motion(group, index).catch((err) => console.warn('Ami idle activity failed:', err))
    resetTimer()
  }

  const resetTimer = () => {
    if (paused) return
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(playRandom, IDLE_TIMEOUT_MS)
  }

  const notifyActivity = () => {
    resetTimer()
  }

  const pause = () => {
    paused = true
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null }
    if (expressionIntervalId) { clearInterval(expressionIntervalId); expressionIntervalId = null }
  }

  const resume = () => {
    if (!paused) return
    paused = false
    resetTimer()
    expressionIntervalId = setInterval(applyRandomExpression, EXPRESSION_ROTATE_MS)
  }

  const stop = () => {
    paused = false
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null }
    if (expressionIntervalId) { clearInterval(expressionIntervalId); expressionIntervalId = null }
  }

  resetTimer()
  expressionIntervalId = setInterval(applyRandomExpression, EXPRESSION_ROTATE_MS)
  return { notifyActivity, pause, resume, stop }
}
