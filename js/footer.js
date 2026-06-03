const FooterComponent = {
  render() {
    const year = new Date().getFullYear();
    return `
    <footer class="site-footer" id="site-footer">
      <div class="footer-wave">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="var(--footer-bg)"/>
        </svg>
      </div>
      <div class="footer-body">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="footer-logo">
              <span class="logo-icon">💰</span>
              <span class="logo-text">Bonus<span class="logo-accent">Tax</span>Calc</span>
            </div>
            <p class="footer-tagline">The smartest way to estimate your bonus tax withholding and maximize your take-home pay.</p>            
          </div>
          <div class="footer-links">
            <h4>Calculator</h4>
            <ul>
              <li><a href="/#calculator">Bonus Tax Calculator</a></li>
              <li><a href="/#calculator">Salary + Bonus Calculator</a></li>
              <li><a href="/#calculator">After-Tax Bonus Estimator</a></li>
              <li><a href="/#calculator">Payroll Calculator</a></li>
            </ul>
          </div>
          <div class="footer-links">
            <h4>Resources</h4>
            <ul>
              <li><a href="/#how-it-works">How It Works</a></li>
              <li><a href="/#tax-rates">2024 Bonus Tax Rates</a></li>
              <li><a href="/#faq">FAQ</a></li>
              <li><a href="/#methods">Withholding Methods</a></li>
            </ul>
          </div>
          <div class="footer-links">
            <h4>Legal</h4>
            <ul>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Use</a></li>
              <li><a href="/disclaimer">Disclaimer</a></li>
              <li><a href="/cookies">Cookies Policy</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; ${year} BonusTaxCalc. All rights reserved. Results are estimates only — consult a tax professional for personalized advice.</p>
          <p class="footer-url">bonustaxcalculator.github.io</p>
        </div>
      </div>
    </footer>
    `;
  },
  init() {
    document.querySelectorAll('.site-footer a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.length > 1) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const placeholder = document.getElementById('footer-placeholder');
  if (placeholder) {
    placeholder.outerHTML = FooterComponent.render();
    FooterComponent.init();
  }
});
