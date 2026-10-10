(function () {
  'use strict';

  // Single place to change where demo requests are sent.
  var CONTACT_EMAIL = 'hello@cliniyo.com';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Year
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();
  var ms = $('#mailShow'); if (ms) ms.textContent = CONTACT_EMAIL;

  // Mobile menu
  var btn = $('#menuBtn'), nav = $('#nav');
  if (btn && nav) {
    var setMenu = function (open) {
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      btn.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
    };
    btn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); btn.focus(); } });
  }

  // Tabs (WAI-ARIA pattern: arrow keys, Home/End)
  $$('[data-tabs]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (panels[j]) panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, k = e.key;
        if (k === 'ArrowRight') { e.preventDefault(); select((i + 1) % n, true); }
        else if (k === 'ArrowLeft') { e.preventDefault(); select((i - 1 + n) % n, true); }
        else if (k === 'Home') { e.preventDefault(); select(0, true); }
        else if (k === 'End') { e.preventDefault(); select(n - 1, true); }
      });
    });
    select(0);
  });

  // Plan buttons pre-fill the message
  $$('[data-plan]').forEach(function (a) {
    a.addEventListener('click', function () {
      var m = $('#f-msg');
      if (m && !m.value.trim()) m.value = 'I’m interested in the ' + a.getAttribute('data-plan') + ' plan.';
    });
  });

  // Demo form: validates, then opens the visitor's email app. Nothing is sent to a server.
  var form = $('#demoForm');
  if (!form) return;
  var status = $('#formStatus');

  function field(id) { return document.getElementById(id); }
  function setBad(input, bad) {
    var wrap = input.closest('.fld') || input.closest('.chk');
    if (wrap) wrap.classList.toggle('bad', bad);
    if (input.type === 'checkbox') return;
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    var err = document.getElementById('e-' + input.id.replace('f-', ''));
    if (err) input.setAttribute('aria-describedby', bad ? err.id : '');
  }
  var rules = {
    'f-name': function (v) { return v.trim().length >= 2; },
    'f-clinic': function (v) { return v.trim().length >= 2; },
    'f-phone': function (v) { var d = v.replace(/[\s\-().]/g, ''); return /^\+?\d{7,15}$/.test(d); },
    'f-email': function (v) { return v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
    'f-type': function (v) { return v !== ''; }
  };
  Object.keys(rules).forEach(function (id) {
    var el = field(id);
    el.addEventListener('blur', function () { setBad(el, !rules[id](el.value)); });
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') setBad(el, !rules[id](el.value)); });
  });

  function show(kind, html) {
    status.className = 'status show ' + kind;
    status.innerHTML = html;
    status.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'status';
    if (field('f-hp').value) return; // honeypot

    var firstBad = null;
    Object.keys(rules).forEach(function (id) {
      var el = field(id), bad = !rules[id](el.value);
      setBad(el, bad);
      if (bad && !firstBad) firstBad = el;
    });
    var consent = field('f-consent');
    $('#c-consent').classList.toggle('bad', !consent.checked);
    if (!consent.checked && !firstBad) firstBad = consent;

    if (firstBad) {
      firstBad.focus();
      show('fail', 'Please check the highlighted fields and try again.');
      return;
    }

    var v = function (id) { return field(id).value.trim(); };
    var lines = [
      'Demo request from the Cliniyo website',
      '',
      'Name: ' + v('f-name'),
      'Clinic: ' + v('f-clinic'),
      'Phone / WhatsApp: ' + v('f-phone'),
      'Email: ' + (v('f-email') || '(not given)'),
      'Clinic type: ' + v('f-type'),
      'Branches: ' + v('f-branches'),
      'Would like: ' + v('f-want'),
      '',
      'Notes: ' + (v('f-msg') || '(none)')
    ];
    var href = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent('Demo request: ' + v('f-clinic')) +
      '&body=' + encodeURIComponent(lines.join('\n'));

    show('ok',
      '<b>Your request is ready.</b> We’re opening your email app now. <b>It is not sent until you press Send there.</b> ' +
      'If nothing opened, <a href="' + href + '">click here</a> or email us at ' + CONTACT_EMAIL + '.');
    window.location.href = href;
  });
})();
