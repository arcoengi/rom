"use strict";
// A real vCard remains available even with JavaScript disabled.
const intro = document.getElementById("intro");
const main = document.getElementById("main");
const footer = document.querySelector(".page-footer");
const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
let introTimer;
let exitTimer;
let leaving = false;

function completeIntro() {
  clearTimeout(introTimer);
  clearTimeout(exitTimer);
  const restoreFocus = document.activeElement === intro;
  intro.hidden = true;
  document.body.classList.remove("intro-active");
  main.inert = false;
  footer.inert = false;
  if (restoreFocus) main.focus({ preventScroll: true });
}

function dismissIntro(immediate = false) {
  if (intro.hidden) return;
  if (immediate || motion.matches) { completeIntro(); return; }
  if (leaving) return;
  leaving = true;
  clearTimeout(introTimer);
  intro.classList.add("is-leaving");
  main.classList.add("is-revealing");
  // Timeout also completes the transition if the browser skips transitionend.
  exitTimer = setTimeout(completeIntro, 800);
}

intro.addEventListener("click", () => dismissIntro());
intro.addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); dismissIntro(); }
});
intro.addEventListener("transitionend", event => {
  if (leaving && event.target === intro && event.propertyName === "transform") completeIntro();
});
if (!motion.matches) {
  // Install the hard stop before displaying the overlay.
  introTimer = setTimeout(() => dismissIntro(), 2400);
  intro.hidden = false;
  document.body.classList.add("intro-active");
  main.inert = true;
  footer.inert = true;
  intro.focus({ preventScroll: true });
}
if (typeof motion.addEventListener === "function") {
  motion.addEventListener("change", event => { if (event.matches) dismissIntro(true); });
}
// Returning from a phone/mail app must not leave an old overlay on screen.
window.addEventListener("pageshow", event => { if (event.persisted) dismissIntro(true); });

const toast = document.getElementById("toast");
let toastTimer;
function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) { /* Local fallback below. */ }
  }
  const previousFocus = document.activeElement;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("aria-label", "Текст для копирования");
  textarea.style.cssText = "position:fixed;left:0;top:0;opacity:0;font-size:16px";
  document.body.append(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  let copied = false;
  try { copied = document.execCommand("copy"); } catch (_) { /* Offer manual copying. */ }
  textarea.remove();
  if (previousFocus) previousFocus.focus();
  return copied;
}
document.querySelectorAll("[data-copy]").forEach(button => {
  button.hidden = false;
  button.addEventListener("click", async () => {
    const ok = await copyText(button.dataset.copy);
    notify(ok ? "Скопировано" : "Не удалось скопировать. Выделите текст и скопируйте вручную.");
  });
});
