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

  /* ─────────────────────────────────────────
     ARCHIVE GALLERY (páginas de archivo-vivo por disciplina)
     - Click en thumb → marca activo + actualiza featured-img
     - Click en ‹/› → avanza/retrocede el activo (con wrap)
     - El thumb activo se centra automáticamente en el strip
  ───────────────────────────────────────── */

  document.querySelectorAll('.archive-gallery').forEach(gallery => {
    const track   = gallery.querySelector('.archive-gallery__track');
    const thumbs  = Array.from(gallery.querySelectorAll('.archive-gallery__thumb'));
    const btnPrev = gallery.querySelector('.archive-gallery__btn[data-dir="-1"]');
    const btnNext = gallery.querySelector('.archive-gallery__btn[data-dir="1"]');

    // El featured-img debería estar en la misma página
    const featuredImg = document.getElementById('featured-img');

    if (!thumbs.length) return;

    let activeIdx = thumbs.findIndex(t => t.classList.contains('is-active'));
    if (activeIdx < 0) activeIdx = 0;

    function centerActiveThumb() {
      if (!track) return;
      const thumb = thumbs[activeIdx];
      const target = thumb.offsetLeft - (track.clientWidth - thumb.clientWidth) / 2;
      track.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    }

    function setActive(idx, animate = true) {
      // wrap circular
      activeIdx = ((idx % thumbs.length) + thumbs.length) % thumbs.length;
      thumbs.forEach((t, i) => t.classList.toggle('is-active', i === activeIdx));

      // sincronizar featured-img
      if (featuredImg) {
        const img = thumbs[activeIdx].querySelector('img');
        const newSrc = img && img.getAttribute('src');
        if (newSrc && newSrc !== featuredImg.getAttribute('src')) {
          if (animate) {
            featuredImg.style.transition = 'opacity 0.3s ease';
            featuredImg.style.opacity = '0';
            setTimeout(() => {
              featuredImg.src = newSrc;
              featuredImg.style.opacity = '1';
            }, 200);
          } else {
            featuredImg.src = newSrc;
          }
        }
      }

      centerActiveThumb();
    }

    thumbs.forEach((thumb, idx) => {
      thumb.addEventListener('click', () => setActive(idx));
    });

    if (btnPrev) btnPrev.addEventListener('click', () => setActive(activeIdx - 1));
    if (btnNext) btnNext.addEventListener('click', () => setActive(activeIdx + 1));
  });

});
