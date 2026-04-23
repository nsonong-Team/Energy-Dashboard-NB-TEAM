// ==================== UTILS ====================
function fmtNum(n) {
  if (n == null || isNaN(n)) return '-';
  return Number(n).toLocaleString('th-TH', { maximumFractionDigits: 2 });
}

function truncate(s, n) {
  return s.length > n ? s.substring(0, n-1) + '…' : s;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  setTimeout(() => el.classList.remove('show'), 3500);
}

function toggleLoader(show, text = '') {
  const el = document.getElementById('loader');
  if (text) document.getElementById('loaderText').textContent = text;
  el.classList.toggle('show', show);
}

function updateStatus(text) {
  document.getElementById('statusText').textContent = text;
}
