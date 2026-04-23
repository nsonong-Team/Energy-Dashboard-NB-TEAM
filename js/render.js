// ==================== RENDER ====================
function renderAll() {
  const year = Number(document.getElementById('yearFilter').value);
  const month = document.getElementById('monthFilter').value;
  const agency = document.getElementById('agencyFilter').value;
  
  const all = getFilteredData();
  const thisYear = all.filter(r => r.year === year);
  const lastYear = all.filter(r => r.year === year - 1);
  
  const sumAct = thisYear.reduce((s,r)=>s+r.actual, 0);
  const sumStd = thisYear.reduce((s,r)=>s+r.standard, 0);
  const sumActLY = lastYear.reduce((s,r)=>s+r.actual, 0);
  
  const percent = sumStd > 0 ? (sumAct/sumStd)*100 : 0;
  const unit = mode === 'elec' ? 'หน่วย' : 'ลิตร';
  
  // Techometer
  document.getElementById('techoAgency').textContent = agency === '__ALL__' ? 'ภาพรวมจังหวัด' : agency;
  document.getElementById('gaugePercent').textContent = percent.toFixed(1);
  document.getElementById('techoStd').textContent = fmtNum(sumStd);
  document.getElementById('techoAct').textContent = fmtNum(sumAct);
  document.getElementById('techoSave').textContent = fmtNum(sumStd - sumAct);
  
  // Status
  /*
  const statusEl = document.getElementById('gaugeStatus');
  if (percent < 80) { statusEl.textContent = '✓ ประหยัดดี'; statusEl.style.background='rgba(0,230,118,0.15)'; statusEl.style.color='var(--success)'; }
  else if (percent < 100) { statusEl.textContent = '● ปกติ (ตามเป้า)'; statusEl.style.background='rgba(255,193,7,0.15)'; statusEl.style.color='var(--warning)'; }
  else if (percent < 120) { statusEl.textContent = '▲ เกินเป้าเล็กน้อย'; statusEl.style.background='rgba(255,152,0,0.15)'; statusEl.style.color='#ff9800'; }
  else { statusEl.textContent = '✕ เกินมาตรฐาน'; statusEl.style.background='rgba(255,23,68,0.15)'; statusEl.style.color='var(--danger)'; }
  */

  const stdValEl = document.getElementById('techoStd');
  const actValEl = document.getElementById('techoAct');
  const saveValEl = document.getElementById('techoSave');
  const statusEl = document.getElementById('gaugeStatus');
  if (percent < 80) { 
    statusEl.textContent = '✓ ประหยัดดี'; 
    statusEl.style.background='rgba(0,230,118,0.15)'; 
    const color = 'var(--success)';
    statusEl.style.color = color;
    stdValEl.style.color = color;
    actValEl.style.color = color;
    saveValEl.style.color = color;
  } 
  else if (percent < 100) { 
    statusEl.textContent = '● ปกติ (ตามเป้า)'; 
    statusEl.style.background='rgba(255,193,7,0.15)'; 
    const color = 'var(--warning)';
    statusEl.style.color = color;
    stdValEl.style.color = color;
    actValEl.style.color = color;
    saveValEl.style.color = color;
  } 
  else if (percent < 120) { 
    statusEl.textContent = '▲ เกินเป้าเล็กน้อย'; 
    statusEl.style.background='rgba(255,152,0,0.15)'; 
    const color = '#ff9800';
    statusEl.style.color = color;
    stdValEl.style.color = color;
    actValEl.style.color = color;
    saveValEl.style.color = color;
  } 
  else { 
    statusEl.textContent = '✕ เกินมาตรฐาน'; 
    statusEl.style.background='rgba(255,23,68,0.15)'; 
    const color = 'var(--danger)';
    statusEl.style.color = color;
    stdValEl.style.color = color;
    actValEl.style.color = color;
    saveValEl.style.color = color;
  }

  drawGauge(percent);
  
  // KPI
  document.getElementById('kpiActual').innerHTML = fmtNum(sumAct) + `<span class="kpi-unit">${unit}</span>`;
  document.getElementById('kpiStd').innerHTML = fmtNum(sumStd) + `<span class="kpi-unit">${unit}</span>`;
  document.getElementById('kpiActualSub').textContent = `ปี ${year}${month !== '__ALL__' ? ' · ' + month : ''}`;
  
  // YoY trend
  const trendEl = document.getElementById('kpiActualTrend');
  if (sumActLY > 0) {
    const diff = ((sumAct - sumActLY)/sumActLY)*100;
    trendEl.className = 'kpi-trend ' + (diff > 0 ? 'up' : 'down');
    trendEl.textContent = (diff > 0 ? '▲ ' : '▼ ') + Math.abs(diff).toFixed(1) + '% vs ปี ' + (year-1);
  } else {
    trendEl.className = 'kpi-trend neutral';
    trendEl.textContent = 'ไม่มีข้อมูลปีก่อนเทียบ';
  }
  
  // Charts
  renderTrendChart(all, year);
  renderStdVsAct(thisYear);
  renderYoY(sumAct, sumActLY, year);
  renderAgencyChart(year);
  renderRecentTable(thisYear);
}

// ==================== GAUGE (Canvas) ====================
function drawGauge(percent) {
  const canvas = document.getElementById('gaugeCanvas');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height;
  
  ctx.clearRect(0, 0, w, h);
  
  const cx = w/2;
  const cy = h * 0.75;
  const radius = Math.min(w, h*1.4) / 2 - 20;
  
  // เกณฑ์สี
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const isElec = mode === 'elec';
  
  // Background arc
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.lineWidth = 24;
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.stroke();
  
  // Segments (0-80 เขียว, 80-100 เหลือง, 100-120 ส้ม, 120+ แดง)
  const segments = [
    {from: 0, to: 80, color: '#00e676'},
    {from: 80, to: 100, color: '#ffc107'},
    {from: 100, to: 120, color: '#ff9800'},
    {from: 120, to: 150, color: '#ff1744'}
  ];
  const max = 150;
  segments.forEach(seg => {
    const a1 = startAngle + (seg.from/max) * Math.PI;
    const a2 = startAngle + (seg.to/max) * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, a1, a2);
    ctx.lineWidth = 24;
    ctx.strokeStyle = seg.color;
    ctx.globalAlpha = 0.4;
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  
  // Ticks
  for (let p = 0; p <= 150; p += 10) {
    const a = startAngle + (p/max) * Math.PI;
    const inner = radius - 32;
    const outer = radius - 22;
    const major = p % 30 === 0;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (major ? inner-6 : inner), cy + Math.sin(a) * (major ? inner-6 : inner));
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.strokeStyle = major ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = major ? 2 : 1;
    ctx.stroke();
    
    if (major) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '11px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tx = cx + Math.cos(a) * (inner - 18);
      const ty = cy + Math.sin(a) * (inner - 18);
      ctx.fillText(p, tx, ty);
      ctx.restore();
    }
  }
  
  // Value arc (glow)
  const valPercent = Math.min(percent, max);
  const valAngle = startAngle + (valPercent/max) * Math.PI;
  
  const grad = ctx.createLinearGradient(0, cy - radius, 0, cy + radius);
  if (isElec) {
    grad.addColorStop(0, '#00e5ff');
    grad.addColorStop(1, '#0099ff');
  } else {
    grad.addColorStop(0, '#ff8a00');
    grad.addColorStop(1, '#ff3d00');
  }
  
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, valAngle);
  ctx.lineWidth = 16;
  ctx.strokeStyle = grad;
  ctx.lineCap = 'round';
  ctx.shadowColor = isElec ? '#00e5ff' : '#ff8a00';
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // Needle
  const needleLen = radius - 10;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(valAngle);
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(needleLen, -2);
  ctx.lineTo(needleLen + 8, 0);
  ctx.lineTo(needleLen, 2);
  ctx.closePath();
  ctx.fillStyle = isElec ? '#00e5ff' : '#ff8a00';
  ctx.shadowColor = isElec ? '#00e5ff' : '#ff8a00';
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.restore();
  
  // Hub
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, 2*Math.PI);
  ctx.fillStyle = '#0a0e1a';
  ctx.strokeStyle = isElec ? '#00e5ff' : '#ff8a00';
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();
}
