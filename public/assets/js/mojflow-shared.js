(() => {
  'use strict';
  const en = () => document.documentElement.lang === 'en';
  const say = (sr, english) => en() ? english : sr;
  let consent = null;
  try { consent = localStorage.getItem('mf-consent'); } catch (_) {}
  let analyticsStarted = false;
  const gaId = 'G-YW60B68CQK';
  function loadAnalytics() {
    if (consent !== 'granted') return;
    window['ga-disable-' + gaId] = false;
    if (analyticsStarted) return;
    analyticsStarted = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', gaId, {send_page_view:false, allow_google_signals:false, allow_ad_personalization_signals:false});
    window.gtag('event', 'page_view', {page_location:location.origin + location.pathname, page_title:document.title, page_referrer:''});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaId;
    document.head.append(script);
  }
  window.mfTrack = (event) => {
    if (!['generate_lead','job_application_submit','demo_complete'].includes(event) || consent !== 'granted') return;
    try { loadAnalytics(); window.gtag('event', event, {page_location:location.origin + location.pathname, page_referrer:'', form_id:event === 'job_application_submit' ? 'careers' : event === 'demo_complete' ? 'workflow_demo' : 'contact'}); } catch (_) {}
  };
  const banner = document.createElement('div');
  banner.className = 'mf-shared-consent';
  banner.setAttribute('role','region');
  banner.setAttribute('aria-label','Analitika / Analytics');
  banner.innerHTML = `<p>${say('Uz vašu saglasnost merimo posete i uspešne upite. Ime, mejl i poruku ne šaljemo analitici.','With your consent we measure visits and successful inquiries. Names, emails and messages are not sent to analytics.')} <a href="/privacy">${say('Privatnost','Privacy')}</a></p><div><button type="button" data-choice="granted">${say('Prihvati','Accept')}</button><button type="button" data-choice="denied">${say('Odbij','Reject')}</button></div>`;
  banner.hidden = consent === 'granted' || consent === 'denied';
  document.body.append(banner);
  banner.addEventListener('click', e => {
    const button = e.target.closest('[data-choice]');
    if (!button) return;
    consent = button.dataset.choice;
    try { localStorage.setItem('mf-consent',consent); } catch (_) {}
    banner.hidden = true;
    if (consent === 'granted') loadAnalytics();
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-reset-consent]')) return;
    consent = null;
    window['ga-disable-' + gaId] = true;
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      const expired = name + '=; Max-Age=0; Path=/; SameSite=Lax';
      document.cookie = expired;
      document.cookie = expired + '; Domain=' + location.hostname;
      if (location.hostname.endsWith('.mojflow.com')) document.cookie = expired + '; Domain=mojflow.com';
    });
    try { localStorage.removeItem('mf-consent'); } catch (_) {}
    banner.hidden = false;
  });
  window.addEventListener('storage', e => {
    if (e.key !== 'mf-consent') return;
    consent = e.newValue;
    window['ga-disable-' + gaId] = consent !== 'granted';
    banner.hidden = consent === 'granted' || consent === 'denied';
    if (consent === 'granted') loadAnalytics();
  });
  loadAnalytics();

  const dialog = document.createElement('dialog');
  dialog.id = 'mf-shared-contact';
  dialog.className = 'mf-shared-dialog';
  dialog.setAttribute('data-lenis-prevent','');
  dialog.setAttribute('aria-labelledby','mf-shared-title');
  dialog.innerHTML = `<button type="button" class="mf-shared-close" aria-label="${say('Zatvori','Close')}">×</button><p class="mf-shared-eyebrow">MojFlow / ${say('Razgovor o projektu','Project inquiry')}</p><h2 id="mf-shared-title"></h2><p>${say('Opišite proces i alate koje koristite. Javljamo se sa sledećim korakom.','Describe your process and tools. We will reply with the next step.')}</p><form id="mf-shared-form"><div class="mf-shared-row"><label>${say('Ime','Name')}<input name="name" autocomplete="name" maxlength="120" required></label><label>Email<input name="email" type="email" autocomplete="email" maxlength="254" required></label></div><label>${say('Kompanija (opciono)','Company (optional)')}<input name="company" autocomplete="organization" maxlength="160"></label><label>${say('Tema','Topic')}<select name="topic"><option value="ai">AI / ${say('automatizacija','automation')}</option><option value="ai-assistant">Chatbot / RAG</option><option value="web">Web</option><option value="mobile">${say('Mobilna aplikacija','Mobile app')}</option><option value="other">${say('Drugo','Other')}</option></select></label><label>${say('Poruka','Message')}<textarea name="message" rows="5" maxlength="6000" required></textarea></label><div class="mf-shared-trap" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div><p role="status" aria-live="polite" id="mf-shared-status"></p><button class="mf-shared-submit" type="submit">${say('Pošalji upit','Send inquiry')}</button><p class="mf-shared-note">${say('Šalje se na contact@mojflow.com.','Sent to contact@mojflow.com.')} <a href="/privacy">${say('Obrada podataka','Privacy policy')}</a></p></form>`;
  document.body.append(dialog);
  const form = dialog.querySelector('form');
  const status = dialog.querySelector('[role=status]');
  const submit = dialog.querySelector('[type=submit]');
  let opener, position = '', sending = false;
  const roles = {j1:'Sales Development Representative (SDR)',j2:'Account Executive',j3:'AI Engineer'};
  const translations = [
    ['Uz vašu saglasnost merimo posete i uspešne upite. Ime, mejl i poruku ne šaljemo analitici.','With your consent we measure visits and successful inquiries. Names, emails and messages are not sent to analytics.'],
    ['Privatnost','Privacy'],['Prihvati','Accept'],['Odbij','Reject'],['MojFlow / Razgovor o projektu','MojFlow / Project inquiry'],
    ['Opišite proces i alate koje koristite. Javljamo se sa sledećim korakom.','Describe your process and tools. We will reply with the next step.'],
    ['Ime','Name'],['Kompanija (opciono)','Company (optional)'],['Tema','Topic'],['Poruka','Message'],['AI / automatizacija','AI / automation'],
    ['Mobilna aplikacija','Mobile app'],['Drugo','Other'],['Šalje se na contact@mojflow.com.','Sent to contact@mojflow.com.'],['Obrada podataka','Privacy policy']
  ];
  new MutationObserver(() => {
    [banner,dialog].forEach(root => {
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      let node;
      while((node=walker.nextNode())) {
        const pair=translations.find(pair=>pair.includes(node.textContent.trim()));
        if(pair) node.textContent=node.textContent.replace(node.textContent.trim(),say(...pair));
      }
    });
    dialog.querySelector('.mf-shared-close').setAttribute('aria-label',say('Zatvori','Close'));
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  function close() { if (sending) return; dialog.close(); }
  dialog.querySelector('.mf-shared-close').addEventListener('click', close);
  dialog.addEventListener('cancel', e => { if (sending) e.preventDefault(); });
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) close(); } });
  dialog.addEventListener('close', () => { document.body.classList.remove('mf-contact-open'); if(opener && opener.isConnected) opener.focus(); });
  function open(trigger, params = new URLSearchParams()) {
    if (dialog.open) return;
    opener = trigger;
    position = trigger?.getAttribute('data-mf-apply') || params.get('position') || '';
    if (!roles[position]) position = '';
    status.textContent = '';
    dialog.querySelector('h2').textContent = position ? say('Prijava: ','Apply: ') + roles[position] : say('Ispričajte nam šta gradite.','Tell us what you are building.');
    dialog.querySelector('h2 + p').textContent = position ? say('Predstavite svoje iskustvo i dodajte link ka CV-u ili portfoliju.','Tell us about your experience and include a link to your CV or portfolio.') : say('Opišite proces i alate koje koristite. Javljamo se sa sledećim korakom.','Describe your process and tools. We will reply with the next step.');
    form.elements.company.closest('label').hidden = !!position;
    form.elements.topic.closest('label').hidden = !!position;
    submit.textContent = position ? say('Pošalji prijavu','Send application') : say('Pošalji upit','Send inquiry');
    if (!form.elements.message.value) form.elements.message.value = (params.get('body') || trigger?.dataset.message || '').slice(0,6000);
    if (params.get('topic') && [...form.elements.topic.options].some(o=>o.value===params.get('topic'))) form.elements.topic.value=params.get('topic');
    document.body.classList.add('mf-contact-open');
    dialog.showModal();
    form.elements.name.focus();
  }
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-mf-contact],[data-mf-apply],a[href^="/kontakt"],a[href^="mailto:contact@mojflow.com"],a[href^="mailto:careers@mojflow.com"]');
    if (!trigger || trigger.hasAttribute('data-email-fallback') || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const href=trigger.getAttribute('href') || '';
    open(trigger, new URLSearchParams(href.includes('?') ? href.slice(href.indexOf('?')+1) : ''));
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (sending || !form.reportValidity()) return;
    sending = true;
    submit.disabled = true;
    const label = submit.textContent;
    submit.textContent = say('Šaljem…','Sending…');
    status.textContent = '';
    const payload=Object.fromEntries(new FormData(form));
    payload.position=position || undefined;
    if(position) {payload.company='';payload.topic='Prijava za posao';}
    payload.source=location.pathname;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),25000);
    try {
      const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      const result=await response.json();
      if(!response.ok || result.ok!==true) throw new Error('send');
      status.textContent=say('Poruka je poslata. Hvala, javićemo vam se mejlom.','Message sent. Thank you, we will reply by email.');
      window.mfTrack(position ? 'job_application_submit' : 'generate_lead');
      form.reset();
    } catch (_) {
      status.textContent=say('Slanje nije potvrđeno. Tekst je sačuvan u formi. Pokušajte ponovo ili pišite na contact@mojflow.com.','Sending was not confirmed. Your text is preserved. Retry or email contact@mojflow.com.');
    } finally { clearTimeout(timeout); sending=false; submit.disabled=false; submit.textContent=label; }
  });
  if(location.pathname==='/kontakt') open(null,new URLSearchParams(location.search));
})();
