const HeaderComponent = {
  render() {
    return `
    <header class="site-header" id="site-header">
      <div class="header-inner">
        <a href="/" class="logo" aria-label="Bonus Tax Calculator Home">
          <span class="logo-icon">💰</span>
          <span class="logo-text">Bonus<span class="logo-accent">Tax</span>Calc</span>
        </a>
        <nav class="main-nav" id="main-nav" aria-label="Main Navigation">
          <ul class="nav-list">
            <li><a href="/#calculator" class="nav-link">Calculator</a></li>
            <li><a href="/#how-it-works" class="nav-link">How It Works</a></li>
            <li><a href="/#tax-rates" class="nav-link">Tax Rates</a></li>
            <li><a href="/#faq" class="nav-link">FAQ</a></li>
            <li><a href="/#calculator" class="nav-cta">Calculate Now</a></li>
          </ul>
        </nav>
        <button class="hamburger" id="hamburger" aria-label="Toggle navigation" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
    `;
  },
  init() {
    const header = document.getElementById('site-header');
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('main-nav');

    // Sticky + scroll effect
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

    // Mobile hamburger toggle
    hamburger.addEventListener('click', () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
      hamburger.classList.toggle('active');
      nav.classList.toggle('open');
    });

    // Smooth scroll for nav links
    document.querySelectorAll('.nav-link, .nav-cta').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          nav.classList.remove('open');
          hamburger.classList.remove('active');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Active nav highlight on scroll
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
          const activeLink = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
          if (activeLink) activeLink.classList.add('active');
        }
      });
    }, { threshold: 0.4 });
    sections.forEach(s => observer.observe(s));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const placeholder = document.getElementById('header-placeholder');
  if (placeholder) {
    placeholder.outerHTML = HeaderComponent.render();
    HeaderComponent.init();
  }
});
