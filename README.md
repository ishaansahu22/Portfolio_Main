# Dynamic Developer Portfolio 🚀

A high-performance, dynamic, and beautifully crafted single-page developer portfolio showcasing full-stack capabilities, ML engineering skills, and real-time GitHub integration. Designed with clean, rich dark-mode aesthetics, custom micro-animations, and an interactive cybersecurity-themed canvas intro.

## ✨ Key Features

- **Interactive Canvas Intro (`Duck vs Viruses`)**: A retro-style cybersecurity scanning game built directly on a HTML5 Canvas, simulating the detection and neutralization of system threats (Trojan, Worm, Ransomware, etc.) before initializing the portfolio.
- **Dynamic Content Architecture**: Content is entirely data-driven, fetched dynamically from a localized `content.json` configuration file, allowing rapid updates without modifying markup.
- **GitHub API Integration**: Real-time fetching of repositories from GitHub, dynamically populating project metrics (stars, primary languages, descriptions) and hiding customized/inactive repositories based on filters.
- **Interactive Particle Mesh Background**: A beautiful neural-network-inspired particle canvas running at 60 FPS in the background of the landing view.
- **Interactive Experience Timeline**: A vertically animated timeline visualizing academic progress, internships, and AV/media achievements with custom SVG graphics.
- **Modern Responsive Design**: Fully responsive, high-contrast dark theme optimized for mobile and desktop screens with custom typographic scales from Google Fonts.

## 🛠️ Technology Stack

- **Core**: Semantic HTML5, Vanilla JavaScript (ES6+), HTML5 Canvas API
- **Styling**: Modern CSS3 (CSS Custom Properties, Flexbox, CSS Grid, Glassmorphism, CSS Transitions/Transforms)
- **Deployment**: Configured for continuous deployment via **Netlify** (`netlify.toml` included) with serverless contact form capabilities.

## 📂 Project Structure

```
├── .git/                  # Git repository configuration
├── assets/                # Local assets (resume, image placeholders)
├── netlify/               # Netlify hosting configurations
├── index.html             # High-performance, SEO-optimized structure
├── styles.css             # Fluid layout and CSS Custom Variable system
├── script.js              # Site bootstrapping, Canvas animations, dynamic API rendering
├── content.json           # Unified data-store for roles, bios, pinned projects, and skills
├── admin.html             # Client-side configuration manager
├── admin.js               # Control logic for portfolio customizer
├── netlify.toml           # Hosting & server-side routing configuration
└── README.md              # Project documentation (You are here!)
```

## 🚀 Local Setup & Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/ishaansahu22/portfolio.git
   cd portfolio
   ```

2. **Run Locally:**
   Since the application fetches resources dynamically via AJAX (`fetch('content.json')`), it is highly recommended to run it using a local development server to bypass CORS policies.
   
   - If using **VS Code**, install the **Live Server** extension, right-click `index.html`, and select *Open with Live Server*.
   - Alternatively, run a quick server using Python:
     ```bash
     python -m http.server 8000
     ```
     Navigate to `http://localhost:8000` in your web browser.

3. **Customizing Portfolio Data:**
   Open `content.json` and customize the profile information, contact handles, skills matrix, and pinned/hidden repositories. Changes will instantly propagate to the live UI.
