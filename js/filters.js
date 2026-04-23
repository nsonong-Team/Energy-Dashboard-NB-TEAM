// ==================== FILTERS ====================
function populateFilters() {
  const agencyEl = document.getElementById('agencyFilter');
  const fAgencyEl = document.getElementById('fAgency');
  const yearEl = document.getElementById('yearFilter');
  const fYearEl = document.getElementById('fYear');
  const monthEl = document.getElementById('monthFilter');
  const fMonthEl = document.getElementById('fMonth');
  
  // Agencies
  const agencies = (allData.agencies || []).filter(a => a.active).sort((a,b) => a.name.localeCompare(b.name,'th'));
  agencyEl.innerHTML = '<option value="__ALL__">ภาพรวมจังหวัด (ทั้งหมด)</option>' +
    agencies.map(a => `<option value="${escapeHtml(a.name)}">${escapeHtml(a.name)}</option>`).join('');
  fAgencyEl.innerHTML = agencies.map(a => `<option value="${escapeHtml(a.name)}">${escapeHtml(a.name)}</option>`).join('');
  
  // Years
  const allRecords = [...allData.electricity, ...allData.oil];
  const years = [...new Set(allRecords.map(r => r.year))].sort((a,b) => b-a);
  const currentYear = years[0] || 2569;
  yearEl.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
  yearEl.value = currentYear;
  fYearEl.innerHTML = [currentYear+1, currentYear, currentYear-1, currentYear-2]
    .map(y => `<option value="${y}">${y}</option>`).join('');
  fYearEl.value = currentYear;
  
  // Months
  monthEl.innerHTML = '<option value="__ALL__">ทั้งปี</option>' +
    THAI_MONTHS.map(m => `<option value="${m}">${m}</option>`).join('');
  fMonthEl.innerHTML = THAI_MONTHS.map(m => `<option value="${m}">${m}</option>`).join('');
  
  // Badges
  document.getElementById('elecBadge').textContent = allData.electricity.length + ' รายการ';
  document.getElementById('oilBadge').textContent = allData.oil.length + ' รายการ';
}

// ==================== MODE SWITCH ====================
function switchMode(m) {
  mode = m;
  document.body.classList.toggle('mode-oil', m === 'oil');
  document.querySelectorAll('.tab-card').forEach(el => {
    el.classList.toggle('active', el.dataset.mode === m);
  });
  document.getElementById('techoMode').textContent = m === 'elec' ? 'ELECTRICITY' : 'FUEL';
  document.querySelector('.logo-icon').textContent = m === 'elec' ? '⚡' : '⛽';

  const fTypeEl = document.getElementById('fType');
  if (fTypeEl) fTypeEl.value = m;

  if (typeof fillExistingData === 'function') {
    fillExistingData();
  }

  renderAll();
}

// ==================== FILTERING DATA ====================
function getFilteredData() {
  const source = mode === 'elec' ? allData.electricity : allData.oil;
  const agency = document.getElementById('agencyFilter').value;
  const year = Number(document.getElementById('yearFilter').value);
  const month = document.getElementById('monthFilter').value;
  
  return source.filter(r => {
    if (agency !== '__ALL__' && r.agency !== agency) return false;
    if (month !== '__ALL__' && r.month !== month) return false;
    return true;
  });
}
