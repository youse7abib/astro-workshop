/* ============================================================
   AstraVale — Main JavaScript
   GSAP Animations, Scroll Effects, Interactions
   ============================================================ */

/* --- Wait for DOM --- */
document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     LOADING SCREEN
     ============================================================ */
  const loadingScreen = document.getElementById('loading-screen');
  const loadingBar = document.querySelector('.loading-bar-fill');
  let loadProgress = 0;

  const loadInterval = setInterval(() => {
    loadProgress += Math.random() * 15 + 5;
    if (loadProgress >= 100) {
      loadProgress = 100;
      clearInterval(loadInterval);
      setTimeout(() => {
        loadingScreen.classList.add('hide');
        document.body.style.overflow = '';
        initGSAP();
      }, 400);
    }
    if (loadingBar) loadingBar.style.width = loadProgress + '%';
  }, 150);

  // Safety timeout
  setTimeout(() => {
    clearInterval(loadInterval);
    loadingScreen.classList.add('hide');
    document.body.style.overflow = '';
    initGSAP();
  }, 3000);

  document.body.style.overflow = 'hidden';

  /* ============================================================
     NAVBAR
     ============================================================ */
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
    });
  }

  // Close mobile menu on link click
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  /* ============================================================
     SMOOTH SCROLL
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href');
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        const offset = 80;
        const top = targetEl.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ============================================================
     FEATURE CARDS — Mouse glow effect
     ============================================================ */
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', x + '%');
      card.style.setProperty('--mouse-y', y + '%');
    });
  });

  /* ============================================================
     TESTIMONIALS — Parallax tilt on mouse
     ============================================================ */
  document.querySelectorAll('.testimonial-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-8px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
    });
  });

  /* ============================================================
     COUNTER ANIMATION
     ============================================================ */
  function animateCounter(el, target, suffix = '') {
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(target * ease);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  // Intersection Observer for counters
  const counterEls = document.querySelectorAll('[data-counter]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        const target = parseInt(entry.target.dataset.counter);
        const suffix = entry.target.dataset.suffix || '';
        animateCounter(entry.target, target, suffix);
      }
    });
  }, { threshold: 0.5 });

  counterEls.forEach(el => counterObserver.observe(el));

  /* ============================================================
     GSAP ANIMATIONS
     ============================================================ */
  function initGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      // Fallback: just reveal everything
      document.querySelectorAll('.timeline-item, .feature-card, .gallery-slot, .participant-stat-card, .community-card, .testimonial-card').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    /* --- Curriculum Timeline --- */
    const timelineItems = document.querySelectorAll('.timeline-item');
    const timelineProgress = document.querySelector('.timeline-progress');

    if (timelineProgress) {
      gsap.to(timelineProgress, {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: '.timeline-wrapper',
          start: 'top 60%',
          end: 'bottom 40%',
          scrub: 0.5,
        },
      });
    }

    timelineItems.forEach((item, i) => {
      const dot = item.querySelector('.timeline-dot');
      const isOdd = i % 2 === 0;

      gsap.fromTo(item, {
        opacity: 0,
        x: isOdd ? -60 : 60,
        y: 20,
      }, {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 78%',
          toggleActions: 'play none none none',
        },
      });

      // Activate dot when scrolled to
      if (dot) {
        ScrollTrigger.create({
          trigger: item,
          start: 'top 60%',
          onEnter: () => dot.classList.add('active'),
        });
      }
    });

    /* --- Feature Cards 3D Tilt & Glow --- */
    const featureCards = document.querySelectorAll('.feature-card');
    
    // Initial reveal animation
    gsap.fromTo(featureCards, {
      opacity: 0,
      y: 40,
      scale: 0.95,
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#features',
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    });

    // Premium 3D Tilt interaction
    featureCards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Update CSS variables for radial glow
        card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
        card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
        
        // Calculate tilt
        const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -12;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 12;
        
        gsap.to(card, {
          rotateX: rotateX,
          rotateY: rotateY,
          transformPerspective: 1000,
          y: -10,
          scale: 1.02,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });
      
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'elastic.out(1, 0.4)',
          overwrite: 'auto'
        });
      });
    });

    /* --- Gallery Slots — Scale in --- */
    const gallerySlots = document.querySelectorAll('.gallery-slot');
    gsap.fromTo(gallerySlots, {
      opacity: 0,
      scale: 0.9,
    }, {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#gallery .gallery-grid',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    /* --- Participant stat cards --- */
    const statCards = document.querySelectorAll('.participant-stat-card');
    gsap.fromTo(statCards, {
      opacity: 0,
      y: 40,
      scale: 0.95,
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.participants-hero',
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    });

    /* --- Best Members cards --- */
    const bestMemberCards = document.querySelectorAll('.best-member-card');
    gsap.fromTo(bestMemberCards, {
      opacity: 0,
      y: 40,
      scale: 0.95,
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.best-members-grid',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    /* --- Section headers --- */
    document.querySelectorAll('.section-header').forEach(header => {
      const tag = header.querySelector('.section-tag');
      const title = header.querySelector('.section-title');
      const subtitle = header.querySelector('.section-subtitle');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: header,
          start: 'top 82%',
          toggleActions: 'play none none none',
        },
      });

      if (tag) tl.fromTo(tag, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 });
      if (title) tl.fromTo(title, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');
      if (subtitle) tl.fromTo(subtitle, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');
    });

    /* --- Footer --- */
    gsap.fromTo('#footer .footer-grid', {
      opacity: 0,
      y: 30,
    }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#footer',
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    /* --- Floating elements --- */
    document.querySelectorAll('.hero-cosmic-orb').forEach((orb, i) => {
      gsap.to(orb, {
        y: `+=${30 + i * 10}`,
        x: `+=${15 + i * 5}`,
        duration: 6 + i * 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });

  } // end initGSAP

  /* ============================================================
     REGISTRATION FEED ANIMATION
     ============================================================ */
  const regItems = document.querySelectorAll('.registration-item');
  let currentReg = 0;

  function cycleRegistrations() {
    if (regItems.length === 0) return;

    regItems.forEach(item => {
      item.style.opacity = '0.5';
      item.style.transform = 'scale(0.98)';
    });

    regItems[currentReg].style.opacity = '1';
    regItems[currentReg].style.transform = 'scale(1)';
    regItems[currentReg].style.transition = 'all 0.5s ease';

    currentReg = (currentReg + 1) % regItems.length;
  }

  cycleRegistrations();
  setInterval(cycleRegistrations, 2500);

}); // end DOMContentLoaded
