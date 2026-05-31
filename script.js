document.addEventListener('DOMContentLoaded', async () => {

  // =============================================
  //  HELPER
  // =============================================
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // =============================================
  //  INTRO ANIMATION — Cyber Particle Network
  // =============================================
  const introOverlay = document.getElementById('intro-overlay');
  const introCanvas = document.getElementById('binary-rain');
  const introCtx = introCanvas.getContext('2d');
  const terminalBody = document.getElementById('terminal-body');

  introCanvas.width = window.innerWidth;
  introCanvas.height = window.innerHeight;

  // Particle Network instead of binary rain
  const particles = [];
  const particleCount = window.innerWidth > 768 ? 80 : 40;
  const connectionDist = 140;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * introCanvas.width,
      y: Math.random() * introCanvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 0.5,
      brightness: Math.random()
    });
  }

  // Scanning pulse line
  let scanX = -200;
  const scanSpeed = 3;

  function drawIntro() {
    introCtx.fillStyle = 'rgba(5, 3, 16, 0.12)';
    introCtx.fillRect(0, 0, introCanvas.width, introCanvas.height);

    // Move scan line
    scanX += scanSpeed;
    if (scanX > introCanvas.width + 200) scanX = -200;

    // Draw scan line glow
    const scanGrad = introCtx.createLinearGradient(scanX - 100, 0, scanX + 100, 0);
    scanGrad.addColorStop(0, 'rgba(247, 37, 133, 0)');
    scanGrad.addColorStop(0.5, 'rgba(247, 37, 133, 0.08)');
    scanGrad.addColorStop(1, 'rgba(247, 37, 133, 0)');
    introCtx.fillStyle = scanGrad;
    introCtx.fillRect(scanX - 100, 0, 200, introCanvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > introCanvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > introCanvas.height) p.vy *= -1;

      // Glow brighter near scan line
      const distToScan = Math.abs(p.x - scanX);
      const scanBoost = distToScan < 100 ? (1 - distToScan / 100) * 0.7 : 0;

      // Draw connections
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDist) {
          const alpha = (1 - dist / connectionDist) * 0.15 + scanBoost * 0.3;
          introCtx.beginPath();
          introCtx.moveTo(p.x, p.y);
          introCtx.lineTo(p2.x, p2.y);

          if (scanBoost > 0.2) {
            introCtx.strokeStyle = `rgba(247, 37, 133, ${alpha})`;
          } else {
            introCtx.strokeStyle = `rgba(76, 201, 240, ${alpha})`;
          }
          introCtx.lineWidth = 0.6;
          introCtx.stroke();
        }
      }

      // Draw particle
      introCtx.beginPath();
      introCtx.arc(p.x, p.y, p.radius + scanBoost * 2, 0, Math.PI * 2);

      if (scanBoost > 0.3) {
        introCtx.fillStyle = `rgba(247, 37, 133, ${0.5 + scanBoost})`;
        introCtx.shadowBlur = 12;
        introCtx.shadowColor = '#f72585';
      } else {
        introCtx.fillStyle = `rgba(76, 201, 240, ${0.3 + p.brightness * 0.3})`;
        introCtx.shadowBlur = 0;
      }
      introCtx.fill();
      introCtx.shadowBlur = 0;
    }

    // Hex decorations in corners
    drawHexPattern(introCtx, 60, 60, 20, 'rgba(114, 9, 183, 0.08)');
    drawHexPattern(introCtx, introCanvas.width - 60, introCanvas.height - 60, 20, 'rgba(247, 37, 133, 0.06)');
  }

  function drawHexPattern(ctx, cx, cy, size, color) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + size * Math.cos(angle);
      const y = cy + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const introAnimId = setInterval(drawIntro, 30);

  // Terminal typing
  async function typeLine(text, cls = '') {
    return new Promise(resolve => {
      const line = document.createElement('div');
      line.className = 'terminal-line ' + cls;
      terminalBody.appendChild(line);
      let i = 0;
      const interval = setInterval(() => {
        line.textContent += text.charAt(i);
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setTimeout(resolve, 80);
        }
      }, 22);
    });
  }

  // Fetch content concurrently with intro
  const contentPromise = fetch('content.json')
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .catch(e => { console.error('Failed to load content.json', e); return null; });

  // ---- Run the intro sequence ----
  await sleep(400);
  await typeLine('> INITIALIZING SYSTEM...', 'magenta');
  await sleep(250);
  await typeLine('> SCANNING PORTS 1-65535... [OK]', 'green');
  await sleep(180);
  await typeLine('> LOADING KERNEL MODULES... [OK]', 'green');
  await sleep(300);
  await typeLine('> ESTABLISHING ENCRYPTED TUNNEL...', 'cyan');
  await sleep(450);
  await typeLine('> DECRYPTING PORTFOLIO DATA...', 'magenta');
  await sleep(350);
  await typeLine('> FIREWALL BYPASSED... [OK]', 'green');
  await sleep(200);
  await typeLine('> IDENTITY VERIFIED ✓', 'green');
  await sleep(350);
  await typeLine('', 'dim');
  await typeLine('█  ACCESS GRANTED  █', 'success glitch');
  await sleep(1100);

  clearInterval(introAnimId);
  introOverlay.classList.add('fade-out');
  await sleep(900);
  introOverlay.remove();

  // =============================================
  //  INITIALIZE SITE
  // =============================================
  const contentData = await contentPromise;
  if (contentData) {
    initSite(contentData);
  }

  initCustomCursor();
  initMobileNav();
  initNeuralCanvas();
  initProjectTilt();
  initPageNavigation();

  showPage(window.location.hash || '#hero');

  // =============================================
  //  SITE POPULATION
  // =============================================
  function initSite(data) {
    applyTheme(data.siteSettings);
    populateHero(data.identity);
    populateAbout(data.identity);
    populateSkills(data.skills);
    populateProjects(data.pinnedProjects, data.hiddenRepos, data.identity.github);
    populateExperience(data.experience);
    populateContact(data.identity, data.siteSettings);
    initTypewriter(data.identity.roles);
  }

  // =============================================
  //  PAGE NAVIGATION SYSTEM
  // =============================================
  function initPageNavigation() {
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(link.getAttribute('href'));
        document.querySelector('.nav-links').classList.remove('active');
      });
    });

    document.querySelector('.logo').addEventListener('click', (e) => {
      e.preventDefault();
      showPage('#hero');
    });

    document.querySelectorAll('.hero-ctas a').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(btn.getAttribute('href'));
      });
    });

    window.addEventListener('popstate', () => {
      showPage(window.location.hash || '#hero');
    });
  }

  function showPage(hash) {
    document.querySelectorAll('.page-section').forEach(s => {
      s.classList.remove('page-active');
    });

    const target = document.querySelector(hash);
    if (target) {
      target.classList.add('page-active');

      const reveals = target.querySelectorAll('.reveal:not(.active)');
      reveals.forEach((el, i) => {
        setTimeout(() => el.classList.add('active'), i * 120);
      });

      if (hash === '#experience') {
        const items = target.querySelectorAll('.timeline-item:not(.visible)');
        items.forEach((item, i) => {
          setTimeout(() => {
            item.classList.add('visible');
            updateTimelineFill();
          }, i * 220);
        });
      }

      if (hash === '#about') {
        triggerStats();
      }
    }

    document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-links a[href="${hash}"]`);
    if (activeLink) activeLink.classList.add('active');

    window.scrollTo(0, 0);
    if (window.location.hash !== hash) {
      history.pushState(null, '', hash);
    }
  }

  function triggerStats() {
    document.querySelectorAll('.stat-number').forEach(stat => {
      if (!stat.dataset.counted) {
        stat.dataset.counted = 'true';
        const target = +stat.dataset.target;
        let count = 0;
        const int = setInterval(() => {
          count++;
          stat.textContent = count;
          if (count >= target) clearInterval(int);
        }, 200);
      }
    });
  }

  // =============================================
  //  CUSTOM CURSOR
  // =============================================
  function initCustomCursor() {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');

    if (!window.matchMedia('(pointer: fine)').matches) {
      if (cursorDot) cursorDot.style.display = 'none';
      if (cursorRing) cursorRing.style.display = 'none';
      document.body.style.cursor = 'auto';
      return;
    }

    document.addEventListener('mousemove', (e) => {
      cursorDot.style.left = e.clientX + 'px';
      cursorDot.style.top = e.clientY + 'px';
      cursorRing.style.left = e.clientX + 'px';
      cursorRing.style.top = e.clientY + 'px';
    });

    function addHover() { document.body.classList.add('hovering'); }
    function removeHover() { document.body.classList.remove('hovering'); }

    function attachHoverListeners() {
      document.querySelectorAll('a, button, input, textarea, .skill-chip, .project-card, .small-card, .contact-link-card').forEach(el => {
        el.removeEventListener('mouseenter', addHover);
        el.removeEventListener('mouseleave', removeHover);
        el.addEventListener('mouseenter', addHover);
        el.addEventListener('mouseleave', removeHover);
      });
    }
    attachHoverListeners();
    setTimeout(attachHoverListeners, 4000);
  }

  // =============================================
  //  MOBILE NAV
  // =============================================
  function initMobileNav() {
    document.getElementById('hamburger').addEventListener('click', () => {
      document.querySelector('.nav-links').classList.toggle('active');
    });
  }

  // =============================================
  //  SVG ICONS FOR SOCIAL LINKS
  // =============================================
  const ICONS = {
    github: `<svg viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>`,
    linkedin: `<svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
    leetcode: `<svg viewBox="0 0 24 24"><path d="M13.483 0a1.374 1.374 0 00-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 00-1.209 2.104 5.35 5.35 0 00-.125.513 5.527 5.527 0 00.062 2.362 5.83 5.83 0 00.349 1.017 5.938 5.938 0 001.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 00-1.951-.003l-2.396 2.392a3.021 3.021 0 01-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 01.066-.523 2.545 2.545 0 01.619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 00-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0013.483 0zm-2.866 12.815a1.38 1.38 0 00-1.38 1.382 1.38 1.38 0 001.38 1.382H20.79a1.38 1.38 0 001.38-1.382 1.38 1.38 0 00-1.38-1.382z"/></svg>`,
    email: `<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`
  };

  // =============================================
  //  POPULATION FUNCTIONS
  // =============================================
  function applyTheme(settings) {
    if (settings && settings.accentPreset) {
      // Don't apply theme class if it would override our synthwave default
      // Only apply if it's a known non-default preset
      if (['indigo', 'emerald', 'amber'].includes(settings.accentPreset)) {
        // Keep default synthwave - don't set class
      }
    }
  }

  function populateHero(identity) {
    const statusEl = document.getElementById('hero-status');
    const statusTextEl = document.getElementById('hero-status-text');
    if (identity.status && identity.status.active) {
      statusTextEl.textContent = identity.status.label;
    } else {
      statusEl.style.display = 'none';
    }
    document.getElementById('hero-subtext').textContent = identity.tagline;
    document.getElementById('hero-socials').innerHTML = getSocialHTML(identity);
  }

  function getSocialHTML(identity) {
    let html = '';
    if (identity.github) html += `<a href="${identity.github}" target="_blank" class="social-icon" title="GitHub">GH</a>`;
    if (identity.linkedin) html += `<a href="${identity.linkedin}" target="_blank" class="social-icon" title="LinkedIn">IN</a>`;
    if (identity.leetcode) html += `<a href="${identity.leetcode}" target="_blank" class="social-icon" title="LeetCode">LC</a>`;
    if (identity.email) html += `<a href="mailto:${identity.email}" class="social-icon" title="Email">@</a>`;
    return html;
  }

  function populateAbout(identity) {
    document.getElementById('about-bio').innerHTML = identity.bio;
  }

  function populateSkills(skills) {
    const container = document.getElementById('skills-container');
    container.innerHTML = '';
    for (const [category, items] of Object.entries(skills)) {
      const catDiv = document.createElement('div');
      catDiv.className = 'skill-category reveal';
      catDiv.dataset.cat = category;
      let chipsHtml = items.map(item => `<div class="skill-chip">${item}</div>`).join('');
      catDiv.innerHTML = `<h3>${category}</h3><div class="chips-container">${chipsHtml}</div>`;
      container.appendChild(catDiv);
    }
  }

  async function populateProjects(pinned, hidden, githubUrl) {
    const featuredContainer = document.getElementById('featured-projects');
    featuredContainer.innerHTML = '';
    const sortedPinned = [...pinned].sort((a, b) => a.rank - b.rank);

    sortedPinned.forEach(p => {
      const highlightsHtml = p.highlights.map(h => `<li>${h}</li>`).join('');
      const html = `
        <div class="project-card reveal" data-repo="${p.repo}">
          <div class="card-glow"></div>
          <div class="rank-badge">#${p.rank}</div>
          <div class="project-header">
            <h3 class="project-title">${p.repo}</h3>
            <span class="language-badge" id="lang-${p.repo}">-</span>
          </div>
          <p class="project-desc">${p.overrideDescription}</p>
          <ul class="project-highlights">${highlightsHtml}</ul>
          <a href="https://github.com/ishaansahu22/${p.repo}" target="_blank" class="btn btn-outline">View on GitHub</a>
        </div>
      `;
      featuredContainer.insertAdjacentHTML('beforeend', html);
    });

    const allContainer = document.getElementById('all-projects');
    try {
      const res = await fetch('https://api.github.com/users/ishaansahu22/repos?sort=updated&per_page=20');
      if (res.ok) {
        const repos = await res.json();
        const pinnedRepos = pinned.map(p => p.repo);
        repos.forEach(repo => {
          if (pinnedRepos.includes(repo.name)) {
            const el = document.getElementById(`lang-${repo.name}`);
            if (el) el.textContent = repo.language || 'Code';
            return;
          }
          if (hidden.includes(repo.name)) return;
          const html = `
            <a href="${repo.html_url}" target="_blank" class="small-card">
              <div class="small-card-title">
                ${repo.name}
                <span>🔗</span>
              </div>
              <p class="small-card-desc">${repo.description || 'No description provided.'}</p>
              <div class="small-card-meta">
                <span>${repo.language || 'N/A'}</span>
                <span>⭐ ${repo.stargazers_count}</span>
              </div>
            </a>
          `;
          allContainer.insertAdjacentHTML('beforeend', html);
        });
      }
    } catch (e) {
      console.log('Error fetching GH repos', e);
    }
  }

  function populateExperience(experience) {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '<div class="timeline-line"><div class="timeline-line-fill" id="timeline-fill"></div></div>';
    experience.forEach(exp => {
      const bullets = exp.bullets.map(b => `<li>${b}</li>`).join('');
      const html = `
        <div class="timeline-item">
          <div class="timeline-node"></div>
          <div class="timeline-content">
            <h3 class="exp-role">${exp.role}</h3>
            <div class="exp-meta">
              <span class="exp-company">${exp.company}</span>
              <span>${exp.period}</span>
              <span>${exp.type}</span>
            </div>
            <ul class="project-highlights">${bullets}</ul>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', html);
    });
  }

  function populateContact(identity, settings) {
    // Build contact link cards with SVG icons
    const grid = document.getElementById('contact-links-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const links = [];

    if (identity.linkedin) {
      links.push({
        href: identity.linkedin,
        icon: ICONS.linkedin,
        name: 'LinkedIn',
        handle: 'sahuishaan22',
        target: '_blank'
      });
    }
    if (identity.github) {
      links.push({
        href: identity.github,
        icon: ICONS.github,
        name: 'GitHub',
        handle: 'ishaansahu22',
        target: '_blank'
      });
    }
    if (identity.leetcode) {
      links.push({
        href: identity.leetcode,
        icon: ICONS.leetcode,
        name: 'LeetCode',
        handle: 'ishaansahu22',
        target: '_blank'
      });
    }
    if (identity.email) {
      links.push({
        href: `mailto:${identity.email}`,
        icon: ICONS.email,
        name: 'Email',
        handle: identity.email,
        target: ''
      });
    }

    links.forEach(link => {
      const html = `
        <a href="${link.href}" ${link.target ? `target="${link.target}"` : ''} class="contact-link-card">
          <div class="contact-link-icon">${link.icon}</div>
          <div class="contact-link-info">
            <span class="contact-link-name">${link.name}</span>
            <span class="contact-link-handle">${link.handle}</span>
          </div>
        </a>
      `;
      grid.insertAdjacentHTML('beforeend', html);
    });

    // Footer
    document.getElementById('footer-text').textContent = settings.footerText;
    document.getElementById('footer-socials-row').innerHTML = getSocialHTML(identity);
  }

  // =============================================
  //  TYPEWRITER
  // =============================================
  function initTypewriter(roles) {
    const el = document.getElementById('typewriter');
    if (!roles || roles.length === 0) return;
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
      const currentRole = roles[roleIndex];
      if (isDeleting) {
        el.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
      } else {
        el.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
      }

      let typeSpeed = isDeleting ? 50 : 100;

      if (!isDeleting && charIndex === currentRole.length) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        typeSpeed = 500;
      }

      setTimeout(type, typeSpeed);
    }
    type();
  }

  // =============================================
  //  EFFECTS
  // =============================================
  function updateTimelineFill() {
    const container = document.getElementById('timeline-container');
    const fill = document.getElementById('timeline-fill');
    if (!container || !fill) return;
    const items = container.querySelectorAll('.timeline-item.visible');
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      const node = lastItem.querySelector('.timeline-node');
      if (node) {
        fill.style.height = (node.offsetTop + 10) + 'px';
      }
    }
  }

  function initProjectTilt() {
    document.addEventListener('mousemove', (e) => {
      document.querySelectorAll('.project-card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        if (e.clientX > rect.left && e.clientX < rect.right &&
            e.clientY > rect.top && e.clientY < rect.bottom) {
          const rotateX = ((y - centerY) / centerY) * -5;
          const rotateY = ((x - centerX) / centerX) * 5;
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        } else {
          card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
        }
      });
    });
  }

  // =============================================
  //  NEURAL CANVAS (Hero background)
  // =============================================
  function initNeuralCanvas() {
    const canvas = document.getElementById('neural-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let nodes = [];
    const numNodes = window.innerWidth > 768 ? 60 : 30;

    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1
      });
    }

    let mouseX = -1000, mouseY = -1000;

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => { mouseX = -1000; mouseY = -1000; });

    function draw() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];

        let dxMouse = mouseX - node.x;
        let dyMouse = mouseY - node.y;
        let distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 150) {
          node.x -= dxMouse * 0.02;
          node.y -= dyMouse * 0.02;
        }

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f72585';
        ctx.globalAlpha = 0.25;
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          let node2 = nodes[j];
          let dx = node.x - node2.x;
          let dy = node.y - node2.y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(node2.x, node2.y);
            ctx.strokeStyle = '#f72585';
            ctx.globalAlpha = 0.1 * (1 - dist / 150);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    draw();

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

});
