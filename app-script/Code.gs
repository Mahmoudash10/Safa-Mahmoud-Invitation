/*
 * Backend for the invitation's wishes and RSVPs.
 * Paste this into Extensions → Apps Script of a Google Sheet, then deploy it as a Web app
 * (Execute as: Me, Who has access: Anyone) and put the /exec URL in config.js → submissionEndpoint.
 * The "Wishes" and "RSVP" tabs are created automatically on the first submission.
 */
const SHEETS = {
  guestbook: { name: 'Wishes', headers: ['Date', 'Name', 'Message', 'Drawing'] },
  rsvp: { name: 'RSVP', headers: ['Date', 'Name', 'Attending', 'Guests', 'Note'] },
};

// A Sheets cell holds at most 50,000 characters, so long drawings spill into the next columns
const CELL_LIMIT = 49000;

function getSheet(type) {
  const { name, headers } = SHEETS[type];
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(name);
  if (!sheet) {
    sheet = book.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Stops guest text like "=IMPORTXML(...)" from running as a formula in the sheet
function safe(value) {
  const text = String(value ?? '');
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function respond(body, mimeType = ContentService.MimeType.TEXT) {
  return ContentService.createTextOutput(body).setMimeType(mimeType);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (!SHEETS[data.type]) return respond('Unknown type');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet(data.type);
    if (data.type === 'rsvp') {
      sheet.appendRow([new Date(), safe(data.name), safe(data.attending), Number(data.guests) || 0, safe(data.note)]);
    } else {
      const drawing = String(data.drawingData || '');
      const chunks = [];
      for (let i = 0; i < drawing.length; i += CELL_LIMIT) chunks.push(drawing.slice(i, i + CELL_LIMIT));
      sheet.appendRow([new Date(), safe(data.name), safe(data.message), ...chunks]);
    }
  } finally {
    lock.releaseLock();
  }
  return respond('OK');
}

// GET ?type=guestbook → every wish, newest first
function doGet(e) {
  if (e.parameter.type !== 'guestbook') return respond('Hello!');
  const rows = getSheet('guestbook').getDataRange().getValues().slice(1);
  const entries = rows.map(([date, name, message, ...drawing]) => ({
    date: date instanceof Date ? date.toISOString() : String(date),
    name: String(name),
    message: String(message),
    drawingData: drawing.join(''),
  })).reverse();
  return respond(JSON.stringify(entries), ContentService.MimeType.JSON);
}
