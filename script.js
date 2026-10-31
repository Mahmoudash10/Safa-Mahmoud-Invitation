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
      contact: submission.contact || '',
      note: submission.note || ''
    };
  } else if (source === 'guestbook') {
    payload = {
      type: 'guestbook',
      date: new Date().toISOString(),
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
    const count = index + 1; const option = new Option(count === 1 ? '1 Guest (Self)' : `${count} Guests`, String(count)); return option;
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
  const form = $('#rsvpForm');
  // guests count only matters when attending
  $('#attendance').addEventListener('change', (event) => { $('#guestCountField').hidden = !event.target.value.includes('accept'); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); if (!form.checkValidity()) return form.reportValidity();
    const guest = $('#guestName').value.trim();
    const attendance = $('#attendance').value;
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
        note: $('#rsvpNote').value.trim(),
      });
      const accepted = attendance.includes('accept');
      $('#passName').textContent = guest;
      $('#inviteGuest').textContent = guest;
      $('#inviteAttendance').textContent = accepted
        ? `Joyfully Accepts (${count} ${count === '1' ? 'Guest' : 'Guests'})`
        : 'Regretfully Declines';
      $('#rsvpPanel').hidden = true; $('#passScreen').hidden = false;
      $('#passScreen').scrollIntoView({ behavior: 'smooth', block: 'start' });
      inviteCardBlob = null; renderInviteCard().then((blob) => { inviteCardBlob = blob; });
    } catch (error) {
      status.textContent = error.message === 'missing-endpoint'
        ? 'RSVP is not configured yet. Add the Google Apps Script URL in config.js.'
        : 'Could not send your RSVP. Please check your connection and try again.';
    } finally {
      submit.disabled = false;
    }
  });
  $('#rsvpAgain').addEventListener('click',()=>{ $('#passScreen').hidden=true; $('#rsvpPanel').hidden=false; });
  $('#downloadCard').addEventListener('click', downloadInviteCard);
  const date = new Date(config.weddingDateTime);
  $('#inviteDate').textContent = Number.isNaN(date.getTime()) ? CONFIG.dateDisplay
    : date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  $('#inviteVenue').textContent = CONFIG.venue.includes(CONFIG.city) ? CONFIG.venue : `${CONFIG.venue} · ${CONFIG.city}`;
}

// The PNG is drawn ahead of time so the share sheet can open straight from the tap (iOS drops slow gestures)
let inviteCardBlob = null;

// Draws the on-screen invitation card onto a canvas, reading its text from the DOM so both always match
async function renderInviteCard() {
  const fonts = ['150px Allura', 'italic 44px "Playfair Display"', '700 50px "Playfair Display"', '600 34px Jost', '400 34px Jost'];
  await Promise.all(fonts.map((font) => document.fonts.load(font).catch(() => {})));
  const card = $('#inviteCard'); const text = (selector) => $(selector, card).textContent.replace(/\s+/g, ' ').trim();
  const css = getComputedStyle(document.documentElement); const color = (name) => css.getPropertyValue(name).trim();
  const ink = color('--ink'); const green = color('--green'); const rose = color('--rose-deep'); const line = color('--rose-soft');
  const W = 1080; const maxWidth = W - 240;
  const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');

  const wrap = (value, font) => {
    ctx.font = font; const lines = []; let current = '';
    value.split(' ').forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (current && ctx.measureText(next).width > maxWidth) { lines.push(current); current = word; } else current = next;
    });
    return lines.concat(current);
  };
  // Lays the content out from the top; with draw = false it only measures the height
  const layout = (draw) => {
    let y = 200;
    const textBlock = (value, font, fill, lineHeight, spacing = '0px') => {
      ctx.letterSpacing = spacing;
      wrap(value, font).forEach((row) => { if (draw) { ctx.font = font; ctx.fillStyle = fill; ctx.fillText(row, W / 2, y); } y += lineHeight; });
      ctx.letterSpacing = '0px';
    };
    const labelled = (label, value) => {
      const labelFont = '600 34px Jost'; const valueFont = '400 34px Jost';
      ctx.font = labelFont; const labelWidth = ctx.measureText(`${label} `).width;
      ctx.font = valueFont; const valueWidth = ctx.measureText(value).width;
      if (labelWidth + valueWidth > maxWidth) { textBlock(label, labelFont, green, 50); textBlock(value, valueFont, ink, 50); return; }
      if (draw) {
        const x = (W - labelWidth - valueWidth) / 2; ctx.textAlign = 'left';
        ctx.font = labelFont; ctx.fillStyle = green; ctx.fillText(`${label} `, x, y);
        ctx.font = valueFont; ctx.fillStyle = ink; ctx.fillText(value, x + labelWidth, y);
        ctx.textAlign = 'center';
      }
      y += 54;
    };
    const divider = () => { y += 6; if (draw) { ctx.fillStyle = line; ctx.fillRect(W / 2 - maxWidth * .45, y, maxWidth * .9, 3); } y += 70; };

    textBlock(text('.invite-kicker').toUpperCase(), '600 30px Jost', green, 50, '10px');
    y += 90;
    textBlock(text('.invite-names'), '150px Allura', rose, 150);
    y += 10;
    textBlock(text('.invite-request'), 'italic 44px "Playfair Display"', ink, 62);
    y += 50;
    $$('.invite-line', card).forEach((row) => labelled($('b', row).textContent.toUpperCase(), $('span', row).textContent));
    divider();
    textBlock(text('#inviteDate'), '700 50px "Playfair Display"', green, 66);
    textBlock(text('#inviteVenue'), '400 34px Jost', ink, 50);
    divider();
    textBlock(text('.invite-footer').toUpperCase(), '400 26px Jost', ink, 40, '6px');
    return y + 130;
  };

  canvas.width = W; canvas.height = layout(false);
  const H = canvas.height;
  const roundRect = (inset, radius) => {
    const x = inset; const y = inset; const w = W - inset * 2; const h = H - inset * 2;
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.arcTo(x + w, y, x + w, y + h, radius); ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius); ctx.arcTo(x, y, x + w, y, radius); ctx.closePath();
  };
  ctx.fillStyle = color('--cream'); ctx.fillRect(0, 0, W, H);
  roundRect(12, 60); ctx.fillStyle = '#fdfaf6'; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(201, 149, 154, .3)';
  for (let x = 30; x < W; x += 54) for (let y = 30; y < H; y += 54) { ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  roundRect(12, 60); ctx.lineWidth = 8; ctx.strokeStyle = color('--gold'); ctx.stroke();
  roundRect(36, 42); ctx.lineWidth = 3; ctx.strokeStyle = color('--muted'); ctx.setLineDash([14, 10]); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = '56px serif'; ctx.fillStyle = rose; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  [[100, 100], [W - 100, 100], [100, H - 100], [W - 100, H - 100]].forEach(([x, y]) => ctx.fillText('✿', x, y));
  ctx.textBaseline = 'alphabetic';
  layout(true);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

async function downloadInviteCard() {
  const blob = inviteCardBlob || await renderInviteCard();
  const name = `${CONFIG.bride}-${CONFIG.groom}-invitation.png`.replace(/\s+/g, '-');
  const file = new File([blob], name, { type: 'image/png' });
  // On phones the share sheet offers "Save Image" to the photo gallery
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return; } catch (error) { if (error.name === 'AbortError') return; }
  }
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// Guest text is shown to every visitor, so it must never be parsed as HTML
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
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
      const article = document.createElement('article');
      article.className = 'wish-entry';
      let content = '<span class="wish-mark" aria-hidden="true">♡</span>';
      if (entry.message) content += `<p class="wish-message" dir="auto">${escapeHtml(entry.message)}</p>`;
      if (typeof entry.drawingData === 'string' && entry.drawingData.startsWith('data:image/')) {
        content += `<img class="wish-drawing" src="${escapeHtml(entry.drawingData)}" alt="Drawing by ${escapeHtml(entry.name)}">`;
      }
      content += `<p class="wish-name" dir="auto">${escapeHtml(entry.name)}</p>`;
      article.innerHTML = content;
      wishesContainer.appendChild(article);
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
