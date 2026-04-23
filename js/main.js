// ==================== INIT ====================
window.addEventListener('resize', () => {
  const year = Number(document.getElementById('yearFilter').value);
  const all = getFilteredData();
  const thisYear = all.filter(r => r.year === year);
  const sumAct = thisYear.reduce((s,r)=>s+r.actual, 0);
  const sumStd = thisYear.reduce((s,r)=>s+r.standard, 0);
  drawGauge(sumStd > 0 ? (sumAct/sumStd)*100 : 0);
});

loadData();

// Auto-refresh ทุก 5 นาที
setInterval(() => loadData(false), 5 * 60 * 1000);
