// ==================== API (JSONP) ====================
function jsonp(params) {
  return new Promise((resolve, reject) => {
    const cbName = 'cb_' + Math.random().toString(36).substr(2, 9);
    const url = API_URL + '?' + new URLSearchParams({...params, callback: cbName}).toString();
    window[cbName] = (data) => {
      resolve(data);
      delete window[cbName];
      document.getElementById(cbName)?.remove();
    };
    const script = document.createElement('script');
    script.id = cbName;
    script.src = url;
    script.onerror = () => {
      reject(new Error('ไม่สามารถเชื่อมต่อ API'));
      delete window[cbName];
      script.remove();
    };
    document.head.appendChild(script);
    setTimeout(() => {
      if (window[cbName]) {
        reject(new Error('Timeout'));
        delete window[cbName];
        script.remove();
      }
    }, 30000);
  });
}

// ==================== LOAD DATA ====================
async function loadData(showLoader = true) {
  if (showLoader) toggleLoader(true, 'กำลังโหลดข้อมูล...');
  try {
    // ถ้า API_URL ยังไม่ตั้งค่า ให้ใช้ sample data
    if (API_URL.includes('YOUR_DEPLOYMENT_ID')) {
      allData = getSampleData();
      toast('⚠️ ใช้ข้อมูลตัวอย่าง (ยังไม่ได้ตั้งค่า API_URL)', 'error');
    } else {
      const res = await jsonp({ action: 'all' });
      if (res.success) {
        allData = normalizeData(res);
      } else {
        throw new Error(res.error || 'Unknown');
      }
    }
    
    populateFilters();
    renderAll();
    updateStatus('เชื่อมต่อแล้ว · ' + new Date().toLocaleTimeString('th-TH'));
  } catch(err) {
    console.error(err);
    toast('❌ ' + err.message, 'error');
    // Fallback to sample
    allData = getSampleData();
    populateFilters();
    renderAll();
    updateStatus('Offline (sample data)');
  } finally {
    if (showLoader) toggleLoader(false);
  }
}

function normalizeData(res) {
  // แปลง field names จาก backend ให้เป็น key ที่ JS ใช้
  const mapE = row => ({
    agency: row.agency || '', 
    year: Number(row.year || 0),
    month: String(row.month || '').trim(),
    standard: Number(row.standard || 0),
    actual: Number(row.actual || 0),
    unit: row.unit || ''
  });
  return {
    electricity: (res.electricity || []).map(mapE).filter(r => r.year),
    oil: (res.oil || []).map(mapE).filter(r => r.year),
    agencies: (res.agencies || []).map(a => ({
      code: a.code || '',
      name: (a.name || '').trim(),
      ministry: a.ministry || '',
      active: a.active === true || a.active === 'ใช้งาน'
    })).filter(a => a.name)
  };
}

// ==================== SAMPLE DATA ====================
/*
function getSampleData() {
  const elec = [];
  const oil = [];
  const baseE = {2567:[1920.55,1888.46,1866.35,1861.59,1915.03,1939.75,2005.31,1773.99,1765.85,1874.26,1932.38,1927.92],
                 2568:[1909.21,1878.35,1781.96,1794.49,1833.08,1931.14,1881.01,1984.70,1911.25,1909.38,2015.46,1907.86],
                 2569:[1898.61,1807.75,1774.91,1799.58,1831.73,1950.00,2000.00,1950.00,1900.00,1950.00,2000.00,1950.00]};
  const actE = {2567:[601,556,440,372,371,642,673,951,643,581,508,641],
                2568:[507,470,410,333,371,679,723,697,848,711,742,727],
                2569:[755,562,325,318,399,0,0,0,0,0,0,0]};
  const baseO = {2567:[341.11,341.11,341.91,341.11,341.11,341.11,341.11,311.17,311.17,331.13,341.11,341.11],
                 2568:[341.11,341.11,341.11,341.11,341.11,341.11,341.11,341.11,341.11,341.11,341.11,341.11],
                 2569:[341.11,341.11,341.11,341.11,341.11,341.11,341.11,341.11,341.11,341.11,341.11,341.11]};
  const actO = {2567:[25.75,0.95,22.43,56.05,0.95,0.95,0.95,54.89,40.04,0.95,48.17,22.69],
                2568:[0.95,34.01,0.95,47.33,107.69,0.95,57.98,29.21,57.98,73.03,72.67,132.91],
                2569:[74.40,60.27,60.27,52.94,62.24,0,0,0,0,0,0,0]};
  
  const agencies = [
    {code:'NBL001', name:'สำนักงานสถิติจังหวัดหนองบัวลำภู', ministry:'กระทรวงดิจิทัลฯ', active:true},
    {code:'NBL002', name:'สำนักงานจังหวัดหนองบัวลำภู', ministry:'กระทรวงมหาดไทย', active:true},
    {code:'NBL017', name:'สำนักงานสาธารณสุขจังหวัดหนองบัวลำภู', ministry:'กระทรวงสาธารณสุข', active:true},
    {code:'NBL018', name:'สำนักงานเกษตรจังหวัดหนองบัวลำภู', ministry:'กระทรวงเกษตรฯ', active:true},
    {code:'NBL024', name:'สำนักงานพลังงานจังหวัดหนองบัวลำภู', ministry:'กระทรวงพลังงาน', active:true}
  ];
  
  agencies.forEach((ag, idx) => {
    Object.keys(baseE).forEach(year => {
      THAI_MONTHS.forEach((month, mi) => {
        if (actE[year][mi] > 0) {
          const variance = 0.7 + (idx * 0.15);
          elec.push({
            agency: ag.name, year: +year, month,
            standard: Math.round(baseE[year][mi] * variance * 100)/100,
            actual: Math.round(actE[year][mi] * variance * 100)/100,
            unit: 'หน่วย'
          });
          oil.push({
            agency: ag.name, year: +year, month,
            standard: Math.round(baseO[year][mi] * variance * 100)/100,
            actual: Math.round(actO[year][mi] * variance * 100)/100,
            unit: 'ลิตร'
          });
        }
      });
    });
  });
  
  return { electricity: elec, oil: oil, agencies };
}
*/
