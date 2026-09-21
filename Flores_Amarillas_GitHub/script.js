/* ==========================================================================
   FLORES AMARILLAS PARA GLORIA | LÓGICA INTERACTIVA Y EFECTOS
   De: Joel Gómez García  |  Para: Gloria Domínguez Muñoz
   ========================================================================== */

(function () {
  'use strict';

  // --- ELEMENTOS DEL DOM ---
  const envelope = document.getElementById('envelope');
  const waxSeal = document.getElementById('wax-seal');
  const openInstruction = document.getElementById('open-instruction');
  const sceneIntro = document.getElementById('scene-intro');
  const sceneCinema = document.getElementById('scene-cinema');
  const creditsTrack = document.getElementById('credits-track');
  const flowersClimax = document.getElementById('flowers-climax');

  // Audio y Widget
  const bgAudio = document.getElementById('bg-audio');
  const musicWidget = document.getElementById('music-widget');
  const musicToggleBtn = document.getElementById('music-toggle-btn');
  const vinylDisc = document.getElementById('vinyl-disc');

  // HUD & Botones
  const btnPauseScroll = document.getElementById('btn-pause-scroll');
  const pauseIcon = document.getElementById('pause-icon');
  const pauseText = document.getElementById('pause-text');
  const btnJumpFlowers = document.getElementById('btn-jump-flowers');
  const btnRestart = document.getElementById('btn-restart');
  const btnBurstPetals = document.getElementById('btn-burst-petals');

  // SVG Flores
  const petalsLayerBack = document.getElementById('petals-layer-back');
  const petalsLayerFront = document.getElementById('petals-layer-front');
  const petalsSubLeft = document.getElementById('petals-sub-left');
  const petalsSubRight = document.getElementById('petals-sub-right');
  const seedsPattern = document.getElementById('seeds-pattern');

  // Canvas
  const canvas = document.getElementById('petal-canvas');
  const ctx = canvas.getContext('2d');

  // --- ESTADO DE LA APLICACIÓN ---
  let isEnvelopeOpened = false;
  let isAudioPlaying = false;
  let isAutoScrollActive = false;
  let isUserInteractingWithScroll = false;
  let userInteractionTimeout = null;
  let scrollSpeed = 0.75; // Píxeles por cuadro (velocidad de lectura cinematográfica suave)
  let flowersBloomed = false;

  // ==========================================================================
  // 1. GENERACIÓN BOTÁNICA DE GIRASOLES (SVG)
  // ==========================================================================
  function createPetalPath(w, h) {
    // Silueta de pétalo de girasol elegante puntiagudo
    return `M 0 0 C -${w * 0.55} -${h * 0.35} -${w * 0.5} -${h * 0.8} 0 -${h} C ${w * 0.5} -${h * 0.8} ${w * 0.55} -${h * 0.35} 0 0 Z`;
  }

  function generateSunflowers() {
    if (!petalsLayerBack || !petalsLayerFront) return;

    // A. Pétalos traseros (capa exterior, 24 pétalos)
    const backCount = 24;
    for (let i = 0; i < backCount; i++) {
      const angle = (360 / backCount) * i;
      const petal = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      petal.setAttribute('d', createPetalPath(26, 120));
      petal.setAttribute('fill', 'url(#petal-gold-grad)');
      petal.setAttribute('transform', `rotate(${angle}) translate(0, -35)`);
      petal.style.setProperty('--rotation', `${angle}deg`);
      petal.classList.add('petal-stem');
      petal.style.filter = 'brightness(0.92)';
      petalsLayerBack.appendChild(petal);
    }

    // B. Pétalos frontales (capa interior, desfasada, 24 pétalos más vivos)
    const frontCount = 24;
    const offset = 360 / (frontCount * 2);
    for (let i = 0; i < frontCount; i++) {
      const angle = (360 / frontCount) * i + offset;
      const petal = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      petal.setAttribute('d', createPetalPath(22, 105));
      petal.setAttribute('fill', 'url(#petal-gold-grad)');
      petal.setAttribute('transform', `rotate(${angle}) translate(0, -32)`);
      petal.style.setProperty('--rotation', `${angle}deg`);
      petal.classList.add('petal-stem');
      petalsLayerFront.appendChild(petal);
    }

    // C. Flores secundarias izquierda y derecha
    function populateSubFlower(container, count, len, width) {
      if (!container) return;
      for (let i = 0; i < count; i++) {
        const angle = (360 / count) * i;
        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        petal.setAttribute('d', createPetalPath(width, len));
        petal.setAttribute('fill', 'url(#petal-gold-grad)');
        petal.setAttribute('transform', `rotate(${angle}) translate(0, -20)`);
        container.appendChild(petal);
      }
    }
    populateSubFlower(petalsSubLeft, 18, 75, 18);
    populateSubFlower(petalsSubRight, 18, 75, 18);

    // D. Espiral de semillas con proporción áurea (Fibonacci)
    if (seedsPattern) {
      const seedCount = 140;
      const goldenAngle = 137.5077 * (Math.PI / 180);
      const c = 3.6;
      for (let n = 1; n <= seedCount; n++) {
        const r = c * Math.sqrt(n);
        const theta = n * goldenAngle;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x.toFixed(2));
        circle.setAttribute('cy', y.toFixed(2));
        circle.setAttribute('r', (1.2 + (n / seedCount) * 0.8).toFixed(2));
        circle.setAttribute('fill', n % 2 === 0 ? '#4a2c11' : '#b27b00');
        circle.setAttribute('opacity', '0.75');
        seedsPattern.appendChild(circle);
      }
    }
  }

  function triggerFlowerBloom() {
    if (flowersBloomed) return;
    flowersBloomed = true;

    // Disparar animación en pétalos
    const allPetals = document.querySelectorAll('.petal-stem');
    allPetals.forEach((p, idx) => {
      p.style.animationDelay = `${(idx % 12) * 0.04}s`;
      p.classList.add('petal-bloom');
    });

    // Lluvia masiva de celebración
    createCelebrationBurst();
  }

  // ==========================================================================
  // 2. CANVAS DE PÉTALOS FLOTANTES Y LUCIÉRNAGAS
  // ==========================================================================
  let width, height;
  let particles = [];
  const maxParticles = 65;

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class PetalParticle {
    constructor(isBurst = false, originX = null, originY = null) {
      this.reset(isBurst, originX, originY);
    }

    reset(isBurst = false, originX = null, originY = null) {
      this.isBurst = isBurst;
      if (isBurst && originX !== null && originY !== null) {
        this.x = originX + (Math.random() - 0.5) * 40;
        this.y = originY + (Math.random() - 0.5) * 40;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        this.speedX = Math.cos(angle) * speed;
        this.speedY = Math.sin(angle) * speed - 1.5;
      } else {
        this.x = Math.random() * width;
        this.y = Math.random() * -height * 0.5; // Comienzan arriba de la pantalla
        this.speedX = -1 + Math.random() * 2;
        this.speedY = 1.2 + Math.random() * 2.2;
      }

      this.size = 8 + Math.random() * 16;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 2.5;
      this.swayAngle = Math.random() * Math.PI * 2;
      this.swaySpeed = 0.02 + Math.random() * 0.03;
      this.opacity = 0.4 + Math.random() * 0.55;
      this.type = Math.random() > 0.3 ? 'petal' : 'sparkle'; // pétalo o mota dorada

      // Tonos amarillos y dorados variados
      const yellowHues = [
        { r: 255, g: 215, b: 64 },   // Dorado brillante
        { r: 255, g: 193, b: 7 },    // Ámbar sol
        { r: 255, g: 238, b: 88 },   // Amarillo claro
        { r: 255, g: 179, b: 0 }     // Girasol intenso
      ];
      this.color = yellowHues[Math.floor(Math.random() * yellowHues.length)];
    }

    update() {
      this.swayAngle += this.swaySpeed;
      this.rotation += this.rotSpeed;

      if (this.isBurst) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedX *= 0.96;
        this.speedY += 0.08; // Gravedad suave
        this.opacity -= 0.008;

        if (this.opacity <= 0 || this.y > height + 20) {
          this.reset(false);
        }
      } else {
        this.x += this.speedX + Math.sin(this.swayAngle) * 0.8;
        this.y += this.speedY;

        if (this.y > height + 30 || this.x < -30 || this.x > width + 30) {
          this.reset(false);
        }
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, this.opacity);

      if (this.type === 'sparkle') {
        // Mota de luz / estrella dorada
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.9)`;
        ctx.shadowColor = 'rgba(255, 215, 64, 0.8)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.22, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Pétalo curvado de flor amarilla
        ctx.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
        ctx.shadowColor = 'rgba(255, 193, 7, 0.3)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 0.5);
        ctx.quadraticCurveTo(this.size * 0.4, -this.size * 0.2, this.size * 0.25, this.size * 0.5);
        ctx.quadraticCurveTo(0, this.size * 0.65, -this.size * 0.25, this.size * 0.5);
        ctx.quadraticCurveTo(-this.size * 0.4, -this.size * 0.2, 0, -this.size * 0.5);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // Inicializar partículas básicas
  for (let i = 0; i < maxParticles; i++) {
    const p = new PetalParticle();
    p.y = Math.random() * height; // Distribución inicial en pantalla
    particles.push(p);
  }

  function renderParticles() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    requestAnimationFrame(renderParticles);
  }
  requestAnimationFrame(renderParticles);

  // Ráfaga de pétalos al llegar al ramo o al pulsar botón
  function createCelebrationBurst(count = 70, x = width / 2, y = height / 2) {
    for (let i = 0; i < count; i++) {
      const p = new PetalParticle(true, x, y);
      particles.push(p);
    }
    // Limitar cantidad máxima de partículas en memoria
    if (particles.length > 200) {
      particles.splice(0, particles.length - 200);
    }
  }

  // Interacción táctil / cursor: crear pequeñas flores al mover o tocar
  let lastSpawn = 0;
  function handlePointerMove(e) {
    const now = performance.now();
    if (now - lastSpawn < 80) return;
    lastSpawn = now;

    const posX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : width / 2);
    const posY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : height / 2);

    const p = new PetalParticle(true, posX, posY);
    p.size = 7 + Math.random() * 10;
    particles.push(p);
  }
  window.addEventListener('mousemove', handlePointerMove, { passive: true });
  window.addEventListener('touchmove', handlePointerMove, { passive: true });

  // ==========================================================================
  // 3. APERTURA DEL SOBRE Y TRANSICIÓN CINEMATOGRÁFICA
  // ==========================================================================
  function openEnvelope() {
    if (isEnvelopeOpened) return;
    isEnvelopeOpened = true;

    // 1. Efecto visual en el sobre
    envelope.classList.add('open');
    openInstruction.style.opacity = '0';

    // 2. Reproducir música (arranca directo en el estribillo de Floricienta)
    playMusic();

    // 3. Lluvia dorada de bienvenida
    const rect = envelope.getBoundingClientRect();
    createCelebrationBurst(40, rect.left + rect.width / 2, rect.top + rect.height / 2);

    // 4. Transición a Escena Cinematográfica tras animarse la carta
    setTimeout(() => {
      sceneIntro.classList.add('fade-out');

      setTimeout(() => {
        sceneIntro.style.display = 'none';
        sceneCinema.classList.remove('hidden');
        musicWidget.classList.remove('hidden');

        // Empezar a rodar los créditos estilo cine
        startAutoScroll();
      }, 700);
    }, 1300);
  }

  envelope.addEventListener('click', openEnvelope);
  envelope.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEnvelope();
    }
  });

  // ==========================================================================
  // 4. CONTROL DE MÚSICA
  // ==========================================================================
  function playMusic() {
    bgAudio.play().then(() => {
      isAudioPlaying = true;
      vinylDisc.classList.add('spinning');
    }).catch((err) => {
      console.warn('Autoplay bloqueado por el navegador o interacción pendiente:', err);
      // El usuario puede presionar el botón de música directamente
      isAudioPlaying = false;
      vinylDisc.classList.remove('spinning');
    });
  }

  function pauseMusic() {
    bgAudio.pause();
    isAudioPlaying = false;
    vinylDisc.classList.remove('spinning');
  }

  function toggleMusic() {
    if (isAudioPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  }

  musicToggleBtn.addEventListener('click', toggleMusic);

  // ==========================================================================
  // 5. RODILLO CINEMATOGRÁFICO DE CRÉDITOS (AUTO-SCROLL)
  // ==========================================================================
  function scrollStep() {
    if (!isAutoScrollActive) return;

    if (!isUserInteractingWithScroll) {
      creditsTrack.scrollTop += scrollSpeed;

      // Comprobar si el bloque del clímax ya está visible
      checkFlowerVisibility();

      // Si llegó al final total, detener el auto-scroll
      if (creditsTrack.scrollTop + creditsTrack.clientHeight >= creditsTrack.scrollHeight - 5) {
        stopAutoScroll();
        triggerFlowerBloom();
      }
    }

    requestAnimationFrame(scrollStep);
  }

  function startAutoScroll() {
    isAutoScrollActive = true;
    pauseIcon.textContent = '⏸️';
    pauseText.textContent = 'Pausar lectura';
    requestAnimationFrame(scrollStep);
  }

  function stopAutoScroll() {
    isAutoScrollActive = false;
    pauseIcon.textContent = '▶️';
    pauseText.textContent = 'Reanudar lectura';
  }

  function toggleAutoScroll() {
    if (isAutoScrollActive) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  }

  btnPauseScroll.addEventListener('click', toggleAutoScroll);

  // Detección de interacción manual del usuario (para pausar temporalmente y permitir leer con calma)
  function handleManualScrollInteraction() {
    isUserInteractingWithScroll = true;
    clearTimeout(userInteractionTimeout);
    // Si el usuario deja de scrollear o tocar por 3.5 segundos, reanudar suavemente
    userInteractionTimeout = setTimeout(() => {
      isUserInteractingWithScroll = false;
    }, 3500);
  }

  creditsTrack.addEventListener('wheel', handleManualScrollInteraction, { passive: true });
  creditsTrack.addEventListener('touchmove', handleManualScrollInteraction, { passive: true });
  creditsTrack.addEventListener('scroll', checkFlowerVisibility, { passive: true });

  // Comprobar si las flores llegaron a la vista
  function checkFlowerVisibility() {
    if (flowersBloomed || !flowersClimax) return;
    const rect = flowersClimax.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.75) {
      triggerFlowerBloom();
    }
  }

  // Saltar directo al clímax de las flores
  btnJumpFlowers.addEventListener('click', () => {
    flowersClimax.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(triggerFlowerBloom, 400);
  });

  // Volver a leer la dedicatoria desde el principio
  btnRestart.addEventListener('click', () => {
    creditsTrack.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      startAutoScroll();
    }, 700);
  });

  // Botón de más flores amarillas (lluvia festiva)
  btnBurstPetals.addEventListener('click', (e) => {
    const rect = btnBurstPetals.getBoundingClientRect();
    createCelebrationBurst(60, rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  // ==========================================================================
  // 6. INICIALIZACIÓN
  // ==========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    generateSunflowers();
  });

})();
