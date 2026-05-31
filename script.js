document.addEventListener('DOMContentLoaded', async () => {
  // --- Always initialize visual effects & scroll reveal ---
  initAnimations();
  initNeuralCanvas();
  initMatrixRain();

  // Safety net: force-reveal all sections after 3s in case IntersectionObserver doesn't fire
  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
    document.querySelectorAll('.timeline-item').forEach(el => el.classList.add('visible'));
  }, 3000);

  // --- Data Fetching ---
  let content = {};
  try {
    const response = await fetch('content.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    content = await response.json();
    initSite(content);
  } catch (error) {
    console.error("Failed to load content.json", error);
    // Force-reveal all sections immediately on error so static HTML content is visible
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
    document.querySelectorAll('.timeline-item').forEach(el => el.classList.add('visible'));
  }

  // --- Initializers ---
  function initSite(data) {
    applyTheme(data.siteSettings);
    populateHero(data.identity);
    populateAbout(data.identity);
    populateSkills(data.skills);
    populateProjects(data.pinnedProjects, data.hiddenRepos, data.identity.github);
    populateExperience(data.experience);
    populateContactAndFooter(data.identity, data.siteSettings);
    
    initTypewriter(data.identity.roles);

    // Re-observe any dynamically injected .reveal elements
    document.querySelectorAll('.reveal, .timeline-item, .about-grid').forEach(el => {
      if (window._portfolioObserver) window._portfolioObserver.observe(el);
    });
  }

  // --- Custom Cursor ---
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  
  if (window.matchMedia("(pointer: fine)").matches) {
    document.addEventListener('mousemove', (e) => {
      cursorDot.style.left = e.clientX + 'px';
      cursorDot.style.top = e.clientY + 'px';
      cursorRing.style.left = e.clientX + 'px';
      cursorRing.style.top = e.clientY + 'px';
    });

    const addHoverClass = () => document.body.classList.add('hovering');
    const removeHoverClass = () => document.body.classList.remove('hovering');

    document.querySelectorAll('a, button, input, textarea, .skill-chip, .project-card, .small-card').forEach(el => {
      el.addEventListener('mouseenter', addHoverClass);
      el.addEventListener('mouseleave', removeHoverClass);
    });
  }

  // --- Mobile Nav ---
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });

  // --- Navbar Scroll Effect ---
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // --- Population Functions ---
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
    
    // Socials
    const socialRow = document.getElementById('hero-socials');
    socialRow.innerHTML = getSocialHTML(identity);
  }

  function getSocialHTML(identity) {
    let html = '';
    if(identity.github) html += `<a href="${identity.github}" target="_blank" class="social-icon" title="GitHub">GH</a>`;
    if(identity.linkedin) html += `<a href="${identity.linkedin}" target="_blank" class="social-icon" title="LinkedIn">IN</a>`;
    if(identity.leetcode) html += `<a href="${identity.leetcode}" target="_blank" class="social-icon" title="LeetCode">LC</a>`;
    if(identity.email) html += `<a href="mailto:${identity.email}" class="social-icon" title="Email">@</a>`;
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
    // Pinned
    const featuredContainer = document.getElementById('featured-projects');
    featuredContainer.innerHTML = '';
    const sortedPinned = [...pinned].sort((a, b) => a.rank - b.rank);
    
    sortedPinned.forEach(p => {
      const highlightsHtml = p.highlights.map(h => `<li>${h}</li>`).join('');
      // We don't have the language or real github link without fetching it, so we'll mock or leave blank, 
      // but to be "production-grade" we should fetch the repo details if possible.
      // We will do a combined fetch.
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

    // Fetch All from GitHub
    const allContainer = document.getElementById('all-projects');
    try {
      const res = await fetch('https://api.github.com/users/ishaansahu22/repos?sort=updated&per_page=20');
      if(res.ok) {
        const repos = await res.json();
        const pinnedRepos = pinned.map(p => p.repo);
        
        repos.forEach(repo => {
          // Update pinned language if found
          if(pinnedRepos.includes(repo.name)) {
            const el = document.getElementById(`lang-${repo.name}`);
            if(el) el.textContent = repo.language || 'Code';
            return; // Skip adding to all projects
          }
          if(hidden.includes(repo.name)) return;
          
          const html = `
            <a href="${repo.html_url}" target="_blank" class="small-card reveal">
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
    } catch(e) {
      console.log("Error fetching GH repos", e);
    }
  }

  function populateExperience(experience) {
    const container = document.getElementById('timeline-container');
    // keep timeline line, remove existing nodes
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
    if(identity.email) {
      document.getElementById('contact-email').textContent = identity.email;
      document.getElementById('contact-email').href = `mailto:${identity.email}`;
    }
    document.getElementById('contact-socials').innerHTML = getSocialHTML(identity);
    document.getElementById('footer-text').textContent = settings.footerText;
    document.getElementById('footer-socials-row').innerHTML = getSocialHTML(identity);
  }

  // --- Animations & Effects ---
  function initTypewriter(roles) {
    const el = document.getElementById('typewriter');
    if(!roles || roles.length === 0) return;
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

  function initAnimations() {
    // Scroll Reveal
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting) {
          entry.target.classList.add('active');
          
          // Trigger timeline item visible
          if(entry.target.classList.contains('timeline-item')) {
            entry.target.classList.add('visible');
            updateTimelineFill();
          }

          // Trigger stats
          if(entry.target.classList.contains('about-grid')) {
            const stats = document.querySelectorAll('.stat-number');
            stats.forEach(stat => {
              if(!stat.dataset.counted) {
                stat.dataset.counted = true;
                const target = +stat.dataset.target;
                let count = 0;
                const int = setInterval(() => {
                  count++;
                  stat.textContent = count;
                  if(count >= target) clearInterval(int);
                }, 200);
              }
            });
          }
        }
      });
    }, { threshold: 0.1 });

    // Store observer globally so dynamically-added elements can be observed later
    window._portfolioObserver = observer;

    document.querySelectorAll('.reveal, .timeline-item, .about-grid').forEach(el => observer.observe(el));

    // Tilt Effect
    document.addEventListener('mousemove', (e) => {
      document.querySelectorAll('.project-card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        if (e.clientX > rect.left && e.clientX < rect.right && e.clientY > rect.top && e.clientY < rect.bottom) {
          const rotateX = ((y - centerY) / centerY) * -5;
          const rotateY = ((x - centerX) / centerX) * 5;
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        } else {
          card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
        }
      });
    });
  }

  function updateTimelineFill() {
    const container = document.getElementById('timeline-container');
    const fill = document.getElementById('timeline-fill');
    if(!container || !fill) return;
    const items = container.querySelectorAll('.timeline-item.visible');
    if(items.length > 0) {
      const lastItem = items[items.length - 1];
      const node = lastItem.querySelector('.timeline-node');
      if(node) {
        fill.style.height = (node.offsetTop + 10) + 'px';
      }
    }
  }

  // --- Neural Canvas ---
  function initNeuralCanvas() {
    const canvas = document.getElementById('neural-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let nodes = [];
    const numNodes = window.innerWidth > 768 ? 60 : 30;
    
    for(let i=0; i<numNodes; i++) {
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
      if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const themeColor = getComputedStyle(document.body).getPropertyValue('--accent-primary').trim();
      
      for(let i=0; i<nodes.length; i++) {
        let node = nodes[i];
        
        // Repel
        let dxMouse = mouseX - node.x;
        let dyMouse = mouseY - node.y;
        let distMouse = Math.sqrt(dxMouse*dxMouse + dyMouse*dyMouse);
        if(distMouse < 150) {
          node.x -= dxMouse * 0.02;
          node.y -= dyMouse * 0.02;
        }

        node.x += node.vx;
        node.y += node.vy;
        
        if(node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if(node.y < 0 || node.y > canvas.height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = themeColor;
        ctx.globalAlpha = 0.3;
        ctx.fill();

        for(let j=i+1; j<nodes.length; j++) {
          let node2 = nodes[j];
          let dx = node.x - node2.x;
          let dy = node.y - node2.y;
          let dist = Math.sqrt(dx*dx + dy*dy);
          
          if(dist < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(node2.x, node2.y);
            ctx.strokeStyle = themeColor;
            ctx.globalAlpha = 0.15 * (1 - dist/150);
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

  // --- Matrix Rain ---
  function initMatrixRain() {
    const container = document.getElementById('matrix-rain');
    if(!container) return;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";
    
    setInterval(() => {
      if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      let text = '';
      for(let i=0; i<30; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length)) + '<br>';
      }
      container.innerHTML = text;
    }, 100);
  }
});
