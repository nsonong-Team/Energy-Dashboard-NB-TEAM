// ==================== CHARTS ====================
function getAccent() {
  return mode === 'elec' 
    ? { primary: '#00e5ff', secondary: '#0099ff', glow: 'rgba(0,229,255,0.3)' }
    : { primary: '#ff8a00', secondary: '#ff3d00', glow: 'rgba(255,138,0,0.3)' };
}

function monthlyAggregate(records, year) {
  const map = {};
  THAI_MONTHS.forEach(m => map[m] = {actual: 0, standard: 0, count: 0});
  records.filter(r => r.year === year).forEach(r => {
    if (map[r.month]) {
      map[r.month].actual += r.actual;
      map[r.month].standard += r.standard;
      map[r.month].count++;
    }
  });
  return THAI_MONTHS.map(m => map[m]);
}

function renderTrendChart(all, year) {
  const c = getAccent();
  const years = [year-2, year-1, year];
  const colors = ['#5a6580', '#ffc107', c.primary];
  
  const datasets = years.map((y, i) => {
    const monthly = monthlyAggregate(all, y);
    return {
      label: 'ปี ' + y,
      data: monthly.map(m => m.count > 0 ? m.actual : null),
      borderColor: colors[i],
      backgroundColor: i === 2 ? c.glow : 'transparent',
      borderWidth: i === 2 ? 3 : 2,
      tension: 0.4,
      fill: i === 2,
      pointRadius: 4,
      pointBackgroundColor: colors[i],
      pointBorderColor: '#0a0e1a',
      pointBorderWidth: 2,
      spanGaps: true
    };
  });
  
  charts.trend?.destroy();
  charts.trend = new Chart(document.getElementById('trendChart'), {
    type: 'line',
    data: { labels: MONTH_SHORT, datasets },
    options: commonOpts({ legend: true })
  });
}

function renderStdVsAct(records) {
  const monthly = monthlyAggregate(records, Number(document.getElementById('yearFilter').value));
  const c = getAccent();
  
  charts.stdVsAct?.destroy();
  charts.stdVsAct = new Chart(document.getElementById('stdVsActChart'), {
    type: 'bar',
    data: {
      labels: MONTH_SHORT,
      datasets: [
        {
          label: 'มาตรฐาน',
          data: monthly.map(m => m.standard),
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderColor: 'rgba(255,255,255,0.3)',
          borderWidth: 1,
          borderRadius: 6
        },
        {
          label: 'ใช้จริง',
          data: monthly.map(m => m.count > 0 ? m.actual : null),
          backgroundColor: c.primary,
          borderRadius: 6
        }
      ]
    },
    options: commonOpts({ legend: true })
  });
}

function renderYoY(cur, prev, year) {
  const c = getAccent();
  charts.yoy?.destroy();
  const total = cur + prev;
  const prevPercent = total > 0 ? ((prev / total) * 100).toFixed(1) : 0;
  const curPercent = total > 0 ? ((cur / total) * 100).toFixed(1) : 0;

  charts.yoy = new Chart(document.getElementById('yoyChart'), {
    type: 'doughnut',
    data: {
      labels: [
        `ปี ${year - 1} (${prevPercent}%)`, 
        `ปี ${year} (${curPercent}%)`
      ],
      datasets: [{
        data: [prev, cur],
        backgroundColor: ['rgba(255,255,255,0.15)', c.primary],
        borderColor: '#0a0e1a',
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { 
          position: 'bottom', 
          labels: { 
            color: '#8b95b0', 
            font: { family: 'Prompt', size: 11 }, 
            padding: 12, 
            usePointStyle: true 
          } 
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = ctx.parsed;
              return ` ${ctx.label.split(' ')[0]} ${ctx.label.split(' ')[1]}: ${fmtNum(value)}`;
            }
          }
        }
      }
    }
  });
}

function renderAgencyChart(year) {
  const source = mode === 'elec' ? allData.electricity : allData.oil;
  const agg = {};
  source.filter(r => r.year === year).forEach(r => {
    agg[r.agency] = (agg[r.agency] || 0) + r.actual;
  });
  const sorted = Object.entries(agg).sort((a,b) => b[1]-a[1]).slice(0, 10);
  const c = getAccent();
  
  charts.agency?.destroy();
  charts.agency = new Chart(document.getElementById('agencyChart'), {
    type: 'bar',
    data: {
      labels: sorted.map(([n]) => truncate(n, 22)),
      datasets: [{
        label: mode === 'elec' ? 'หน่วย' : 'ลิตร',
        data: sorted.map(([,v]) => v),
        backgroundColor: c.primary,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => fmtNum(ctx.parsed.x) } }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b95b0' } },
        y: { grid: { display: false }, ticks: { color: '#8b95b0', font: { size: 10 } } }
      }
    }
  });
}

function renderRecentTable(records) {
  const sorted = [...records].sort((a,b) => THAI_MONTHS.indexOf(b.month) - THAI_MONTHS.indexOf(a.month));
  const tbody = document.getElementById('recentTable');
  tbody.innerHTML = sorted.slice(0, 10).map(r => {
    const pct = r.standard > 0 ? (r.actual/r.standard*100) : 0;
    const badgeClass = pct < 80 ? 'ok' : (pct < 100 ? 'warn' : 'bad');
    return `<tr>
      <td>${r.month}</td>
      <td>${fmtNum(r.actual)}</td>
      <td><span class="badge ${badgeClass}">${pct.toFixed(1)}%</span></td>
    </tr>`;
  }).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:20px;">ไม่มีข้อมูล</td></tr>';
}

function commonOpts({ legend = false } = {}) {
  const isMobile = window.innerWidth < 700;
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: legend,
        position: isMobile ? 'bottom' : 'top',
        align: isMobile ? 'center' : 'end',
        labels: { 
            color: '#8b95b0', 
            font: { family: 'Prompt', size: isMobile ? 10 : 11 },
            padding: 10, 
            usePointStyle: true, 
            boxWidth: 8 
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10,14,26,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#f0f4ff',
        bodyColor: '#8b95b0',
        padding: 10,
        callbacks: {
          label: (ctx) => ctx.dataset.label + ': ' + (ctx.parsed.y != null ? fmtNum(ctx.parsed.y) : '-')
        }
      }
    },
    scales: {
      x: { 
        grid: { color: 'rgba(255,255,255,0.05)' }, 
        ticks: { 
            color: '#8b95b0',
            font: { size: isMobile ? 9 : 11 }
        } 
      },
      y: { 
        grid: { color: 'rgba(255,255,255,0.05)' }, 
        ticks: { 
            color: '#8b95b0', 
            font: { size: isMobile ? 9 : 11 },
            callback: (v) => fmtNum(v) 
        } 
      }
    }
  };
}
