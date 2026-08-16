import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/*
 * 帧率封顶 60fps：高刷屏（120Hz ProMotion）上浏览器会按原生刷新率渲染，
 * GPU 负载直接翻倍，是风扇起飞的主因。对这类艺术作品 60fps 已足够流畅。
 * 60Hz 屏上此限帧器无副作用（每帧照常通过）。每个注册独立节流，
 * 多个 RAF 消费者（R3F 渲染循环 / GSAP 等）互不干扰，且兼容 cancelAnimationFrame。
 */
(() => {
  const nativeRAF = window.requestAnimationFrame.bind(window);
  const nativeCAF = window.cancelAnimationFrame.bind(window);
  const interval = 1000 / 60;
  const registrations = new Map<number, { cancelled: boolean; nativeHandle: number; last: number }>();
  let nextId = 1;

  window.requestAnimationFrame = (cb: FrameRequestCallback) => {
    const id = nextId++;
    const state = { cancelled: false, nativeHandle: 0, last: 0 };
    const loop = (t: number) => {
      if (state.cancelled) return;
      const elapsed = t - state.last;
      if (elapsed >= interval - 0.5) {
        state.last = t - (elapsed % interval);
        registrations.delete(id);
        cb(t);
      } else {
        state.nativeHandle = nativeRAF(loop);
      }
    };
    state.nativeHandle = nativeRAF(loop);
    registrations.set(id, state);
    return id;
  };

  window.cancelAnimationFrame = (id: number) => {
    const state = registrations.get(id);
    if (state) {
      state.cancelled = true;
      nativeCAF(state.nativeHandle);
      registrations.delete(id);
    } else {
      nativeCAF(id);
    }
  };
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
