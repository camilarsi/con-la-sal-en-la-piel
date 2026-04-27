/* ============================================
   CON LA SAL EN LA PIEL — main.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────
     CARRUSEL
     - CARD_WIDTH dinámico (lee el DOM)
     - Flechas absolutas laterales
     - Dots de posición
     - Swipe táctil
  ───────────────────────────────────────── */

  document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
    const trackId = wrapper.querySelector('.carousel-track')?.id;
    if (!trackId) return;

    const track     = document.getElementById(trackId);
    const cards     = Array.from(track.querySelectorAll('.carousel-card'));
    const btnPrev   = wrapper.querySelector('.carousel-btn[data-dir="-1"]');
    const btnNext   = wrapper.querySelector('.carousel-btn[data-dir="1"]');
    const dotsContainer = wrapper.parentElement.querySelector('.carousel-dots');

    let currentOffset = 0;
    let activeDotIndex = 0;

    // ── Ancho de card + gap ──
    function getCardWidth() {
      const card = cards[0];
      if (!card) return 200;
      const gap = parseFloat(getComputedStyle(track).gap) || 14;
      return card.offsetWidth + gap;
    }

    function getVisibleCount() {
      const wrapperInner = wrapper.offsetWidth - 104; // 52px × 2
      return Math.max(1, Math.floor(wrapperInner / getCardWidth()));
    }

    function getMaxOffset() {
      const visible = getVisibleCount();
      const steps   = Math.max(0, cards.length - visible);
      return steps * getCardWidth();
    }

    // ── Mover el track ──
    function moveTo(newOffset) {
      const max = getMaxOffset();
      currentOffset = Math.max(0, Math.min(newOffset, max));
      track.style.transform = `translateX(-${currentOffset}px)`;
      updateDots();
      updateButtons();
    }

    function updateButtons() {
      if (btnPrev) btnPrev.style.opacity = currentOffset <= 0 ? '0.3' : '1';
      if (btnNext) btnNext.style.opacity = currentOffset >= getMaxOffset() ? '0.3' : '1';
    }

    // ── Dots ──
    function buildDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      const visible = getVisibleCount();
      const steps   = Math.max(1, cards.length - visible + 1);
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
      activeDotIndex = step > 0 ? Math.round(currentOffset / step) : 0;
      dotEls.forEach((d, i) => d.classList.toggle('is-active', i === activeDotIndex));
    }

    // ── Clicks en flechas ──
    if (btnPrev) btnPrev.addEventListener('click', () => moveTo(currentOffset - getCardWidth()));
    if (btnNext) btnNext.addEventListener('click', () => moveTo(currentOffset + getCardWidth()));

    // ── Swipe táctil ──
    let touchStartX = 0;
    let touchStartOffset = 0;
    let isDragging = false;

    wrapper.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchStartOffset = currentOffset;
      isDragging = true;
    }, { passive: true });

    wrapper.addEventListener('touchmove', e => {
      if (!isDragging) return;
      const delta = touchStartX - e.touches[0].clientX;
      const max   = getMaxOffset();
      currentOffset = Math.max(0, Math.min(touchStartOffset + delta, max));
      track.style.transform = `translateX(-${currentOffset}px)`;
    }, { passive: true });

    wrapper.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      const step    = getCardWidth();
      const snapped = Math.round(currentOffset / step) * step;
      moveTo(snapped);
    });

    // ── Init ──
    buildDots();
    updateButtons();

    window.addEventListener('resize', () => {
      buildDots();
      moveTo(0);
    });
  });

});
