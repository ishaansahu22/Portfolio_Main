const adminApp = (() => {
  let content = {};
  let ghRepos = [];
  let token = sessionStorage.getItem('adminToken');
  let password = sessionStorage.getItem('adminPassword');
  let selectedResumeFile = null;

  const DOM = {
    login: document.getElementById('login-screen'),
    dashboard: document.getElementById('dashboard'),
    form: document.getElementById('login-form'),
    passInput: document.getElementById('admin-password'),
    error: document.getElementById('login-error'),
    toast: document.getElementById('toast'),
    navBtns: document.querySelectorAll('.nav-btn'),
    sections: document.querySelectorAll('.section-view'),
    saveBtns: document.querySelectorAll('.save-btn')
  };

  async function init() {
    if (token && password) {
      showDashboard();
      await loadData();
    }

    DOM.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pwd = DOM.passInput.value;
      
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd })
        });
        const data = await res.json();
        
        if (data.success) {
          sessionStorage.setItem('adminToken', data.token);
          sessionStorage.setItem('adminPassword', pwd);
          token = data.token;
          password = pwd;
          showDashboard();
          await loadData();
        } else {
          DOM.error.textContent = data.error || "Invalid password";
          DOM.error.style.display = 'block';
        }
      } catch (err) {
        DOM.error.textContent = "Error connecting to server.";
        DOM.error.style.display = 'block';
      }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
      sessionStorage.clear();
      location.reload();
    });

    // Navigation
    DOM.navBtns.forEach(btn => {
      if(btn.id === 'logout-btn') return;
      btn.addEventListener('click', () => {
        DOM.navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        DOM.sections.forEach(s => s.classList.remove('active'));
        const targetId = btn.dataset.target;
        document.getElementById(targetId).classList.add('active');
        if (targetId === 'sec-visitors') {
          loadVisitors();
        }
      });
    });

    // Save Handlers
    DOM.saveBtns.forEach(btn => {
      btn.addEventListener('click', () => saveSection(btn.dataset.section));
    });

    // Resume upload handlers
    initResumeUpload();
  }

  function showDashboard() {
    DOM.login.style.display = 'none';
    DOM.dashboard.style.display = 'flex';
  }

  function showToast(msg, isError = false) {
    DOM.toast.textContent = msg;
    DOM.toast.className = isError ? 'toast-error show' : 'toast-success show';
    setTimeout(() => DOM.toast.classList.remove('show'), 3000);
  }

  async function loadData() {
    try {
      const res = await fetch('content.json?t=' + Date.now()); // Prevent caching
      content = await res.json();
      
      // Fetch GH repos
      const ghRes = await fetch(`https://api.github.com/users/ishaansahu22/repos?per_page=100`);
      if(ghRes.ok) ghRepos = await ghRes.json();

      populateIdentity();
      populateFeatured();
      populateHidden();
      populateSkills();
      populateExperience();
      populateSettings();
      populateResume();
    } catch(e) {
      showToast("Failed to load data", true);
    }
  }

  // --- Population ---

  function populateIdentity() {
    document.getElementById('id-name').value = content.identity.name || '';
    document.getElementById('id-tagline').value = content.identity.tagline || '';
    document.getElementById('id-bio').value = content.identity.bio || '';
    
    document.getElementById('id-status-active').checked = content.identity.status?.active || false;
    document.getElementById('id-status-label').value = content.identity.status?.label || '';
    
    document.getElementById('id-email').value = content.identity.email || '';
    document.getElementById('id-linkedin').value = content.identity.linkedin || '';
    document.getElementById('id-github').value = content.identity.github || '';
    document.getElementById('id-leetcode').value = content.identity.leetcode || '';

    renderRoles();
  }

  function renderRoles() {
    const container = document.getElementById('roles-container');
    container.innerHTML = content.identity.roles.map((r, i) => `
      <div class="chip">${r} <button onclick="adminApp.removeRole(${i})">×</button></div>
    `).join('');
  }

  function addRole() {
    const input = document.getElementById('new-role');
    if(input.value.trim()) {
      content.identity.roles.push(input.value.trim());
      input.value = '';
      renderRoles();
    }
  }
  function removeRole(i) {
    content.identity.roles.splice(i, 1);
    renderRoles();
  }

  function populateFeatured() {
    const container = document.getElementById('featured-list');
    container.innerHTML = '';
    
    // Sort logic to put pinned first
    let list = [...ghRepos].map(repo => {
      const pinned = content.pinnedProjects.find(p => p.repo === repo.name);
      return { repo, pinned };
    });

    list.sort((a, b) => {
      if(a.pinned && b.pinned) return a.pinned.rank - b.pinned.rank;
      if(a.pinned) return -1;
      if(b.pinned) return 1;
      return new Date(b.repo.updated_at) - new Date(a.repo.updated_at);
    });

    list.forEach((item, i) => {
      const isPinned = !!item.pinned;
      const html = `
        <div class="repo-item ${isPinned ? 'pinned' : ''}" data-repo="${item.repo.name}">
          <input type="checkbox" onchange="adminApp.togglePin('${item.repo.name}', this)" ${isPinned ? 'checked' : ''}>
          <span>${item.repo.name}</span>
          ${isPinned ? `<span class="repo-rank">#${item.pinned.rank}</span>` : ''}
        </div>
        <div class="repo-expand" id="expand-${item.repo.name}">
          <div class="form-group">
            <label>Override Description</label>
            <textarea id="desc-${item.repo.name}" rows="2">${isPinned ? (item.pinned.overrideDescription||'') : ''}</textarea>
          </div>
          <div class="form-group">
            <label>Highlights (comma separated)</label>
            <input type="text" id="high-${item.repo.name}" value="${isPinned ? (item.pinned.highlights||[]).join(', ') : ''}">
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', html);
    });
  }

  function togglePin(repoName, checkbox) {
    const pinnedCount = content.pinnedProjects.length;
    
    if(checkbox.checked) {
      if(pinnedCount >= 3) {
        // Uncheck the lowest ranked (rank 3)
        const toRemove = content.pinnedProjects.find(p => p.rank === 3);
        if(toRemove) {
          content.pinnedProjects = content.pinnedProjects.filter(p => p.repo !== toRemove.repo);
        }
      }
      // Add new
      content.pinnedProjects.push({
        repo: repoName,
        rank: content.pinnedProjects.length + 1,
        overrideDescription: "",
        highlights: []
      });
    } else {
      content.pinnedProjects = content.pinnedProjects.filter(p => p.repo !== repoName);
      // Re-rank remaining
      content.pinnedProjects.forEach((p, i) => p.rank = i + 1);
    }
    
    // Save expansions to content obj temporarily
    content.pinnedProjects.forEach(p => {
      const descEl = document.getElementById(`desc-${p.repo}`);
      const highEl = document.getElementById(`high-${p.repo}`);
      if(descEl) p.overrideDescription = descEl.value;
      if(highEl) p.highlights = highEl.value.split(',').map(s=>s.trim()).filter(Boolean);
    });

    populateFeatured(); // Re-render
  }

  function populateHidden() {
    const container = document.getElementById('hidden-list');
    container.innerHTML = ghRepos.map(repo => {
      const isHidden = content.hiddenRepos.includes(repo.name);
      return `
        <label style="display:flex; align-items:center; gap:0.5rem; background: var(--surface); padding: 0.5rem; border: 1px solid var(--card-border); border-radius: 4px;">
          <input type="checkbox" value="${repo.name}" ${isHidden ? 'checked' : ''} class="hidden-cb">
          ${repo.name}
        </label>
      `;
    }).join('');
  }

  function populateSkills() {
    const container = document.getElementById('skills-editor');
    container.innerHTML = '';
    for(const [cat, items] of Object.entries(content.skills)) {
      container.innerHTML += `
        <div class="edit-card skill-cat-card" data-cat="${cat}" style="margin-bottom: 1rem;">
          <input type="text" value="${cat}" class="cat-name-input" style="background:transparent; border:none; color:var(--accent); font-size:1.2rem; font-weight:bold; margin-bottom: 1rem;">
          <button class="delete-btn" onclick="adminApp.deleteSkillCat('${cat}')">Delete Category</button>
          <div class="form-group">
            <input type="text" value="${items.join(', ')}" class="cat-items-input" placeholder="Comma separated skills">
          </div>
        </div>
      `;
    }
  }

  function addSkillCategory() {
    content.skills['New Category'] = [];
    populateSkills();
  }
  function deleteSkillCat(cat) {
    delete content.skills[cat];
    populateSkills();
  }

  function populateExperience() {
    const container = document.getElementById('experience-list');
    container.innerHTML = content.experience.map((exp, i) => `
      <div class="edit-card exp-entry" data-index="${i}">
        <button class="delete-btn" onclick="adminApp.deleteExp(${i})">Delete</button>
        <div class="flex-row" style="margin-bottom: 1rem;">
          <input type="text" class="exp-role" value="${exp.role}" placeholder="Role">
          <input type="text" class="exp-company" value="${exp.company}" placeholder="Company">
        </div>
        <div class="flex-row" style="margin-bottom: 1rem;">
          <input type="text" class="exp-period" value="${exp.period}" placeholder="Period">
          <input type="text" class="exp-type" value="${exp.type}" placeholder="Type (Remote/Hybrid)">
        </div>
        <div class="form-group">
          <label>Bullets (new line for each)</label>
          <textarea class="exp-bullets" rows="3">${exp.bullets.join('\n')}</textarea>
        </div>
      </div>
    `).join('');
  }

  function addExperience() {
    content.experience.unshift({
      role: "New Role", company: "Company", period: "Date", type: "Remote", bullets: []
    });
    populateExperience();
  }
  function deleteExp(i) {
    content.experience.splice(i, 1);
    populateExperience();
  }

  function populateSettings() {
    document.getElementById('set-accent').value = content.siteSettings.accentPreset || 'indigo';
    document.getElementById('set-footer').value = content.siteSettings.footerText || '';
  }

  function populateResume() {
    const link = document.getElementById('resume-current-link');
    if (link) {
      const resumeUrl = content.identity?.resumeUrl || 'assets/resume.pdf';
      link.href = '/' + resumeUrl;
      link.textContent = resumeUrl;
    }
  }

  // --- Resume Upload ---

  function initResumeUpload() {
    const uploadArea = document.getElementById('resume-upload-area');
    const fileInput = document.getElementById('resume-file-input');
    const uploadBtn = document.getElementById('resume-upload-btn');

    if (!uploadArea || !fileInput || !uploadBtn) return;

    // Drag & drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) handleResumeFile(file);
    });

    // File input change
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) handleResumeFile(fileInput.files[0]);
    });

    // Upload button
    uploadBtn.addEventListener('click', () => uploadResume());
  }

  function handleResumeFile(file) {
    if (file.type !== 'application/pdf') {
      showToast('Only PDF files are accepted', true);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large (max 10MB)', true);
      return;
    }

    selectedResumeFile = file;
    
    const infoEl = document.getElementById('resume-selected-info');
    const nameEl = document.getElementById('resume-selected-name');
    const sizeEl = document.getElementById('resume-selected-size');
    
    nameEl.textContent = `📄 ${file.name}`;
    sizeEl.textContent = `(${(file.size / 1024).toFixed(1)} KB)`;
    infoEl.style.display = 'block';

    document.getElementById('resume-upload-btn').disabled = false;
  }

  async function uploadResume() {
    if (!selectedResumeFile) {
      showToast('No file selected', true);
      return;
    }

    const uploadBtn = document.getElementById('resume-upload-btn');
    uploadBtn.textContent = 'Uploading...';
    uploadBtn.disabled = true;

    try {
      // Read file as base64
      const base64 = await fileToBase64(selectedResumeFile);

      const res = await fetch('/api/upload-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          fileBase64: base64,
          fileName: 'resume.pdf'
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || 'Resume uploaded successfully');
        
        // Update content.json resume URL too
        content.identity.resumeUrl = 'assets/resume.pdf';
        await saveSection('identity');
        
        selectedResumeFile = null;
        document.getElementById('resume-selected-info').style.display = 'none';
        document.getElementById('resume-file-input').value = '';
        populateResume();
      } else {
        showToast(data.error || 'Failed to upload resume', true);
      }
    } catch (e) {
      showToast('Network error: ' + e.message, true);
    }

    uploadBtn.textContent = 'Upload Resume';
    uploadBtn.disabled = false;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove the data:...;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // --- Save ---

  async function saveSection(section) {
    // Collect data before saving
    if(section === 'identity') {
      content.identity.name = document.getElementById('id-name').value;
      content.identity.tagline = document.getElementById('id-tagline').value;
      content.identity.bio = document.getElementById('id-bio').value;
      content.identity.status.active = document.getElementById('id-status-active').checked;
      content.identity.status.label = document.getElementById('id-status-label').value;
      content.identity.email = document.getElementById('id-email').value;
      content.identity.linkedin = document.getElementById('id-linkedin').value;
      content.identity.github = document.getElementById('id-github').value;
      content.identity.leetcode = document.getElementById('id-leetcode').value;
    }
    
    if(section === 'featured') {
      content.pinnedProjects.forEach(p => {
        const descEl = document.getElementById(`desc-${p.repo}`);
        const highEl = document.getElementById(`high-${p.repo}`);
        if(descEl) p.overrideDescription = descEl.value;
        if(highEl) p.highlights = highEl.value.split(',').map(s=>s.trim()).filter(Boolean);
      });
    }

    if(section === 'hidden') {
      const cbs = document.querySelectorAll('.hidden-cb:checked');
      content.hiddenRepos = Array.from(cbs).map(cb => cb.value);
    }

    if(section === 'skills') {
      const newSkills = {};
      document.querySelectorAll('.skill-cat-card').forEach(card => {
        const catName = card.querySelector('.cat-name-input').value.trim();
        const items = card.querySelector('.cat-items-input').value.split(',').map(s=>s.trim()).filter(Boolean);
        if(catName) newSkills[catName] = items;
      });
      content.skills = newSkills;
    }

    if(section === 'experience') {
      content.experience = Array.from(document.querySelectorAll('.exp-entry')).map(card => {
        return {
          role: card.querySelector('.exp-role').value,
          company: card.querySelector('.exp-company').value,
          period: card.querySelector('.exp-period').value,
          type: card.querySelector('.exp-type').value,
          bullets: card.querySelector('.exp-bullets').value.split('\n').map(s=>s.trim()).filter(Boolean)
        };
      });
    }

    if(section === 'settings') {
      content.siteSettings.accentPreset = document.getElementById('set-accent').value;
      content.siteSettings.footerText = document.getElementById('set-footer').value;
    }

    // Call API
    try {
      const btn = document.querySelector(`.save-btn[data-section="${section}"]`);
      let originalText = 'Save Changes';
      if (btn) {
        originalText = btn.textContent;
        btn.textContent = 'Saving...';
        btn.disabled = true;
      }

      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, content })
      });
      
      const data = await res.json();
      
      if(res.ok && data.success) {
        showToast(data.message || "Saved successfully");
      } else {
        showToast(data.error || "Failed to save", true);
        if(res.status === 401) {
          // Token expired or password wrong
          sessionStorage.clear();
          location.reload();
        }
      }

      if (btn) {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    } catch(e) {
      showToast("Network error", true);
    }
  }

  async function loadVisitors() {
    try {
      const rowsContainer = document.getElementById('visitor-log-rows');
      rowsContainer.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">Retrieving real-time logs...</td></tr>';

      // Ensure we have the latest password from session
      const pwd = password || sessionStorage.getItem('adminPassword');
      if (!pwd) {
        throw new Error('Not authenticated. Please log out and log back in.');
      }

      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Server returned ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to parse logs');
      }

      const logs = data.logs || [];
      document.getElementById('visitor-total').textContent = logs.length;
      
      const uniqueIps = new Set(logs.map(log => log.ip));
      document.getElementById('visitor-unique').textContent = uniqueIps.size;

      if (logs.length === 0) {
        rowsContainer.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">No visits recorded yet.</td></tr>';
        return;
      }

      rowsContainer.innerHTML = logs.map(log => {
        const date = new Date(log.timestamp).toLocaleString();
        
        // Simple human-friendly parser for common OS / Browser from User Agent
        let client = 'Unknown Client';
        const ua = log.userAgent || '';
        if (ua.includes('Windows')) client = 'Windows';
        else if (ua.includes('Macintosh')) client = 'macOS';
        else if (ua.includes('iPhone') || ua.includes('iPad')) client = 'iOS Device';
        else if (ua.includes('Android')) client = 'Android Device';
        else if (ua.includes('Linux')) client = 'Linux';
        
        if (ua.includes('Chrome')) client += ' • Chrome';
        else if (ua.includes('Safari')) client += ' • Safari';
        else if (ua.includes('Firefox')) client += ' • Firefox';
        else if (ua.includes('Edge')) client += ' • Edge';

        return `
          <tr style="border-bottom: 1px solid var(--card-border);">
            <td style="padding: 1rem; font-family: monospace; color: var(--accent); font-weight: 500;">${log.ip}</td>
            <td style="padding: 1rem;"><span style="background: rgba(212,168,67,0.1); color: #d4a843; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">${log.page}</span></td>
            <td style="padding: 1rem; color: var(--text-muted); font-size: 0.85rem;">${date}</td>
            <td style="padding: 1rem; color: var(--text-muted); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${ua}">${client}</td>
          </tr>
        `;
      }).join('');

    } catch(e) {
      showToast("Failed to fetch visitors logs", true);
      document.getElementById('visitor-log-rows').innerHTML = `<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--accent-danger);">Error: ${e.message}</td></tr>`;
    }
  }

  init();

  return { addRole, removeRole, togglePin, addSkillCategory, deleteSkillCat, addExperience, deleteExp, loadVisitors };
})();
