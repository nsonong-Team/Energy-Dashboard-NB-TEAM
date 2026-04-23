// ==================== REPORT ====================
function openReport() {
  const year = Number(document.getElementById('yearFilter').value);
  const source = mode === 'elec' ? allData.electricity : allData.oil;
  const byAgency = {};
  source.filter(r => r.year === year).forEach(r => {
    if (!byAgency[r.agency]) byAgency[r.agency] = { actual: 0, standard: 0 };
    byAgency[r.agency].actual += r.actual;
    byAgency[r.agency].standard += r.standard;
  });
  
  let report = `รายงานสถานการณ์${mode === 'elec' ? 'ไฟฟ้า' : 'น้ำมัน'} ปี ${year}\n`;
  report += '='.repeat(60) + '\n\n';
  Object.entries(byAgency).sort((a,b) => b[1].actual - a[1].actual).forEach(([name, v], i) => {
    const pct = v.standard > 0 ? (v.actual/v.standard*100).toFixed(1) : '0';
    report += `${(i+1).toString().padStart(2)}. ${name}\n`;
    report += `    ใช้จริง: ${fmtNum(v.actual)} | มาตรฐาน: ${fmtNum(v.standard)} | ${pct}%\n\n`;
  });
  
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `รายงาน_${mode === 'elec' ? 'ไฟฟ้า' : 'น้ำมัน'}_${year}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast('✓ ดาวน์โหลดรายงาน', 'success');
}
