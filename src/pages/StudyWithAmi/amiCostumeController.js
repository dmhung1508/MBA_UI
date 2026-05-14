// Forces costume parameters every frame via beforeModelUpdate,
// so facial expressions and motions can never blend them back to default.
// Uses exponential lerp for smooth transitions matching the original expression fade times.
const COSTUME_TARGETS = {
  'Glasses Toggle':    { Param_Glasses: 10, Param_Jacket: 0 },
  'Jacket Toggle':     { Param_Glasses: 0,  Param_Jacket: 10 },
  'No_Jacket_Glasses': { Param_Glasses: 10, Param_Jacket: 10 },
  'Default':           { Param_Glasses: 0,  Param_Jacket: 0 },
};
const PARAM_IDS = ['Param_Glasses', 'Param_Jacket'];
const SMOOTHNESS = 8; // ~0.35s fade, matching original FadeInTime

export function createAmiCostumeController(model) {
  const internal = model?.internalModel;
  const core = internal?.coreModel;
  if (!core) return { setCostume() {}, dispose() {} };

  // Current interpolated values
  const current = { Param_Glasses: 0, Param_Jacket: 0 };
  let target    = { Param_Glasses: 0, Param_Jacket: 0 };
  let lastTime  = performance.now();

  const onBeforeModelUpdate = () => {
    const now = performance.now();
    const dt  = Math.min(0.05, (now - lastTime) / 1000);
    lastTime  = now;
    const k   = 1 - Math.exp(-SMOOTHNESS * dt);

    for (const id of PARAM_IDS) {
      current[id] += (target[id] - current[id]) * k;
      if (Math.abs(current[id] - target[id]) < 0.01) current[id] = target[id];
      core.setParameterValueById(id, current[id]);
    }
  };

  internal.on('beforeModelUpdate', onBeforeModelUpdate);

  return {
    setCostume(key) {
      target = { ...(COSTUME_TARGETS[key] || { Param_Glasses: 0, Param_Jacket: 0 }) };
    },
    dispose() {
      internal.off('beforeModelUpdate', onBeforeModelUpdate);
    },
  };
}
