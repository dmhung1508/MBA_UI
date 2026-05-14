/** Live2D parameter id — khớp với PTIT_SDK.cdi3.json / ptit_sdk.model3.json (nhóm LipSync). */
const PARAM_MOUTH_OPEN_Y = 'ParamMouthOpenY'
const PARAM_MOUTH_FORM = 'ParamMouthForm'
const PARAM_MOUTH_FUNNEL = 'ParamMouthFunnel'
const PARAM_MOUTH_PUCKER_WIDEN = 'ParamMouthPuckerWiden'
const AGENT_MOUTH_LEVEL_SCALE = 0.74

// open: Độ há miệng theo trục dọc (cao/thấp).
// form: Độ bè/thu của dáng miệng (ngang, thiên cười hoặc khép).
// funnel: Mức chu môi tạo khẩu hình tròn (quan trọng cho U/O).
// puckerWiden: Cân bằng giữa chu môi (pucker) và kéo bè môi (widen).

const VOWEL_PROFILES = {
  u: { open: 0.35, form: -0.2, funnel: 0.9, puckerWiden: -0.6 },
  e: { open: 0.45, form: 0.9, funnel: 0.05, puckerWiden: 0.7 },
  o: { open: 0.6, form: -0.5, funnel: 0.9, puckerWiden: -0.3 },
  a: { open: 1, form: 0.1, funnel: 0.1, puckerWiden: 0.2 },
  i: { open: 0.25, form: 1, funnel: 0, puckerWiden: 0.9 },
}

/**
 * Giữ nút → mở miệng mượt; thả → trở lại theo motion/biểu cảm.
 * Blend với giá trị hiện tại trên từng frame để không làm tắt hoàn toàn animation môi từ motion.
 *
 * @param {import('pixi-live2d-display/cubism4').Live2DModel} model
 * @param {{ smoothness?: number, smoothnessClose?: number }} [options] smoothness khi mở; smoothnessClose khi đóng (mặc định nhanh hơn để khớp khe giữa các từ)
 */
export function createAmiMouthHold(model, options = {}) {
  const smoothnessOpen = options.smoothness ?? 16
  const smoothnessClose = options.smoothnessClose ?? 26
  const internal = model?.internalModel
  const core = internal?.coreModel
  if (!core) {
    return {
      setPressed() {},
      setAgentTranscriptionActive() {},
      dispose() {},
    }
  }

  const readParamRange = (id) => {
    try {
      const idx = core.getParameterIndex(id)
      if (idx < 0 || idx >= core.getParameterCount()) return null
      return {
        min: core.getParameterMinimumValue(idx),
        max: core.getParameterMaximumValue(idx),
      }
    } catch {
      return null
    }
  }

  const mouthOpenRange = readParamRange(PARAM_MOUTH_OPEN_Y)
  const mouthFormRange = readParamRange(PARAM_MOUTH_FORM)
  const mouthFunnelRange = readParamRange(PARAM_MOUTH_FUNNEL)
  const mouthPuckerWidenRange = readParamRange(PARAM_MOUTH_PUCKER_WIDEN)

  const toRange = (range, unitValue) => {
    if (!range || !Number.isFinite(unitValue)) return null
    const normalized = Math.max(-1, Math.min(1, unitValue))
    const v =
      normalized >= 0
        ? range.max * normalized
        : Math.abs(range.min) * normalized
    return Math.max(range.min, Math.min(range.max, v))
  }

  let blend = 0
  let pressed = false
  let vowel = null
  /** 0..1 từ agent (0 / 0.5 / 1 sau khi hook làm mượt). */
  let agentMouthLevel = 0
  let vowelBlend = 0
  let lastTime = performance.now()

  const onBeforeModelUpdate = () => {
    const now = performance.now()
    const dt = Math.min(0.055, (now - lastTime) / 1000)
    lastTime = now

    const vowelProfile = vowel ? VOWEL_PROFILES[vowel] : null
    // Khi agent đang phát mức miệng (>0), ưu tiên agent để tránh bị nút thủ công ghim miệng.
    const manualFull = (pressed || vowelProfile) && agentMouthLevel <= 0.001
    /** Mức mở miệng mong muốn: 0 | 0.5 | 1 (hoặc liên tục gần đó). */
    const agentTarget = Math.max(0, Math.min(1, agentMouthLevel * AGENT_MOUTH_LEVEL_SCALE))
    const targetBlend = manualFull ? 1 : agentTarget
    const wantOpen = targetBlend > 0.002
    // Agent: nhảy mức lớn (vd 0.5 <-> 1 mỗi 50ms) — lerp Cubism sẽ nuốt dao động; snap khi lệch lớn.
    if (!manualFull) {
      const err = Math.abs(targetBlend - blend)
      if (err > 0.2) {
        blend = targetBlend
      } else {
        const smooth = blend > targetBlend ? smoothnessClose : smoothnessOpen
        const k = 1 - Math.exp(-smooth * dt)
        blend += (targetBlend - blend) * k
      }
    } else {
      const smooth = blend > targetBlend ? smoothnessClose : smoothnessOpen
      const k = 1 - Math.exp(-smooth * dt)
      blend += (targetBlend - blend) * k
    }

    if (!wantOpen && blend < 0.004) {
      blend = 0
    }

    const base = core.getParameterValueById(PARAM_MOUTH_OPEN_Y)
    const maxOpen = mouthOpenRange?.max ?? 1
    const minOpen = mouthOpenRange?.min ?? 0
    const vowelOpen = vowelProfile ? (mouthOpenRange ? toRange(mouthOpenRange, vowelProfile.open) : null) : null
    const targetOpen = vowelOpen ?? maxOpen

    if (manualFull) {
      const value = base * (1 - blend) + targetOpen * blend
      core.setParameterValueById(PARAM_MOUTH_OPEN_Y, value)
    } else {
      // Agent mode: đặt trực tiếp theo mức 0..1 để tránh bị base/motion đẩy lên full liên tục.
      const levelOpen = minOpen + (maxOpen - minOpen) * blend
      core.setParameterValueById(PARAM_MOUTH_OPEN_Y, levelOpen)
    }

    const vowelTargetBlend = vowelProfile ? blend : 0
    const vowelSmooth = vowelProfile ? 24 : 14
    const vowelK = 1 - Math.exp(-vowelSmooth * dt)
    vowelBlend += (vowelTargetBlend - vowelBlend) * vowelK
    if (vowelBlend < 0.003 && !vowelProfile) vowelBlend = 0

    const formUnit = vowelProfile ? vowelProfile.form : 0
    const funnelUnit = vowelProfile ? vowelProfile.funnel : 0
    const puckerWidenUnit = vowelProfile ? vowelProfile.puckerWiden : 0

    const formValue = toRange(mouthFormRange, formUnit)
    const funnelValue = toRange(mouthFunnelRange, funnelUnit)
    const puckerWidenValue = toRange(mouthPuckerWidenRange, puckerWidenUnit)

    if (formValue !== null) {
      const formBase = core.getParameterValueById(PARAM_MOUTH_FORM)
      core.setParameterValueById(PARAM_MOUTH_FORM, formBase * (1 - vowelBlend) + formValue * vowelBlend)
    }
    if (funnelValue !== null) {
      const funnelBase = core.getParameterValueById(PARAM_MOUTH_FUNNEL)
      core.setParameterValueById(PARAM_MOUTH_FUNNEL, funnelBase * (1 - vowelBlend) + funnelValue * vowelBlend)
    }
    if (puckerWidenValue !== null) {
      const puckerBase = core.getParameterValueById(PARAM_MOUTH_PUCKER_WIDEN)
      core.setParameterValueById(
        PARAM_MOUTH_PUCKER_WIDEN,
        puckerBase * (1 - vowelBlend) + puckerWidenValue * vowelBlend
      )
    }
  }

  internal.on('beforeModelUpdate', onBeforeModelUpdate)

  return {
    setPressed(down) {
      pressed = Boolean(down)
      if (pressed) vowel = null
    },
    setVowel(nextVowel) {
      const normalized = typeof nextVowel === 'string' ? nextVowel.toLowerCase() : null
      vowel = normalized && VOWEL_PROFILES[normalized] ? normalized : null
      if (vowel) pressed = false
    },
    setAgentTranscriptionActive(active) {
      if (typeof active === 'number' && Number.isFinite(active)) {
        agentMouthLevel = Math.max(0, Math.min(1, active))
      } else {
        agentMouthLevel = active ? 1 : 0
      }
    },
    dispose() {
      internal.off('beforeModelUpdate', onBeforeModelUpdate)
    },
  }
}
