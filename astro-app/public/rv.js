/**
 * rv.js — Resume Vault Shared JS Library
 * Covers all interactive behaviors across 5 themes / 11 page types.
 * No external dependencies except optional Plotly.js for charts.
 *
 * Exports on window.RV for use in Astro page <script> blocks.
 * Usage: RV.modal.open('id') / RV.accordion.init() / RV.filter.init() etc.
 */

(function (w) {
  'use strict';

  /* ── helpers ── */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const off = (el, ev, fn) => el && el.removeEventListener(ev, fn);
  const cls = (el) => el && el.classList;

  /* ══════════════════════════════════════════
     1. MODAL — two variants
        QG style: scale-fade on inner panel
        PP/CD/HC/DN: slide-up sheet
     ══════════════════════════════════════════ */
  const modal = {
    /* QG scale-fade modal
       Expects: wrapper with id, inner panel with .max-w-4xl or .max-w-5xl */
    open(id) {
      const wrap = document.getElementById(id);
      if (!wrap) return;
      wrap.classList.remove('i1h');
      cls(document.body).add('i0');
      void wrap.offsetWidth; // force reflow
      const panel = wrap.querySelector('[class*="max-w-"]') || wrap.querySelector('.i4');
      if (panel) {
        panel.classList.remove('i4c');
        panel.classList.add('i4o');
      }
    },

    close(id) {
      const wrap = document.getElementById(id);
      if (!wrap) return;
      const panel = wrap.querySelector('[class*="max-w-"]') || wrap.querySelector('.i4');
      if (panel) {
        panel.classList.remove('i4o');
        panel.classList.add('i4c');
      }
      setTimeout(() => {
        wrap.classList.add('i1h');
        cls(document.body).remove('i0');
        if (panel) panel.classList.remove('i4c');
      }, 320);
    },

    /* Slide-up sheet modal (PP / CD / HC / DN)
       Expects: wrapper id, inner .i3 panel */
    slideOpen(id) {
      const wrap = document.getElementById(id);
      if (!wrap) return;
      wrap.classList.remove('hidden');
      cls(document.body).add('i0');
      const bg = wrap.querySelector('.i2');
      const panel = wrap.querySelector('.i3');
      requestAnimationFrame(() => {
        if (bg) { bg.style.opacity = '0'; requestAnimationFrame(() => { bg.style.opacity = '1'; }); }
        if (panel) panel.classList.add('i3o');
      });
    },

    slideClose(id) {
      const wrap = document.getElementById(id);
      if (!wrap) return;
      const bg = wrap.querySelector('.i2');
      const panel = wrap.querySelector('.i3');
      if (bg) bg.style.opacity = '0';
      if (panel) panel.classList.remove('i3o');
      setTimeout(() => {
        wrap.classList.add('hidden');
        cls(document.body).remove('i0');
      }, 500);
    },

    /* CD overlay drawer */
    drawerOpen(id) {
      const el = document.getElementById(id) || $('.i5');
      if (!el) return;
      el.classList.add('i5o');
      cls(document.body).add('i0');
    },

    drawerClose(id) {
      const el = id ? document.getElementById(id) : $('.i5');
      if (!el) return;
      el.classList.remove('i5o');
      cls(document.body).remove('i0');
    },

    /* auto-bind: close on backdrop click, Escape key */
    bindBackdrop(id, closeFn) {
      const wrap = document.getElementById(id);
      if (!wrap) return;
      on(wrap, 'click', (e) => { if (e.target === wrap || cls(e.target).contains('i2')) closeFn(id); });
    },

    init() {
      on(document, 'keydown', (e) => {
        if (e.key !== 'Escape') return;
        // close any open modal
        $$('.i1:not(.i1h), [data-modal]:not(.hidden)').forEach(el => {
          const id = el.id;
          if (id) this.close(id);
        });
        $$('.i5.i5o').forEach(el => this.drawerClose(el.id));
      });
    }
  };

  /* ══════════════════════════════════════════
     2. ACCORDION / FAQ
     Expects: .ac-item wrappers, .ac-btn toggles, .j1 content panels, .j2 icons
     ══════════════════════════════════════════ */
  const accordion = {
    toggle(btn) {
      const item = btn.closest('[data-ac]') || btn.closest('.ac-item');
      if (!item) return;
      const isOpen = item.dataset.open === 'true';
      const content = item.querySelector('.j1');
      const icon = item.querySelector('.j2');
      // close siblings if single-open
      const parent = item.parentElement;
      if (parent && parent.dataset.acSingle) {
        $$('[data-ac],[data-open]', parent).forEach(sib => {
          if (sib !== item) {
            sib.dataset.open = 'false';
            const sc = sib.querySelector('.j1');
            const si = sib.querySelector('.j2');
            if (sc) sc.classList.remove('j1o');
            if (si) si.classList.remove('j2o');
          }
        });
      }
      item.dataset.open = isOpen ? 'false' : 'true';
      if (content) content.classList.toggle('j1o', !isOpen);
      if (icon) icon.classList.toggle('j2o', !isOpen);
    },

    init(ctx) {
      $$('[data-ac-btn]', ctx).forEach(btn => {
        on(btn, 'click', () => this.toggle(btn));
      });
    }
  };

  /* ══════════════════════════════════════════
     3. FILTER PILLS
     Expects: .k1 buttons with data-filter value,
              filterable items with data-cat attribute
     ══════════════════════════════════════════ */
  const filter = {
    init(pillsSelector, itemsSelector, activeClass) {
      const ac = activeClass || 'k1a';
      const pills = $$(pillsSelector || '[data-filter]');
      const items = $$(itemsSelector || '[data-cat]');

      pills.forEach(pill => {
        on(pill, 'click', () => {
          pills.forEach(p => p.classList.remove(ac));
          pill.classList.add(ac);
          const val = pill.dataset.filter;
          items.forEach(item => {
            const show = val === 'all' || item.dataset.cat === val || (item.dataset.cat || '').split(' ').includes(val);
            item.style.display = show ? '' : 'none';
          });
        });
      });
    }
  };

  /* ══════════════════════════════════════════
     4. MOBILE NAV
     Expects: [data-nav-toggle] button, [data-nav-menu] drawer
     ══════════════════════════════════════════ */
  const nav = {
    init() {
      const toggle = $('[data-nav-toggle]');
      const menu = $('[data-nav-menu]');
      if (!toggle || !menu) return;
      on(toggle, 'click', () => {
        const open = menu.style.display === 'flex';
        menu.style.display = open ? 'none' : 'flex';
        toggle.setAttribute('aria-expanded', String(!open));
      });
    }
  };

  /* ══════════════════════════════════════════
     5. CHARTS (Plotly wrapper)
     Call RV.chart.plot(id, data, layout, config)
     or use preset helpers.
     ══════════════════════════════════════════ */
  const chart = {
    /* Base layout defaults shared across all themes */
    baseLayout(theme) {
      const t = theme || document.documentElement.dataset.theme || 'qg';
      const themes = {
        qg: { grid: 'rgba(229,231,235,.5)', tick: '#6B7280', font: 'Inter, sans-serif' },
        cd: { grid: '#e7e7e7', tick: '#888888', font: 'monospace' },
        pp: { grid: 'rgba(75,85,99,.1)', tick: '#4B5563', font: 'Inter, sans-serif' },
        dn: { grid: '#E5E5E5', tick: '#6B7280', font: 'JetBrains Mono, monospace' },
        hc: { grid: 'rgba(255,255,255,.1)', tick: '#94A3B8', font: 'Inter, sans-serif' }
      };
      const c = themes[t] || themes.qg;
      return {
        margin: { t: 20, r: 20, b: 40, l: 40 },
        plot_bgcolor: 'transparent',
        paper_bgcolor: 'transparent',
        showlegend: false,
        font: { family: c.font },
        xaxis: { showgrid: false, tickfont: { color: c.tick, family: c.font }, zeroline: false },
        yaxis: { showgrid: true, gridcolor: c.grid, tickfont: { color: c.tick, family: c.font }, zeroline: false },
        hovermode: 'x unified'
      };
    },

    baseConfig() {
      return { responsive: true, displayModeBar: false, displaylogo: false };
    },

    /* Line/area chart preset */
    line(id, xData, yData, color, opts) {
      if (!w.Plotly || !document.getElementById(id)) return;
      const o = opts || {};
      const trace = {
        x: xData, y: yData,
        type: 'scatter', mode: 'lines',
        fill: o.fill !== false ? 'tozeroy' : 'none',
        line: { color: color, width: o.width || 3, shape: 'spline', smoothing: 1.3 },
        fillcolor: color.startsWith('#') ? color + '1a' : color.replace(')', ', 0.1)').replace('rgb', 'rgba')
      };
      const layout = Object.assign(this.baseLayout(), o.layout || {});
      w.Plotly.newPlot(id, [trace], layout, this.baseConfig());
    },

    /* Multi-line chart */
    multiLine(id, traces, opts) {
      if (!w.Plotly || !document.getElementById(id)) return;
      const layout = Object.assign(this.baseLayout(), (opts || {}).layout || {});
      w.Plotly.newPlot(id, traces, layout, this.baseConfig());
    },

    /* Bar chart preset */
    bar(id, xData, yData, color, opts) {
      if (!w.Plotly || !document.getElementById(id)) return;
      const o = opts || {};
      const trace = { type: 'bar', x: xData, y: yData, marker: { color: color } };
      const layout = Object.assign(this.baseLayout(), o.layout || {});
      w.Plotly.newPlot(id, [trace], layout, this.baseConfig());
    },

    /* Generic raw plot */
    plot(id, data, layout, cfg) {
      if (!w.Plotly || !document.getElementById(id)) return;
      const l = Object.assign(this.baseLayout(), layout || {});
      w.Plotly.newPlot(id, data, l, cfg || this.baseConfig());
    },

    /* Defer until Plotly loads (CDN async) */
    defer(fn) {
      if (w.Plotly) { fn(); return; }
      w.addEventListener('load', fn);
      setTimeout(fn, 1200);
    }
  };

  /* ══════════════════════════════════════════
     6. MARQUEE — pause on hover (CSS handles loop)
     ══════════════════════════════════════════ */
  const marquee = {
    init() {
      $$('.n2').forEach(el => {
        on(el, 'mouseenter', () => { el.style.animationPlayState = 'paused'; });
        on(el, 'mouseleave', () => { el.style.animationPlayState = 'running'; });
      });
    }
  };

  /* ══════════════════════════════════════════
     7. SMOOTH SCROLL for anchor links
     ══════════════════════════════════════════ */
  const smooth = {
    init() {
      on(document, 'click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const target = document.getElementById(a.getAttribute('href').slice(1));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  /* ══════════════════════════════════════════
     8. INTERSECTION OBSERVER — fade in on scroll
     Adds .o2 (fade-in-up animation) when element enters viewport.
     Mark elements with data-reveal attribute.
     ══════════════════════════════════════════ */
  const reveal = {
    init() {
      if (!w.IntersectionObserver) return;
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('o2');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      $$('[data-reveal]').forEach(el => {
        el.style.opacity = '0';
        obs.observe(el);
      });
    }
  };

  /* ══════════════════════════════════════════
     9. COPY TO CLIPBOARD (contact pages)
     ══════════════════════════════════════════ */
  const copy = {
    text(str, btn) {
      navigator.clipboard.writeText(str).then(() => {
        if (!btn) return;
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      });
    },

    init() {
      on(document, 'click', (e) => {
        const btn = e.target.closest('[data-copy]');
        if (!btn) return;
        this.text(btn.dataset.copy, btn);
      });
    }
  };

  /* ══════════════════════════════════════════
     10. FORM — basic validation + submit state
     ══════════════════════════════════════════ */
  const form = {
    init(formEl, onSuccess) {
      if (!formEl) return;
      on(formEl, 'submit', (e) => {
        e.preventDefault();
        const btn = formEl.querySelector('[type="submit"]');
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = 'Sending…';
          btn.disabled = true;
          setTimeout(() => {
            btn.textContent = orig;
            btn.disabled = false;
            if (onSuccess) onSuccess(formEl);
          }, 1500);
        }
      });
    }
  };

  /* ══════════════════════════════════════════
     11. THEME — read from data-theme and apply font links
     ══════════════════════════════════════════ */
  const theme = {
    fonts: {
      qg: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap',
      cd: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
      pp: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap',
      dn: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
      hc: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap'
    },

    load(t) {
      const href = this.fonts[t];
      if (!href || document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    },

    init() {
      const t = document.documentElement.dataset.theme;
      if (t) this.load(t);
    }
  };

  /* ══════════════════════════════════════════
     AUTO-INIT on DOMContentLoaded
     ══════════════════════════════════════════ */
  function autoInit() {
    theme.init();
    modal.init();
    accordion.init();
    nav.init();
    marquee.init();
    smooth.init();
    reveal.init();
    copy.init();
  }

  if (document.readyState === 'loading') {
    on(document, 'DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  /* ── Public API ── */
  w.RV = { modal, accordion, filter, nav, chart, marquee, smooth, reveal, copy, form, theme };

})(window);
