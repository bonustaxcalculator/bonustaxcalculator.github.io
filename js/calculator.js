// ---- Bonus Tax Calculator Core Logic ----

const TAX_BRACKETS_2024 = [
  { min: 0,       max: 11600,    rate: 0.10, label: '10%' },
  { min: 11600,   max: 47150,    rate: 0.12, label: '12%' },
  { min: 47150,   max: 100525,   rate: 0.22, label: '22%' },
  { min: 100525,  max: 191950,   rate: 0.24, label: '24%' },
  { min: 191950,  max: 243725,   rate: 0.32, label: '32%' },
  { min: 243725,  max: 609350,   rate: 0.35, label: '35%' },
  { min: 609350,  max: Infinity, rate: 0.37, label: '37%' },
];

const MFJ_BRACKETS_2024 = [
  { min: 0,       max: 23200,    rate: 0.10, label: '10%' },
  { min: 23200,   max: 94300,    rate: 0.12, label: '12%' },
  { min: 94300,   max: 201050,   rate: 0.22, label: '22%' },
  { min: 201050,  max: 383900,   rate: 0.24, label: '24%' },
  { min: 383900,  max: 487450,   rate: 0.32, label: '32%' },
  { min: 487450,  max: 731200,   rate: 0.35, label: '35%' },
  { min: 731200,  max: Infinity, rate: 0.37, label: '37%' },
];

const SS_WAGE_BASE = 160200;
const SS_RATE = 0.062;
const MEDICARE_RATE = 0.0145;
const ADD_MEDICARE_RATE = 0.009;
const ADD_MEDICARE_THRESHOLD = 200000;
const FLAT_BONUS_RATE = 0.22;

function calcFederalTax(income, brackets) {
  let tax = 0;
  for (const bracket of brackets) {
    if (income <= bracket.min) break;
    const taxable = Math.min(income, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
  }
  return tax;
}

function getMarginalRate(income, brackets) {
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (income > brackets[i].min) return brackets[i].rate;
  }
  return brackets[0].rate;
}

function calcFICA(salary, bonus) {
  const totalWages = salary + bonus;
  const ssTaxable = Math.max(0, Math.min(totalWages, SS_WAGE_BASE) - Math.min(salary, SS_WAGE_BASE));
  const ssTax = ssTaxable * SS_RATE;
  const medicareTax = bonus * MEDICARE_RATE;
  const addlMedicare = totalWages > ADD_MEDICARE_THRESHOLD
    ? Math.max(0, Math.min(totalWages, totalWages) - ADD_MEDICARE_THRESHOLD) * ADD_MEDICARE_RATE - Math.max(0, salary - ADD_MEDICARE_THRESHOLD) * ADD_MEDICARE_RATE
    : 0;
  return { ssTax: Math.max(0, ssTax), medicareTax, addlMedicare: Math.max(0, addlMedicare) };
}

function calcStateWithholding(bonus, stateRate) {
  return bonus * stateRate;
}

function calculateBonus({ salary, bonus, filingStatus, stateRate, method, payPeriod, allowances }) {
  const brackets = filingStatus === 'mfj' ? MFJ_BRACKETS_2024 : TAX_BRACKETS_2024;

  // Annualize salary
  const periodMap = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12, annual: 1 };
  const annualSalary = salary * (periodMap[payPeriod] || 1);

  let federalTax = 0;
  let marginalRate = 0;
  let effectiveBonusFedRate = 0;

  if (method === 'flat') {
    // Flat 22% supplemental rate
    federalTax = bonus * FLAT_BONUS_RATE;
    effectiveBonusFedRate = FLAT_BONUS_RATE;
    marginalRate = getMarginalRate(annualSalary, brackets);
  } else {
    // Aggregate method
    const taxWithBonus = calcFederalTax(annualSalary + bonus, brackets);
    const taxWithoutBonus = calcFederalTax(annualSalary, brackets);
    federalTax = Math.max(0, taxWithBonus - taxWithoutBonus);
    marginalRate = getMarginalRate(annualSalary + bonus, brackets);
    effectiveBonusFedRate = bonus > 0 ? federalTax / bonus : 0;
  }

  const fica = calcFICA(annualSalary, bonus);
  const stateTax = calcStateWithholding(bonus, stateRate);

  const totalTax = federalTax + fica.ssTax + fica.medicareTax + fica.addlMedicare + stateTax;
  const netBonus = bonus - totalTax;
  const effectiveTotalRate = bonus > 0 ? totalTax / bonus : 0;

  return {
    grossBonus: bonus,
    federalTax,
    ssTax: fica.ssTax,
    medicareTax: fica.medicareTax,
    addlMedicare: fica.addlMedicare,
    stateTax,
    totalTax,
    netBonus,
    marginalRate,
    effectiveBonusFedRate,
    effectiveTotalRate,
    annualSalary,
  };
}

// ---- UI Controller ----

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}
function fmtPct(n) {
  return (n * 100).toFixed(2) + '%';
}

function animateValue(element, start, end, duration, isCurrency = true) {
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (end - start) * eased;
    element.textContent = isCurrency ? fmt(current) : fmtPct(current);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function renderDonut(result) {
  const canvas = document.getElementById('donut-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = canvas.offsetWidth;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.scale(dpr, dpr);

  const segments = [
    { value: result.netBonus, color: '#22c55e', label: 'Net Bonus' },
    { value: result.federalTax, color: '#f97316', label: 'Federal Tax' },
    { value: result.stateTax, color: '#8b5cf6', label: 'State Tax' },
    { value: result.ssTax + result.medicareTax + result.addlMedicare, color: '#06b6d4', label: 'FICA' },
  ].filter(s => s.value > 0);

  const total = segments.reduce((a, s) => a + s.value, 0);
  if (total === 0) return;

  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.26;
  let startAngle = -Math.PI / 2;
  const gap = 0.03;

  segments.forEach(seg => {
    const slice = (seg.value / total) * (Math.PI * 2) - gap;
    ctx.beginPath();
    ctx.moveTo(cx + innerR * Math.cos(startAngle + gap / 2), cy + innerR * Math.sin(startAngle + gap / 2));
    ctx.arc(cx, cy, outerR, startAngle + gap / 2, startAngle + slice);
    ctx.arc(cx, cy, innerR, startAngle + slice, startAngle + gap / 2, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    startAngle += slice + gap;
  });

  // Center text
  ctx.fillStyle = '#1e293b';
  ctx.font = `bold ${size * 0.1}px 'DM Sans', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(fmtPct(result.effectiveTotalRate), cx, cy - size * 0.04);
  ctx.font = `${size * 0.065}px 'DM Sans', sans-serif`;
  ctx.fillStyle = '#64748b';
  ctx.fillText('Tax Rate', cx, cy + size * 0.06);
}

function updateResults(result) {
  const fields = {
    'res-gross':    { val: result.grossBonus, prev: 0 },
    'res-federal':  { val: result.federalTax, prev: 0 },
    'res-social':   { val: result.ssTax, prev: 0 },
    'res-medicare': { val: result.medicareTax + result.addlMedicare, prev: 0 },
    'res-state':    { val: result.stateTax, prev: 0 },
    'res-total-tax':{ val: result.totalTax, prev: 0 },
    'res-net':      { val: result.netBonus, prev: 0 },
  };

  Object.entries(fields).forEach(([id, { val }]) => {
    const el = document.getElementById(id);
    if (el) animateValue(el, 0, val, 800);
  });

  const effEl = document.getElementById('res-effective');
  if (effEl) animateValue(effEl, 0, result.effectiveTotalRate, 800, false);

  const margEl = document.getElementById('res-marginal');
  if (margEl) margEl.textContent = fmtPct(result.marginalRate);

  // Progress bars
  const bars = {
    'bar-federal': result.federalTax / result.grossBonus,
    'bar-state': result.stateTax / result.grossBonus,
    'bar-fica': (result.ssTax + result.medicareTax + result.addlMedicare) / result.grossBonus,
    'bar-net': result.netBonus / result.grossBonus,
  };
  Object.entries(bars).forEach(([id, pct]) => {
    const el = document.getElementById(id);
    if (el) {
      setTimeout(() => {
        el.style.width = Math.max(0, Math.min(100, pct * 100)) + '%';
      }, 100);
    }
  });

  // Donut chart
  setTimeout(() => renderDonut(result), 150);

  // Show results section
  const resultsSection = document.getElementById('results-panel');
  if (resultsSection) {
    resultsSection.classList.add('visible');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function initCalculator() {
  const form = document.getElementById('calc-form');
  if (!form) return;

  const methodRadios = form.querySelectorAll('input[name="method"]');
  methodRadios.forEach(r => {
    r.addEventListener('change', () => {
      const flatNote = document.getElementById('flat-note');
      const aggNote = document.getElementById('agg-note');
      if (flatNote) flatNote.style.display = r.value === 'flat' && r.checked ? 'block' : 'none';
      if (aggNote) aggNote.style.display = r.value === 'aggregate' && r.checked ? 'block' : 'none';
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);

    const salary = parseFloat(String(data.get('salary')).replace(/,/g, '')) || 0;
    const bonus = parseFloat(String(data.get('bonus')).replace(/,/g, '')) || 0;
    const filingStatus = data.get('filing_status') || 'single';
    const stateRate = parseFloat(data.get('state_rate')) / 100 || 0;
    const method = data.get('method') || 'flat';
    const payPeriod = data.get('pay_period') || 'annual';

    if (bonus <= 0) {
      showError('Please enter a valid bonus amount.');
      return;
    }

    const result = calculateBonus({ salary, bonus, filingStatus, stateRate, method, payPeriod });
    updateResults(result);

    const btn = form.querySelector('.calc-submit');
    if (btn) {
      btn.textContent = '✓ Updated!';
      btn.classList.add('success');
      setTimeout(() => { btn.textContent = 'Calculate My Bonus Tax'; btn.classList.remove('success'); }, 2000);
    }
  });

  // Currency formatting on inputs
  ['salary', 'bonus'].forEach(name => {
    const input = form.querySelector(`[name="${name}"]`);
    if (!input) return;
    input.addEventListener('blur', () => {
      const val = parseFloat(input.value.replace(/,/g, ''));
      if (!isNaN(val)) input.value = val.toLocaleString('en-US');
    });
    input.addEventListener('focus', () => {
      input.value = input.value.replace(/,/g, '');
    });
  });
}

function showError(msg) {
  let err = document.getElementById('calc-error');
  if (!err) {
    err = document.createElement('div');
    err.id = 'calc-error';
    err.className = 'calc-error';
    document.getElementById('calc-form').prepend(err);
  }
  err.textContent = msg;
  err.style.display = 'block';
  setTimeout(() => { err.style.display = 'none'; }, 3000);
}

// ---- Animations & Scroll ----
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// ---- Counter animation for stats ----
function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      let start = 0;
      const duration = 1800;
      const startTime = performance.now();
      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (target - start) * eased;
        el.textContent = prefix + (Number.isInteger(target) ? Math.round(current).toLocaleString() : current.toFixed(1)) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => obs.observe(el));
}

// ---- FAQ Accordion ----
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!question || !answer) return;
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-answer').style.maxHeight = '0';
      });
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

// ---- Tab switcher ----
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.tab-group');
      const target = btn.dataset.tab;
      group.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      group.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = group.querySelector(`.tab-pane[data-pane="${target}"]`);
      if (pane) pane.classList.add('active');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCalculator();
  initScrollAnimations();
  initCounters();
  initFAQ();
  initTabs();
});
