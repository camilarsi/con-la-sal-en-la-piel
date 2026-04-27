/* ============================================
   CON LA SAL EN LA PIEL — main.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────
     CARRUSEL (infinito opcional)
     - data-replicate="N" en .carousel-track clona
       las cards N veces para dar sensación infinita.
     - Cuando hay replicación, el offset se normaliza
       silenciosamente al cruzar un ciclo, así el usuario
       puede scrollear en cualquier dirección sin tope.
     - CARD_WIDTH dinámico (lee el DOM)
     - Flechas absolutas laterales
     - Dots de posición — uno por card único del ciclo
     - Swipe táctil
  ───────────────────────────────────────── */

  document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
    const trackId = wrapper.querySelector('.carousel-track')?.id;
    if (!trackId) return;

    const track          = document.getElementById(trackId);
    const replicate      = Math.max(1, parseInt(track.dataset.replicate || '1', 10));

    // Snapshot de las cards originales — definen el "ciclo"
    const originalCards  = Array.from(track.querySelectorAll('.carousel-card'));
    const cycleSize      = originalCards.length;

    // Replicar (clones se appendean al final del track)
    for (let r = 1; r < replicate; r++) {
      originalCards.forEach(card => track.appendChild(card.cloneNode(true)));
    }

    const cards          = Array.from(track.querySelectorAll('.carousel-card'));
    const btnPrev        = wrapper.querySelector('.carousel-btn[data-dir="-1"]');
    const btnNext        = wrapper.querySelector('.carousel-btn[data-dir="1"]');
    const dotsContainer  = wrapper.parentElement.querySelector('.carousel-dots');
    const isInfinite     = replicate > 1 && cycleSize > 0;

    let currentOffset    = 0;

    // ── Medidas dinámicas ──
    function getCardWidth() {
      const card = cards[0];
      if (!card) return 200;
      const gap = parseFloat(getComputedStyle(track).gap) || 14;
      return card.offsetWidth + gap;
    }

    function getVisibleCount() {
      const wrapperInner = wrapper.offsetWidth - 104; // 52px × 2 (flechas)
      return Math.max(1, Math.floor(wrapperInner / getCardWidth()));
    }

    function getCycleWidth() {
      return cycleSize * getCardWidth();
    }

    function getMaxOffset() {
      const visible = getVisibleCount();
      const steps   = Math.max(0, cards.length - visible);
      return steps * getCardWidth();
    }

    // ── Aplicar transform (con o sin animación) ──
    function applyTransform(animate) {
      if (!animate) {
        track.style.transition = 'none';
      }
      track.style.transform = `translateX(-${currentOffset}px)`;
      if (!animate) {
        // Forzar reflow para que la próxima asignación reactive la transición
        // eslint-disable-next-line no-unused-expressions
        track.offsetHeight;
        track.style.transition = '';
      }
    }

    // ── Mover ──
    function moveTo(newOffset, animate = true) {
      if (isInfinite) {
        currentOffset = newOffset;
      } else {
        const max = getMaxOffset();
        currentOffset = Math.max(0, Math.min(newOffset, max));
      }
      applyTransform(animate);
      updateDots();
      updateButtons();
    }

    // ── Normalizar offset cuando cruza un ciclo ──
    function normalize() {
      if (!isInfinite) return;
      const cycleW = getCycleWidth();
      if (cycleW <= 0) return;
      const normalized = ((currentOffset % cycleW) + cycleW) % cycleW;
      if (Math.abs(normalized - currentOffset) > 0.5) {
        currentOffset = normalized;
        applyTransform(false);
      }
    }

    function updateButtons() {
      if (isInfinite) {
        if (btnPrev) btnPrev.style.opacity = '1';
        if (btnNext) btnNext.style.opacity = '1';
        return;
      }
      if (btnPrev) btnPrev.style.opacity = currentOffset <= 0 ? '0.3' : '1';
      if (btnNext) btnNext.style.opacity = currentOffset >= getMaxOffset() ? '0.3' : '1';
    }

    // ── Dots ──
    function buildDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      const visible = getVisibleCount();
      const steps   = isInfinite
        ? cycleSize
        : Math.max(1, cards.length - visible + 1);
      for (let i = 0; i < steps; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', `Ir a posición ${i + 1}`);
        dot.addEventListener('click', () => moveTo(i * getCardWidth()));
        dotsContainer.appendChild(dot);
      }
    }

    function updateDots() {
      if (!dotsContainer) return;
      const dotEls = dotsContainer.querySelectorAll('.carousel-dot');
      const step   = getCardWidth();
      let idx = 0;
      if (step > 0) {
        if (isInfinite) {
          const cycleW    = getCycleWidth();
          const norm      = ((currentOffset % cycleW) + cycleW) % cycleW;
          idx             = Math.round(norm / step) % cycleSize;
        } else {
          idx = Math.round(currentOffset / step);
        }
      }
      dotEls.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    }

    // ── Al terminar la transición, re-normalizar offset al rango [0, cycleW) ──
    track.addEventListener('transitionend', e => {
      if (e.propertyName === 'transform') normalize();
    });

    // ── Clicks en flechas ──
    if (btnPrev) btnPrev.addEventListener('click', () => moveTo(currentOffset - getCardWidth()));
    if (btnNext) btnNext.addEventListener('click', () => moveTo(currentOffset + getCardWidth()));

    // ── Swipe táctil ──
    let touchStartX      = 0;
    let touchStartOffset = 0;
    let isDragging       = false;

    wrapper.addEventListener('touchstart', e => {
      touchStartX      = e.touches[0].clientX;
      touchStartOffset = currentOffset;
      isDragging       = true;
    }, { passive: true });

    wrapper.addEventListener('touchmove', e => {
      if (!isDragging) return;
      const delta = touchStartX - e.touches[0].clientX;
      if (isInfinite) {
        currentOffset = touchStartOffset + delta;
      } else {
        const max = getMaxOffset();
        currentOffset = Math.max(0, Math.min(touchStartOffset + delta, max));
      }
      // sin animación durante el drag
      track.style.transition = 'none';
      track.style.transform  = `translateX(-${currentOffset}px)`;
    }, { passive: true });

    wrapper.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      track.style.transition = '';
      const step    = getCardWidth();
      const snapped = Math.round(currentOffset / step) * step;
      moveTo(snapped);
    });

    // ── Init ──
    buildDots();
    updateButtons();
    updateDots();

    window.addEventListener('resize', () => {
      buildDots();
      // Reset suave al inicio de un ciclo
      moveTo(0, false);
    });
  });

});
