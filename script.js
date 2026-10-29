// All editable values live in config.js. This small adapter keeps the display code concise.
const CONFIG = {
  bride: config.brideName,
  groom: config.groomName,
  monogram: config.monogram,
  date: config.weddingDateTime,
  dateDisplay: config.weddingDate,
  dateShort: config.weddingDate,
  venue: config.venueName,
  city: config.city,
  address: config.address,
  dressCode: config.dressCode,
  note: config.note,
  mapsLink: config.googleMapsLink,
  rsvpBy: config.rsvpBy,
  openingKicker: config.openingKicker,
  heroInvitationLine: config.heroInvitationLine,
  closingMessage: config.closingMessage,
  blessingEyebrow: config.blessing?.eyebrow,
  verseArabic: config.blessing?.arabic,
  verseSource: config.blessing?.source,
  verseTranslation: config.blessing?.translation,
};

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

async function sendSubmission(source, submission) {
  const endpoint = (config.submissionEndpoint || '').trim();
  if (!endpoint) throw new Error('missing-endpoint');
  
  let payload;
  if (source === 'rsvp') {
    payload = {
      type: 'rsvp',
      date: new Date().toLocaleDateString(),
      name: submission.guestName,
      attending: submission.attendance.includes('accept') ? 'yes' : 'no',
      guests: submission.attendance.includes('accept') ? submission.guestCount : 0,
      meal: submission.meal || '',
      contact: submission.contact || ''
    };
  } else if (source === 'guestbook') {
    payload = {
      type: 'guestbook',
      date: new Date().toLocaleDateString(),
      name: submission.guestName,
      message: submission.message,
      drawingData: submission.drawingDataUrl || ''
    };
  }

  await fetch(endpoint, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
}

function populateConfig() {
  CONFIG.couple = `${CONFIG.bride} & ${CONFIG.groom}`;
  $$('[data-config]').forEach((element) => {
    const value = CONFIG[element.dataset.config];
    if (value !== undefined) element.textContent = value;
  });
  document.title = `${CONFIG.couple} — Wedding Invitation`;
  document.querySelector('meta[name="description"]').content = `A wedding invitation for ${CONFIG.couple}.`;
  const root = document.documentElement;
  const colorMap = { primaryText: '--ink', green: '--green', rose: '--rose', butter: '--butter', background: '--cream' };
  Object.entries(colorMap).forEach(([key, variable]) => {
    if (config.colors?.[key]) root.style.setProperty(variable, config.colors[key]);
  });
  if (config.heroImage) {
    const photo = $('#heroPhoto');
    photo.style.backgroundImage = `url("${config.heroImage}")`;
    photo.style.backgroundSize = 'cover';
    photo.style.backgroundPosition = config.heroImagePosition || 'center';
    $('.hero-photo-fallback', photo).hidden = true;
  }
  if (config.cardImage) {
    const cardPhoto = $('#card-couple-image');
    const focus = config.cardImagePosition || 'center';
    cardPhoto.src = config.cardImage;
    cardPhoto.style.objectPosition = focus;
    cardPhoto.style.transformOrigin = focus;
    cardPhoto.style.transform = `scale(${config.cardImageZoom || 1})`;
  }
  const maps = CONFIG.mapsLink && CONFIG.mapsLink !== '[Maps Link]'
    ? CONFIG.mapsLink
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${CONFIG.venue}, ${CONFIG.address}`)}`;
  $('#mapButton').href = maps;
  $('#mapPreviewLink').href = maps;
  $('#directionsLink').href = maps;
  $('#directionsLink').target = '_blank';
  if (config.mapEmbedUrl) {
    const embed = $('#mapEmbed');
    embed.src = config.mapEmbedUrl;
    embed.hidden = false;
  }
  populateEventDetails();
  renderBlessing();
  populateRsvpChoices();
}

function populateEventDetails() {
  const [ceremony = {}, reception = {}] = config.events || [];
  $('#ceremonyTitle').textContent = ceremony.title || 'Ceremony';
  $('#ceremonyTime').textContent = ceremony.time || '';
  $('#receptionTitle').textContent = reception.title || 'Reception';
  $('#receptionTime').textContent = reception.time || '';
  $('#receptionLocation').textContent = (reception.location || CONFIG.venue).replace('[Venue Name]', CONFIG.venue);
}

function renderBlessing() {
  if (!config.blessing) { $('#blessing').hidden = true; return; }
  const image = $('#blessingImage');
  if (config.blessing.imageUrl) image.src = config.blessing.imageUrl;
  image.alt = CONFIG.couple;
}

function populateRsvpChoices() {
  const guestSelect = $('#guestCount');
  const maximum = Math.max(1, Number(config.maxGuests) || 1);
  guestSelect.replaceChildren(...Array.from({ length: maximum }, (_, index) => {
    const count = index + 1; const option = new Option(count === 1 ? 'Just me' : `${count} guests`, String(count)); return option;
  }));
}

function setupOpening() {
  const opening = $('#opening');
  const website = $('#website');
  
  function triggerOpen() {
    const envelopeScene = $('#envelope-scene');
    const envelopeWrapper = $('#envelope-wrapper');
    const clickInstruction = $('#click-instruction');

    if (envelopeScene.classList.contains('open')) return;
    
    // Step 1: Open flap and hide seal
    envelopeScene.classList.add('open');
    if(clickInstruction) clickInstruction.classList.add('hidden');
    
    // Step 2: Slide card up
    setTimeout(() => {
      envelopeScene.classList.add('pull-card');
    }, 1000);
    
    // Step 3: Drop envelope and center card
    setTimeout(() => {
      envelopeScene.classList.add('read-card');
    }, 2000);
    
    // Step 4: Fade to main website
    setTimeout(() => {
      if(envelopeWrapper) envelopeWrapper.classList.add('fade-out');
      opening.classList.add('opened');
      website.removeAttribute('aria-hidden');
      website.classList.add('is-visible');
    }, 5000);
    
    setTimeout(() => {
      if(envelopeWrapper) envelopeWrapper.style.display = 'none';
    }, 6500);
    
    // Auto-play music on open
    const bgMusic = $('#bgMusic');
    if (bgMusic) {
      bgMusic.play().then(() => {
        const toggle = $('#soundToggle');
        if (toggle) {
          toggle.setAttribute('aria-pressed', 'true');
          const span = toggle.querySelector('span');
          if (span) span.textContent = 'Sound on';
        }
      }).catch(e => console.log('Audio play failed', e));
    }
  }
  
  // Click seal OR entire envelope to open
  const waxSeal = $('#wax-seal');
  if(waxSeal) waxSeal.addEventListener('click', triggerOpen);
  const envelopeScene = $('#envelope-scene');
  if(envelopeScene) envelopeScene.addEventListener('click', triggerOpen);
  const toggle = $('#soundToggle');
  const bgMusic = $('#bgMusic');
  if (bgMusic) {
    if (config.music) bgMusic.src = config.music;
    bgMusic.volume = 0.5;
  }
  toggle.addEventListener('click', () => {
    if (!bgMusic) return;
    const active = toggle.getAttribute('aria-pressed') === 'true';
    toggle.setAttribute('aria-pressed', String(!active));
    toggle.querySelector('span').textContent = active ? 'Sound off' : 'Sound on';
    if (active) {
      bgMusic.pause();
    } else {
      bgMusic.play().catch(e => console.log('Audio play failed', e));
    }
  });
}

function setupNavigation() {
  const button = $('#navMenu'); const links = $('#navLinks');
  button.addEventListener('click', () => { const open = links.classList.toggle('open'); button.setAttribute('aria-expanded', String(open)); });
  $$('a', links).forEach((link) => link.addEventListener('click', () => { links.classList.remove('open'); button.setAttribute('aria-expanded', 'false'); }));
}

function setupCountdown() {
  const ids = ['days', 'hours', 'minutes', 'seconds'];
  const update = () => {
    let remaining = new Date(CONFIG.date).getTime() - Date.now();
    if (Number.isNaN(remaining) || remaining < 0) remaining = 0;
    const values = [Math.floor(remaining / 86400000), Math.floor(remaining / 3600000) % 24, Math.floor(remaining / 60000) % 60, Math.floor(remaining / 1000) % 60];
    ids.forEach((id, index) => { $(`#${id}`).textContent = String(values[index]).padStart(index ? 2 : 3, '0'); });
  };
  update(); setInterval(update, 1000);
}

function addCalendar() {
  const start = new Date(CONFIG.date);
  const end = new Date(start.getTime() + 6 * 60 * 60 * 1000);
  const formatDate = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const calendar = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `UID:wedding-${Date.now()}@invitation`, `DTSTAMP:${formatDate(new Date())}`, `DTSTART:${formatDate(start)}`, `DTEND:${formatDate(end)}`, `SUMMARY:${CONFIG.couple} Wedding`, `LOCATION:${CONFIG.venue}, ${CONFIG.address}`, 'DESCRIPTION:We cannot wait to celebrate with you.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar' })); link.download = 'wedding-invitation.ics'; link.click(); URL.revokeObjectURL(link.href);
}

function setupDrawing() {
  const canvas = $('#drawingCanvas'); const context = canvas.getContext('2d'); let drawing = false; let color = '#2f5e3b';
  context.lineCap = 'round'; context.lineJoin = 'round'; context.lineWidth = 4;
  const point = (event) => { const box = canvas.getBoundingClientRect(); const source = event.touches ? event.touches[0] : event; return { x: (source.clientX - box.left) * (canvas.width / box.width), y: (source.clientY - box.top) * (canvas.height / box.height) }; };
  const start = (event) => { drawing = true; const pos = point(event); context.beginPath(); context.moveTo(pos.x, pos.y); event.preventDefault(); };
  const draw = (event) => { if (!drawing) return; const pos = point(event); context.strokeStyle = color; context.lineTo(pos.x, pos.y); context.stroke(); event.preventDefault(); };
  ['mousedown', 'touchstart'].forEach((type) => canvas.addEventListener(type, start, { passive:false }));
  ['mousemove', 'touchmove'].forEach((type) => canvas.addEventListener(type, draw, { passive:false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((type) => canvas.addEventListener(type, () => { drawing = false; }));
  $$('.color').forEach((button) => button.addEventListener('click', () => { $$('.color').forEach((item) => item.classList.remove('active')); button.classList.add('active'); color = button.dataset.color; }));
  $('#clearDrawing').addEventListener('click', () => context.clearRect(0, 0, canvas.width, canvas.height));
  $('#wishForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = $('#wishName').value.trim(); const message = $('#wishMessage').value.trim();
    if (!name || !message) return;
    const status = $('#wishStatus'); const submit = $('button[type="submit"]', event.target);
    status.textContent = 'Sending your message…'; submit.disabled = true;
    try {
      await sendSubmission('guestbook', { guestName: name, message, drawingDataUrl: canvas.toDataURL('image/png') });
      status.textContent = 'Thank you — your message was sent.';
      event.target.reset(); context.clearRect(0, 0, canvas.width, canvas.height);
      setTimeout(loadGuestbook, 2000);
    } catch (error) {
      status.textContent = error.message === 'missing-endpoint'
        ? 'Submissions are not configured yet. Add the Google Apps Script URL in config.js.'
        : 'Could not send your message. Please check your connection and try again.';
    } finally {
      submit.disabled = false;
    }
  });
}

// A compact QR Version 1-L encoder. The unique code is intentionally short enough for the pass.


function setupRsvp() {
  const form = $('#rsvpForm'); let step = 1;
  const show = (number) => { step = number; $$('.rsvp-step').forEach((field) => field.classList.toggle('active', Number(field.dataset.step) === step)); $$('.step-indicator span').forEach((line,index)=>line.classList.toggle('active',index<step)); };
  $$('.next-step').forEach((button)=>button.addEventListener('click',()=>{ const fieldset = $(`.rsvp-step[data-step="${step}"]`); const required = $$('[required]',fieldset); if(!required.every((input)=>input.checkValidity())) { required.find((input)=>!input.checkValidity()).reportValidity(); return; } show(Math.min(3,step+1)); }));
  $$('.back-step').forEach((button)=>button.addEventListener('click',()=>show(Math.max(1,step-1))));
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); if (!form.checkValidity()) return form.reportValidity();
    const guest = $('#guestName').value.trim();
    const attendance = $('input[name="attendance"]:checked').value;
    const count = $('#guestCount').value;
    const reservation = `W:${Math.random().toString(36).slice(2,10).toUpperCase()}`;
    const status = $('#rsvpStatus'); const submit = $('button[type="submit"]', form);
    status.textContent = 'Sending your RSVP…'; submit.disabled = true;
    try {
      await sendSubmission('rsvp', {
        reservation,
        guestName: guest,
        guestCount: count,
        attendance,
        contact: $('#contact').value.trim(),
        note: $('#rsvpNote').value.trim(),
      });
      $('#passName').textContent = guest.split(' ')[0] || 'friend';
      $('#passGuests').textContent = count;
      $('#passStatus').textContent = attendance.includes('accept') ? 'Accepted' : 'With love';
      $('#rsvpPanel').hidden = true; $('#passScreen').hidden = false;
    } catch (error) {
      status.textContent = error.message === 'missing-endpoint'
        ? 'RSVP is not configured yet. Add the Google Apps Script URL in config.js.'
        : 'Could not send your RSVP. Please check your connection and try again.';
    } finally {
      submit.disabled = false;
    }
  });
  $('#rsvpAgain').addEventListener('click',()=>{ $('#passScreen').hidden=true; $('#rsvpPanel').hidden=false; });
}

async function loadGuestbook() {
  const endpoint = (config.submissionEndpoint || '').trim();
  const wishesContainer = $('#wishes');
  if (!wishesContainer) return;
  
  if (config.isGuestbookPublic === false) {
    wishesContainer.innerHTML = '<p>Your messages are sent privately to the couple. Thank you!</p>';
    wishesContainer.classList.remove('wishes-empty');
    return;
  }
  
  if (!endpoint) return;
  
  try {
    const response = await fetch(`${endpoint}?type=guestbook`);
    if (!response.ok) throw new Error('Network error');
    const entries = await response.json();
    
    if (entries.length === 0) {
      wishesContainer.innerHTML = '<p>Warm wishes from your loved ones will live here.</p>';
      return;
    }
    
    wishesContainer.innerHTML = '';
    wishesContainer.classList.remove('wishes-empty');
    
    entries.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'wish-entry';
      let content = `<strong>${entry.name}</strong><br><small style="color:#666">${entry.date}</small>`;
      if (entry.message) content += `<p style="margin-top:0.5rem">${entry.message}</p>`;
      if (entry.drawingData && entry.drawingData !== 'null' && entry.drawingData !== '') {
        content += `<img src="${entry.drawingData}" alt="Guest Drawing" style="max-width: 100%; margin-top: 1rem; border-radius: 8px;">`;
      }
      div.innerHTML = content;
      div.style.marginBottom = '1.5rem';
      div.style.padding = '1.5rem';
      div.style.background = 'rgba(255,255,255,0.4)';
      div.style.borderRadius = '8px';
      wishesContainer.appendChild(div);
    });
  } catch (e) {
    console.error("Failed to load guestbook", e);
  }
}

populateConfig(); setupOpening(); setupNavigation(); setupCountdown(); setupDrawing(); setupRsvp(); loadGuestbook(); $('#calendarButton').addEventListener('click', addCalendar);


// --- Scroll Reveal ---
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const windowHeight = window.innerHeight;
  const elementVisible = 100;

  const checkVisibility = () => {
    for (let i = 0; i < reveals.length; i++) {
      const elementTop = reveals[i].getBoundingClientRect().top;
      if (elementTop < windowHeight - elementVisible) {
        reveals[i].classList.add('active');
      }
    }
  };

  window.addEventListener('scroll', checkVisibility);
  checkVisibility();
}
document.addEventListener('DOMContentLoaded', initScrollReveal);
