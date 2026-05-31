/* ==========================================================
   PORTFOLIO — SCRIPT
   Duck‑vs‑Viruses intro  ·  Page navigation  ·  Content
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     SAFETY: no matter what, show content after 12 s
  ---------------------------------------------------------- */
  const safetyTimer = setTimeout(() => {
    const intro = document.getElementById('intro-overlay');
    if (intro) intro.remove();
    document.body.classList.add('js-ready');
    activateHero();
  }, 12000);

  /* ----------------------------------------------------------
     MAIN BOOT
  ---------------------------------------------------------- */
  boot().catch(err => {
    console.error('Boot error:', err);
    const intro = document.getElementById('intro-overlay');
    if (intro) intro.remove();
    document.body.classList.add('js-ready');
    activateHero();
  });

  async function boot() {
    // Start fetching content in parallel with intro anim
    const contentPromise = fetchContent();

    // Run duck intro (or skip immediately on click)
    await runDuckIntro();

    // Fade out intro overlay
    const overlay = document.getElementById('intro-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      await sleep(650);
      overlay.remove();
    }

    clearTimeout(safetyTimer);

    // Populate site
    const data = await contentPromise;
    initSite(data);

    // Enable page system
    document.body.classList.add('js-ready');
    initPageNavigation();
    initMobileNav();
    initHeroCanvas();

    // Show starting page
    showPage(window.location.hash || '#hero');
  }

  /* ==========================================================
     DUCK INTRO ANIMATION
  ========================================================== */
  function runDuckIntro() {
    return new Promise(resolve => {
      const canvas = document.getElementById('duck-canvas');
      if (!canvas) { resolve(); return; }
      const ctx = canvas.getContext('2d');
      // Internal coord space
      const W = 800, H = 280;
      canvas.width = W; canvas.height = H;

      let skip = false;
      document.getElementById('intro-overlay').addEventListener('click', () => { skip = true; });

      const groundY = H * 0.68;
      const duckScale = 0.9;

      const duck = { x: 30, y: groundY, frame: 0, speed: 3.2, eating: false, eatTimer: 0 };

      const virusData = [
        { name: 'TROJAN',     color: '#c75c3a' },
        { name: 'WORM',       color: '#5b8a72' },
        { name: 'RANSOMWARE', color: '#8b6cc7' },
        { name: 'SPYWARE',    color: '#5a8fc2' },
        { name: 'ROOTKIT',    color: '#c74a4a' },
      ];
      const spacing = (W - 180) / virusData.length;
      const viruses = virusData.map((v, i) => ({
        ...v,
        x: 170 + spacing * i,
        y: groundY,
        radius: 16,
        alive: true,
        bob: Math.random() * Math.PI * 2,
        particles: []
      }));

      const statusEl = document.getElementById('intro-status');
      let allDone = false, doneFrames = 0, finished = false;

      function frame() {
        if (finished) return;
        if (skip) { finished = true; resolve(); return; }

        ctx.clearRect(0, 0, W, H);
        drawGrid(ctx, W, H);

        // Ground line
        ctx.strokeStyle = 'rgba(212,168,67,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, groundY + 22); ctx.lineTo(W, groundY + 22); ctx.stroke();

        // Move duck
        if (!duck.eating) {
          duck.x += duck.speed;
          duck.frame++;
        } else {
          duck.eatTimer--;
          if (duck.eatTimer <= 0) duck.eating = false;
        }

        // Collision check
        for (const v of viruses) {
          if (v.alive && duck.x + 30 > v.x - v.radius) {
            v.alive = false;
            duck.eating = true;
            duck.eatTimer = 18;
            // Poof particles
            for (let p = 0; p < 10; p++) {
              v.particles.push({
                x: v.x, y: v.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 25 + Math.random() * 10,
                color: v.color
              });
            }
            // Update status log
            if (statusEl) {
              const eaten = viruses.filter(vr => !vr.alive);
              statusEl.innerHTML = eaten.map(vr =>
                `<span class="status-line">✓ ${vr.name} <span class="dim">neutralized</span></span>`
              ).join('');
            }
          }
        }

        // Draw viruses
        for (const v of viruses) {
          // Particles
          v.particles = v.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.life--;
            ctx.globalAlpha = p.life / 35;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            return p.life > 0;
          });
          if (v.alive) {
            v.bob += 0.06;
            drawVirus(ctx, v.x, v.y + Math.sin(v.bob) * 4, v.radius, v.color, v.name);
          }
        }

        // Draw duck
        drawDuck(ctx, duck.x, duck.y, duck.frame, duckScale, duck.eating);

        // All eaten?
        if (!allDone && viruses.every(v => !v.alive)) {
          allDone = true; doneFrames = 0;
          if (statusEl) {
            statusEl.innerHTML += `<span class="status-final">KERNEL SECURE — 0 threats detected</span>`;
          }
        }
        if (allDone) {
          doneFrames++;
          if (doneFrames > 100) { finished = true; resolve(); return; }
        }
        // Safety: if duck off‑screen
        if (duck.x > W + 80) { finished = true; resolve(); return; }

        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  /* -- Draw helpers ---------------------------------------- */

  function drawGrid(ctx, w, h) {
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }

  function drawDuck(ctx, x, y, frame, scale, eating) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Tail
    ctx.fillStyle = '#e0c630';
    ctx.beginPath();
    ctx.moveTo(-22, -2); ctx.lineTo(-30, -8); ctx.lineTo(-26, 0); ctx.lineTo(-30, 5); ctx.lineTo(-22, 2);
    ctx.closePath(); ctx.fill();

    // Body
    ctx.fillStyle = '#f5d442';
    ctx.beginPath(); ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2); ctx.fill();

    // Wing
    ctx.fillStyle = '#e0c630';
    ctx.beginPath(); ctx.ellipse(-2, 1, 9, 6, -0.2, 0, Math.PI * 2); ctx.fill();

    // Head
    ctx.fillStyle = '#f5d442';
    ctx.beginPath(); ctx.arc(15, -11, 10, 0, Math.PI * 2); ctx.fill();

    // Eye
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(19, -13, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(20, -14, 0.8, 0, Math.PI * 2); ctx.fill();

    // Beak
    ctx.fillStyle = '#e8923a';
    if (eating) {
      ctx.beginPath(); ctx.moveTo(24, -13); ctx.lineTo(34, -15); ctx.lineTo(24, -11); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(24, -9); ctx.lineTo(34, -5); ctx.lineTo(24, -7); ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(24, -13); ctx.lineTo(34, -10); ctx.lineTo(24, -7); ctx.closePath(); ctx.fill();
    }

    // Feet waddle
    ctx.fillStyle = '#e8923a';
    const fw = Math.sin(frame * 0.45) * 4;
    ctx.beginPath(); ctx.moveTo(-6 - fw, 14); ctx.lineTo(-12 - fw, 18); ctx.lineTo(-2 - fw, 18); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6 + fw, 14); ctx.lineTo(0 + fw, 18); ctx.lineTo(12 + fw, 18); ctx.closePath(); ctx.fill();

    ctx.restore();
  }

  function drawVirus(ctx, x, y, r, color, name) {
    // Spikes
    ctx.fillStyle = color;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 / 8) * i + Date.now() * 0.0008;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * (r + 5), y + Math.sin(a) * (r + 5), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Body
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - 4, y - 3, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 4, y - 3, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(x - 3.5, y - 3, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 3.5, y - 3, 1.8, 0, Math.PI * 2); ctx.fill();
    // Angry brows
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(x - 7, y - 8); ctx.lineTo(x - 1.5, y - 6.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 7, y - 8); ctx.lineTo(x + 1.5, y - 6.5); ctx.stroke();
    // Label
    ctx.fillStyle = '#666';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y + r + 16);
  }

  /* ==========================================================
     CONTENT FETCHING
  ========================================================== */
  async function fetchContent() {
    const fallback = {
      identity: { name: 'Ishaan Sahu', tagline: 'Software Engineer & Developer', bio: 'Welcome to my portfolio.', roles: ['Developer', 'Engineer'], github: 'https://github.com/ishaansahu22', linkedin: '', email: '' },
      skills: { 'Languages': ['JavaScript', 'Python'] },
      pinnedProjects: [], hiddenRepos: [],
      experience: [],
      siteSettings: { footerText: '© 2024 Ishaan Sahu' }
    };
    try {
      const res = await fetch('content.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('content.json fetch failed, using fallback:', e);
      return fallback;
    }
  }

  /* ==========================================================
     SITE INIT
  ========================================================== */
  function initSite(data) {
    try { populateHero(data.identity); } catch(e){ console.warn(e); }
    try { populateAbout(data.identity); } catch(e){ console.warn(e); }
    try { populateSkills(data.skills); } catch(e){ console.warn(e); }
    try { populateProjects(data.pinnedProjects, data.hiddenRepos); } catch(e){ console.warn(e); }
    try { populateExperience(data.experience); } catch(e){ console.warn(e); }
    try { populateContact(data.identity, data.siteSettings); } catch(e){ console.warn(e); }
    try { initTypewriter(data.identity.roles); } catch(e){ console.warn(e); }
  }

  /* ===== SVG ICONS ===== */
  const ICONS = {
    github: '<svg viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    leetcode: '<svg viewBox="0 0 24 24"><path d="M13.483 0a1.374 1.374 0 00-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 00-1.209 2.104 5.35 5.35 0 00-.125.513 5.527 5.527 0 00.062 2.362 5.83 5.83 0 00.349 1.017 5.938 5.938 0 001.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 00-1.951-.003l-2.396 2.392a3.021 3.021 0 01-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 01.066-.523 2.545 2.545 0 01.619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 00-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0013.483 0zm-2.866 12.815a1.38 1.38 0 00-1.38 1.382 1.38 1.38 0 001.38 1.382H20.79a1.38 1.38 0 001.38-1.382 1.38 1.38 0 00-1.38-1.382z"/></svg>',
    email: '<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>'
  };

  /* ===== POPULATE ===== */
  function getSocialHTML(id) {
    let h = '';
    if (id.github) h += `<a href="${id.github}" target="_blank" class="social-icon" title="GitHub">GH</a>`;
    if (id.linkedin) h += `<a href="${id.linkedin}" target="_blank" class="social-icon" title="LinkedIn">IN</a>`;
    if (id.leetcode) h += `<a href="${id.leetcode}" target="_blank" class="social-icon" title="LeetCode">LC</a>`;
    if (id.email) h += `<a href="mailto:${id.email}" class="social-icon" title="Email">@</a>`;
    return h;
  }

  function populateHero(id) {
    const badge = document.getElementById('hero-status');
    const badgeText = document.getElementById('hero-status-text');
    if (id.status && id.status.active) { badgeText.textContent = id.status.label; }
    else { badge.style.display = 'none'; }
    document.getElementById('hero-subtext').textContent = id.tagline;
    document.getElementById('hero-socials').innerHTML = getSocialHTML(id);
  }

  function populateAbout(id) {
    document.getElementById('about-bio').innerHTML = id.bio;
  }

  function populateSkills(skills) {
    const c = document.getElementById('skills-container');
    c.innerHTML = '';
    for (const [cat, items] of Object.entries(skills)) {
      const div = document.createElement('div');
      div.className = 'skill-category reveal';
      div.dataset.cat = cat;
      div.innerHTML = `<h3>${cat}</h3><div class="chips-container">${items.map(i => `<div class="skill-chip">${i}</div>`).join('')}</div>`;
      c.appendChild(div);
    }
  }

  async function populateProjects(pinned, hidden) {
    const fc = document.getElementById('featured-projects');
    fc.innerHTML = '';
    [...pinned].sort((a, b) => a.rank - b.rank).forEach(p => {
      fc.insertAdjacentHTML('beforeend', `
        <div class="project-card reveal" data-repo="${p.repo}">
          <div class="rank-badge">#${p.rank}</div>
          <div class="project-header">
            <h3 class="project-title">${p.repo}</h3>
            <span class="language-badge" id="lang-${p.repo}">—</span>
          </div>
          <p class="project-desc">${p.overrideDescription}</p>
          <ul class="project-highlights">${p.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
          <a href="https://github.com/ishaansahu22/${p.repo}" target="_blank" class="btn btn-outline">View on GitHub</a>
        </div>`);
    });

    const ac = document.getElementById('all-projects');
    try {
      const res = await fetch('https://api.github.com/users/ishaansahu22/repos?sort=updated&per_page=20');
      if (!res.ok) return;
      const repos = await res.json();
      const pinnedNames = pinned.map(p => p.repo);
      repos.forEach(repo => {
        if (pinnedNames.includes(repo.name)) {
          const el = document.getElementById(`lang-${repo.name}`);
          if (el) el.textContent = repo.language || 'Code';
          return;
        }
        if (hidden.includes(repo.name)) return;
        ac.insertAdjacentHTML('beforeend', `
          <a href="${repo.html_url}" target="_blank" class="small-card">
            <div class="small-card-title">${repo.name}<span>↗</span></div>
            <p class="small-card-desc">${repo.description || 'No description.'}</p>
            <div class="small-card-meta"><span>${repo.language || '—'}</span><span>⭐ ${repo.stargazers_count}</span></div>
          </a>`);
      });
    } catch (e) { console.warn('GH API error', e); }
  }

  function populateExperience(exp) {
    const c = document.getElementById('timeline-container');
    c.innerHTML = '<div class="timeline-line"><div class="timeline-line-fill" id="timeline-fill"></div></div>';
    exp.forEach(e => {
      c.insertAdjacentHTML('beforeend', `
        <div class="timeline-item">
          <div class="timeline-node"></div>
          <div class="timeline-content">
            <h3 class="exp-role">${e.role}</h3>
            <div class="exp-meta"><span class="exp-company">${e.company}</span><span>${e.period}</span><span>${e.type}</span></div>
            <ul class="project-highlights">${e.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
          </div>
        </div>`);
    });
  }

  function populateContact(id, settings) {
    const grid = document.getElementById('contact-links-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const links = [];
    if (id.linkedin) links.push({ href: id.linkedin, icon: ICONS.linkedin, name: 'LinkedIn', handle: 'Connect', t: '_blank' });
    if (id.github) links.push({ href: id.github, icon: ICONS.github, name: 'GitHub', handle: 'ishaansahu22', t: '_blank' });
    if (id.leetcode) links.push({ href: id.leetcode, icon: ICONS.leetcode, name: 'LeetCode', handle: 'Profile', t: '_blank' });
    if (id.email) links.push({ href: `mailto:${id.email}`, icon: ICONS.email, name: 'Email', handle: id.email, t: '' });
    links.forEach(l => {
      grid.insertAdjacentHTML('beforeend', `
        <a href="${l.href}" ${l.t ? `target="${l.t}"` : ''} class="contact-link-card">
          <div class="cl-icon">${l.icon}</div>
          <div class="cl-info"><span class="cl-name">${l.name}</span><span class="cl-handle">${l.handle}</span></div>
        </a>`);
    });

    const ft = document.getElementById('footer-text');
    if (ft) ft.textContent = settings.footerText || '';
    const fs = document.getElementById('footer-socials-row');
    if (fs) fs.innerHTML = getSocialHTML(id);
  }

  /* ==========================================================
     TYPEWRITER
  ========================================================== */
  function initTypewriter(roles) {
    const el = document.getElementById('typewriter');
    if (!el || !roles || !roles.length) return;
    let ri = 0, ci = 0, del = false;
    function tick() {
      const role = roles[ri];
      if (del) { ci--; } else { ci++; }
      el.textContent = role.substring(0, ci);
      let speed = del ? 40 : 90;
      if (!del && ci === role.length) { speed = 2200; del = true; }
      else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; speed = 400; }
      setTimeout(tick, speed);
    }
    tick();
  }

  /* ==========================================================
     PAGE NAVIGATION
  ========================================================== */
  function initPageNavigation() {
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        showPage(link.getAttribute('href'));
        document.querySelector('.nav-links').classList.remove('active');
      });
    });
    document.querySelector('.logo').addEventListener('click', e => { e.preventDefault(); showPage('#hero'); });
    document.querySelectorAll('.hero-ctas a').forEach(b => {
      b.addEventListener('click', e => { e.preventDefault(); showPage(b.getAttribute('href')); });
    });
    window.addEventListener('popstate', () => showPage(window.location.hash || '#hero'));
  }

  function showPage(hash) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('page-active'));
    const target = document.querySelector(hash);
    if (target) {
      target.classList.add('page-active');
      // Stagger reveals
      target.querySelectorAll('.reveal:not(.active)').forEach((el, i) => {
        setTimeout(() => el.classList.add('active'), i * 100);
      });
      if (hash === '#experience') {
        target.querySelectorAll('.timeline-item:not(.visible)').forEach((it, i) => {
          setTimeout(() => { it.classList.add('visible'); updateFill(); }, i * 180);
        });
      }
      if (hash === '#about') triggerStats();
    }
    document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
    const al = document.querySelector(`.nav-links a[href="${hash}"]`);
    if (al) al.classList.add('active');
    window.scrollTo(0, 0);
    if (window.location.hash !== hash) history.pushState(null, '', hash);
  }

  function activateHero() {
    const hero = document.getElementById('hero');
    if (hero) hero.classList.add('page-active');
    document.querySelectorAll('#hero .reveal').forEach(el => el.classList.add('active'));
  }

  function triggerStats() {
    document.querySelectorAll('.stat-number').forEach(s => {
      if (s.dataset.counted) return;
      s.dataset.counted = '1';
      const t = +s.dataset.target; let c = 0;
      const iv = setInterval(() => { c++; s.textContent = c; if (c >= t) clearInterval(iv); }, 180);
    });
  }

  function updateFill() {
    const fill = document.getElementById('timeline-fill');
    const items = document.querySelectorAll('.timeline-item.visible');
    if (!fill || !items.length) return;
    const last = items[items.length - 1].querySelector('.timeline-node');
    if (last) fill.style.height = (last.offsetTop + 8) + 'px';
  }

  function initMobileNav() {
    document.getElementById('hamburger').addEventListener('click', () => {
      document.querySelector('.nav-links').classList.toggle('active');
    });
  }

  /* ==========================================================
     HERO CANVAS — subtle particle mesh
  ========================================================== */
  function initHeroCanvas() {
    const canvas = document.getElementById('neural-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const nodes = [];
    const count = window.innerWidth > 768 ? 45 : 20;
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.5 + 0.5
      });
    }
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212,168,67,0.18)'; ctx.fill();
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n.x - n2.x, dy = n.y - n2.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(212,168,67,${0.06 * (1 - d / 140)})`;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
  }

  /* ===== Utility ===== */
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

});
