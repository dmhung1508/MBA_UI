import { useRef, useCallback, useEffect, useState } from "react";
import { startIdleTimer } from "../pages/StudyWithAmi/amiIdleTimer.js";
import { setupHitHandlers } from "../pages/StudyWithAmi/amiHitHandlers.js";
import { createAmiMouthHold } from "../pages/StudyWithAmi/amiMouthHold.js";
import { createAmiCostumeController } from "../pages/StudyWithAmi/amiCostumeController.js";

const BASE = import.meta.env.BASE_URL || "/";
const MODEL_PATH = `${BASE}ami_clone/public/live2d-models/Ami/ptit_sdk.model3.json`;
const SCRIPT_PATHS = [
  `${BASE}ami_clone/public/libs/pixi.min.js`,
  `${BASE}ami_clone/public/libs/live2dcubismcore.min.js`,
  `${BASE}ami_clone/public/libs/pixi-live2d-display-cubism4.min.js`,
];

const BASE_WIDTH = 420;
const BASE_HEIGHT = 1060;
const BASE_MODEL_SCALE = 0.40;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function removeScripts(paths) {
  paths.forEach((src) => document.querySelector(`script[src="${src}"]`)?.remove());
}

function waitForGlobal(name, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (window[name]) return resolve();
    const start = Date.now();
    const interval = setInterval(() => {
      if (window[name]) { clearInterval(interval); resolve(); }
      else if (Date.now() - start > timeoutMs) { clearInterval(interval); reject(new Error(`Timeout waiting for ${name}`)); }
    }, 50);
  });
}

function waitForLive2DPlugin(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (window.PIXI?.live2d?.Live2DModel) return resolve();
    const start = Date.now();
    const interval = setInterval(() => {
      if (window.PIXI?.live2d?.Live2DModel) { clearInterval(interval); resolve(); }
      else if (Date.now() - start > timeoutMs) { clearInterval(interval); reject(new Error("Timeout waiting for PIXI.live2d.Live2DModel")); }
    }, 50);
  });
}

async function loadScriptsSequentially(paths) {
  const noop = () => {};
  const origLog = console.log;
  console.log = noop;
  try {
    await loadScript(paths[0]);
    await waitForGlobal("PIXI");
    await loadScript(paths[1]);
    try { await waitForGlobal("Live2DCubismCore", 12000); }
    catch { try { await waitForGlobal("CubismFramework", 5000); } catch {} }
    await loadScript(paths[2]);
    await waitForLive2DPlugin(10000);
  } finally {
    console.log = origLog;
  }
}

export default function useLive2D(containerRef) {
  const appRef = useRef(null);
  const modelRef = useRef(null);
  const mouthHoldRef = useRef(null);
  const costumeControllerRef = useRef(null);
  const stopIdleRef = useRef(null);
  const pauseIdleRef = useRef(null);
  const resumeIdleRef = useRef(null);
  const stopHitRef = useRef(null);
  const notifyRef = useRef(() => {});
  const manuallyPositionedRef = useRef(false);
  const manuallyScaledRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const updateModelTransform = useCallback(() => {
    const model = modelRef.current;
    const app = appRef.current;
    if (!model || !app) return;
    if (!manuallyScaledRef.current) {
      const fitScale = BASE_MODEL_SCALE * Math.min(
        app.screen.width / BASE_WIDTH,
        app.screen.height / BASE_HEIGHT
      );
      model.scale.set(fitScale);
    }
    if (!manuallyPositionedRef.current) {
      model.position.set(app.screen.width / 2, app.screen.height * 0.92);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver = null;
    let removeDpr = null;

    async function tryInit() {
      await loadScriptsSequentially(SCRIPT_PATHS);
      if (cancelled) return;

      const PIXI = window.PIXI;
      if (!PIXI?.live2d?.Live2DModel) throw new Error("Live2D plugin not loaded");

      // Suppress Live2D library logs
      if (window.Live2DCubismCore?.Logging) window.Live2DCubismCore.Logging.level = window.Live2DCubismCore.Logging.logLevel_Off;
      if (PIXI.live2d.config) PIXI.live2d.config.logLevel = PIXI.live2d.config.LOG_LEVEL_NONE ?? 0;

      const container = containerRef.current;
      if (!container) throw new Error("Container not mounted");

      const getResolution = () => Math.max(1, window.devicePixelRatio || 1);

      const app = new PIXI.Application({
        width: Math.max(1, container.clientWidth),
        height: Math.max(1, container.clientHeight),
        resolution: getResolution(),
        autoDensity: true,
        backgroundAlpha: 0,
        antialias: true,
      });

      if (cancelled) { app.destroy(true); return; }

      container.appendChild(app.view || app.canvas);
      appRef.current = app;

      const syncRenderer = () => {
        const resolution = getResolution();
        if (app.renderer.resolution !== resolution) app.renderer.resolution = resolution;
        app.renderer.resize(
          Math.max(1, container.clientWidth),
          Math.max(1, container.clientHeight)
        );
        updateModelTransform();
      };

      resizeObserver = new ResizeObserver(syncRenderer);
      resizeObserver.observe(container);

      const watchDpr = () => {
        removeDpr?.();
        const mq = window.matchMedia(`(resolution: ${getResolution()}dppx)`);
        const handler = () => { if (!cancelled) { watchDpr(); syncRenderer(); } };
        mq.addEventListener("change", handler, { once: true });
        removeDpr = () => mq.removeEventListener("change", handler);
      };
      watchDpr();

      const model = await PIXI.live2d.Live2DModel.from(MODEL_PATH);
      if (cancelled) return;

      model.anchor.set(0.5, 0.5);
      model.interactive = true;
      model.interactiveChildren = true;
      app.stage.addChild(model);
      modelRef.current = model;
      updateModelTransform();

      const { notifyActivity, pause: pauseIdle, resume: resumeIdle, stop: stopIdle } = startIdleTimer(model);
      notifyRef.current = notifyActivity;
      pauseIdleRef.current = pauseIdle;
      resumeIdleRef.current = resumeIdle;
      stopIdleRef.current = stopIdle;

      stopHitRef.current = setupHitHandlers(model, app.view || app.canvas, notifyActivity);

      // Drag to reposition
      let dragging = false;
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      const canvas = app.view || app.canvas;
      const toCanvas = (e) => {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
      };
      const onDragDown = (e) => {
        dragging = true;
        const { x, y } = toCanvas(e);
        dragOffsetX = x - model.x;
        dragOffsetY = y - model.y;
      };
      const onDragMove = (e) => {
        if (!dragging) return;
        manuallyPositionedRef.current = true;
        const { x, y } = toCanvas(e);
        model.position.set(x - dragOffsetX, y - dragOffsetY);
      };
      const onDragUp = () => { dragging = false; };
      const MIN_SCALE = 0.15;
      const MAX_SCALE = 1.0;
      const onWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.02 : -0.02;
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, model.scale.x + delta));
        model.scale.set(next);
        manuallyScaledRef.current = true;
      };

      canvas.addEventListener('pointerdown', onDragDown);
      window.addEventListener('pointermove', onDragMove);
      window.addEventListener('pointerup', onDragUp);
      canvas.addEventListener('wheel', onWheel, { passive: false });

      // store cleanup on stopHit ref alongside hit handler cleanup
      const stopHitPrev = stopHitRef.current;
      stopHitRef.current = () => {
        stopHitPrev?.();
        canvas.removeEventListener('pointerdown', onDragDown);
        window.removeEventListener('pointermove', onDragMove);
        window.removeEventListener('pointerup', onDragUp);
        canvas.removeEventListener('wheel', onWheel);
      };

      mouthHoldRef.current = createAmiMouthHold(model);
      costumeControllerRef.current = createAmiCostumeController(model);

      setReady(true);
    }

    async function init() {
      const MAX_RETRIES = 3;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (cancelled) return;
        try {
          await tryInit();
          return;
        } catch (e) {
          if (cancelled) return;
          resizeObserver?.disconnect();
          resizeObserver = null;
          removeDpr?.();
          removeDpr = null;
          if (appRef.current) { try { appRef.current.destroy(true); } catch {} appRef.current = null; }
          if (mouthHoldRef.current) { try { mouthHoldRef.current.dispose(); } catch {} mouthHoldRef.current = null; }
          if (costumeControllerRef.current) { try { costumeControllerRef.current.dispose(); } catch {} costumeControllerRef.current = null; }
          stopIdleRef.current?.(); stopIdleRef.current = null;
          stopHitRef.current?.(); stopHitRef.current = null;
          modelRef.current = null;
          removeScripts(SCRIPT_PATHS);
          if (attempt === MAX_RETRIES) { setError(e.message); return; }
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      removeDpr?.();
      stopIdleRef.current?.(); stopIdleRef.current = null;
      stopHitRef.current?.(); stopHitRef.current = null;
      if (mouthHoldRef.current) { try { mouthHoldRef.current.dispose(); } catch {} mouthHoldRef.current = null; }
      if (costumeControllerRef.current) { try { costumeControllerRef.current.dispose(); } catch {} costumeControllerRef.current = null; }
      if (appRef.current) { try { appRef.current.destroy(true); } catch {} appRef.current = null; }
      modelRef.current = null;
    };
  }, []);

  const playMotion = useCallback(async (group) => {
    if (!modelRef.current) return;
    try { await modelRef.current.motion(group, 0); notifyRef.current?.(); } catch {}
  }, []);

  const setExpression = useCallback(async (name) => {
    if (!modelRef.current) return;
    try { await modelRef.current.expression(name); } catch {}
  }, []);

  const notifyActivity = useCallback(() => notifyRef.current?.(), []);
  const pauseIdle = useCallback(() => pauseIdleRef.current?.(), []);
  const resumeIdle = useCallback(() => resumeIdleRef.current?.(), []);
  const fitModel = useCallback(() => updateModelTransform(), [updateModelTransform]);

  return { ready, error, mouthHold: mouthHoldRef, costumeController: costumeControllerRef, playMotion, setExpression, notifyActivity, pauseIdle, resumeIdle, fitModel };
}
