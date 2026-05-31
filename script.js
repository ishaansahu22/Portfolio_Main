document.addEventListener('DOMContentLoaded', async () => {

  // =============================================
  //  HELPER
  // =============================================
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // =============================================
  //  INTRO ANIMATION — Cybersecurity Boot Sequence
  // =============================================
  const introOverlay = document.getElementById('intro-overlay');
  const binaryCanvas = document.getElementById('binary-rain');
  const binaryCtx = binaryCanvas.getContext('2d');
  const terminalBody = document.getElementById('terminal-body');

  // Size canvas
  binaryCanvas.width = window.innerWidth;
  binaryCanvas.height = window.innerHeight;

  // Binary rain columns
  const fontSize = 14;
  const columns = Math.floor(binaryCanvas.width / fontSize);
  const drops = [];
  for (let i = 0; i < columns; i++) {
    drops[i] = Math.random() * -40;
  }

  function drawBinaryRain() {
    binaryCtx.fillStyle = 'rgba(5, 5, 8, 0.06)';
    binaryCtx.fillRect(0, 0, binaryCanvas.width, binaryCanvas.height);
    binaryCtx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
      const char = Math.random() > 0.5 ? '1' : '0';
      const rnd = Math.random();

      if (rnd > 0.96) {
        binaryCtx.fillStyle = '#ffffff';
      } else if (rnd > 0.65) {
        binaryCtx.fillStyle = 'rgba(6, 182, 212, 0.85)';
      } else {
        binaryCtx.fillStyle = 'rgba(99, 102, 241, 0.45)';
      }

      binaryCtx.fillText(char, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > binaryCanvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  const rainInterval = setInterval(drawBinaryRain, 35);

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

  // Fetch content data concurrently while intro plays
  const contentPromise = fetch('content.json')
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .catch(e => { console.error('Failed to load content.json', e); return null; });

  // ---- Run the intro sequence ----
  await sleep(400);
  await typeLine('> INITIALIZING SYSTEM...', 'cyan');
  await sleep(250);
  await typeLine('> SCANNING PORTS 1-65535... [OK]', 'green');
  await sleep(180);
  await typeLine('> LOADING KERNEL MODULES... [OK]', 'green');
  await sleep(300);
  await typeLine('> ESTABLISHING ENCRYPTED TUNNEL...', 'cyan');
  await sleep(450);
  await typeLine('> DECRYPTING PORTFOLIO DATA...', 'cyan');
  await sleep(350);
  await typeLine('> FIREWALL BYPASSED... [OK]', 'green');
  await sleep(200);
  await typeLine('> IDENTITY VERIFIED ✓', 'green');
  await sleep(350);
  await typeLine('', 'dim');
  await typeLine('█  ACCESS GRANTED  █', 'success glitch');
  await sleep(1100);

  // Fade out intro
  clearInterval(rainInterval);
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

  // Show the starting page
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
    populateContactAndFooter(data.identity, data.siteSettings);
    initTypewriter(data.identity.roles);
  }

  // =============================================
  //  PAGE NAVIGATION SYSTEM
  // =============================================
  function initPageNavigation() {
    // Nav link clicks
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(link.getAttribute('href'));
        document.querySelector('.nav-links').classList.remove('active');
      });
    });

    // Logo → Home
    document.querySelector('.logo').addEventListener('click', (e) => {
      e.preventDefault();
      showPage('#hero');
    });

    // Hero CTA buttons
    document.querySelectorAll('.hero-ctas a').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(btn.getAttribute('href'));
      });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      showPage(window.location.hash || '#hero');
    });
  }

  function showPage(hash) {
    // Hide all page sections
    document.querySelectorAll('.page-section').forEach(s => {
      s.classList.remove('page-active');
    });

    // Show the target section
    const target = document.querySelector(hash);
    if (target) {
      target.classList.add('page-active');

      // Trigger reveal animations (staggered, first-time only)
      const reveals = target.querySelectorAll('.reveal:not(.active)');
      reveals.forEach((el, i) => {
        setTimeout(() => el.classList.add('active'), i * 120);
      });

      // Experience timeline cascade
      if (hash === '#experience') {
        const items = target.querySelectorAll('.timeline-item:not(.visible)');
        items.forEach((item, i) => {
          setTimeout(() => {
            item.classList.add('visible');
            updateTimelineFill();
          }, i * 220);
        });
      }

      // About stats counter
      if (hash === '#about') {
        triggerStats();
      }
    }

    // Update nav active state
    document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-links a[href="${hash}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Scroll to top and update URL
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
      document.querySelectorAll('a, button, input, textarea, .skill-chip, .project-card, .small-card').forEach(el => {
        el.removeEventListener('mouseenter', addHover);
        el.removeEventListener('mouseleave', removeHover);
        el.addEventListener('mouseenter', addHover);
        el.addEventListener('mouseleave', removeHover);
      });
    }
    attachHoverListeners();
    // Re-attach after dynamic content loads
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
  //  POPULATION FUNCTIONS
  // =============================================
  function applyTheme(settings) {
    if (settings && settings.accentPreset) {
      document.body.className = `theme-${settings.accentPreset}`;
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

    // Fetch all repos from GitHub
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

  function populateContactAndFooter(identity, settings) {
    if (identity.email) {
      document.getElementById('contact-email').textContent = identity.email;
      document.getElementById('contact-email').href = `mailto:${identity.email}`;
    }
    document.getElementById('contact-socials').innerHTML = getSocialHTML(identity);
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

    let mouseX = -1000;
    let mouseY = -1000;

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => { mouseX = -1000; mouseY = -1000; });

    function draw() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const themeColor = getComputedStyle(document.body).getPropertyValue('--accent-primary').trim();

      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];

        // Mouse repulsion
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
        ctx.fillStyle = themeColor;
        ctx.globalAlpha = 0.3;
        ctx.fill();

        // Connection lines
        for (let j = i + 1; j < nodes.length; j++) {
          let node2 = nodes[j];
          let dx = node.x - node2.x;
          let dy = node.y - node2.y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(node2.x, node2.y);
            ctx.strokeStyle = themeColor;
            ctx.globalAlpha = 0.15 * (1 - dist / 150);
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
