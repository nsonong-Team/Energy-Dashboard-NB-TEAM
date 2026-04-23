// ==================== FORM ====================
function fillExistingData() {
  const agency = document.getElementById('fAgency').value;
  const year = Number(document.getElementById('fYear').value);
  const month = document.getElementById('fMonth').value;
  const type = document.getElementById('fType').value;

  if (!allData) return;
  
  const source = type === 'elec' ? allData.electricity : allData.oil;
  
  const existing = source.find(r => 
    String(r.agency) === String(agency) && 
    Number(r.year) === year && 
    r.month === month
  );

  if (existing) {
    document.getElementById('fStd').value = existing.standard;
    document.getElementById('fAct').value = existing.actual;
    const saveBtn = document.querySelector('#formModal .btn-primary');
    if (saveBtn) saveBtn.innerHTML = '💾 อัปเดตข้อมูลเดิม';
  } else {
    document.getElementById('fStd').value = '';
    document.getElementById('fAct').value = '';
    const saveBtn = document.querySelector('#formModal .btn-primary');
    if (saveBtn) saveBtn.innerHTML = '💾 บันทึก';
  }
}

document.getElementById('fAgency').addEventListener('change', fillExistingData);
document.getElementById('fYear').addEventListener('change', fillExistingData);
document.getElementById('fMonth').addEventListener('change', fillExistingData);
document.getElementById('fType').addEventListener('change', fillExistingData);


function openForm() {
  document.getElementById('formModal').classList.add('active');
  if (currentUser) {
    showFormStep();
  } else {
    document.getElementById('loginStep').style.display = 'block';
    document.getElementById('formStep').style.display = 'none';
  }
}

function closeForm() {
  document.getElementById('formModal').classList.remove('active');
}

async function doLogin() {
  const code = document.getElementById('loginCode').value.trim().toUpperCase();
  const pin = document.getElementById('loginPin').value.trim();

  if (!code || !pin) { 
    toast('กรอกรหัสหน่วยงานและ PIN', 'error'); 
    return; 
  }

  const agencyFound = allData.agencies.find(a => a.code === code);
  
  if (!agencyFound && code !== 'ADMIN') {
    toast('❌ ไม่พบรหัสหน่วยงานนี้ในระบบ (กรุณาใช้ NBLxxx)', 'error');
    return;
  }

  if (API_URL.includes('YOUR_DEPLOYMENT_ID')) {
    currentUser = { 
      code: code, 
      isAdmin: code === 'ADMIN' 
    };
    toast('✓ เข้าสู่ระบบ (demo mode)', 'success');
    showFormStep();
    return;
  }
  
  toggleLoader(true, 'กำลังตรวจสอบ...');
  try {
    const res = await jsonp({ action: 'verify', code, pin });
    if (res.success) {
      currentUser = { code: res.code, isAdmin: res.isAdmin };
      toast('✓ เข้าสู่ระบบสำเร็จ', 'success');
      showFormStep();
    } else {
      toast('❌ ' + (res.error || 'PIN ไม่ถูกต้อง'), 'error');
    }
  } catch(e) {
    toast('❌ ' + e.message, 'error');
  } finally {
    toggleLoader(false);
  }
}

function backToLogin() {
  document.getElementById('formStep').style.display = 'none';
  document.getElementById('loginStep').style.display = 'block';

  document.getElementById('loginCode').value = '';
  document.getElementById('loginPin').value = '';
  currentUser = null;
}


function showFormStep() {
  document.getElementById('loginStep').style.display = 'none';
  document.getElementById('formStep').style.display = 'block';
  
  // ถ้าไม่ใช่ admin lock เลือกหน่วยงานไว้
  const fAgency = document.getElementById('fAgency');
  if (currentUser && !currentUser.isAdmin) {
    const agency = allData.agencies.find(a => a.code === currentUser.code);
    if (agency) {
      fAgency.value = agency.name;
      fAgency.disabled = true;
    }
  } else {
    fAgency.disabled = false;
  }
  
  // Default: ปีและเดือนปัจจุบัน
  document.getElementById('fType').value = mode;
}


async function saveRecord() {
  const stdVal = document.getElementById('fStd').value;
  const actVal = document.getElementById('fAct').value;

  if (stdVal === "" || actVal === "") {
    toast('⚠️ กรุณากรอก "ค่ามาตรฐาน" และ "ใช้จริง"', 'error');
    return;
  }

  const payload = {
    type: document.getElementById('fType').value,
    agency: document.getElementById('fAgency').value,
    year: Number(document.getElementById('fYear').value),
    month: document.getElementById('fMonth').value,
    standard: Number(stdVal),
    actual: Number(actVal),
    unit: document.getElementById('fType').value === 'elec' ? 'หน่วย' : 'ลิตร',
    user: currentUser?.code || ''
  };
  
  if (
    !payload.agency || 
    !payload.month || 
    stdVal === '' ||
    actVal === '' ||
    isNaN(payload.standard) || 
    isNaN(payload.actual)
  ) {
    toast('กรอกข้อมูลให้ครบ', 'error');
    return;
  }

  if (payload.standard < 0 || payload.actual < 0) {
    toast('❌ ค่ามาตรฐานและค่าที่ใช้จริงต้องไม่ติดลบ', 'error');
    return;
  }
  
  toggleLoader(true, 'กำลังบันทึก...');
  try {
    if (API_URL.includes('YOUR_DEPLOYMENT_ID')) {
      toast('⚠️ Demo mode - ไม่ได้บันทึกจริง', 'error');
    } else {
      const res = await jsonp({ action: 'save', payload: JSON.stringify(payload) });
      if (res.success) {
        toast('✓ ' + res.message, 'success');
        closeForm();
        await loadData(false);
      } else {
        toast('❌ ' + (res.error || 'บันทึกไม่สำเร็จ'), 'error');
      }
    }
  } catch(e) {
    toast('❌ ' + e.message, 'error');
  } finally {
    toggleLoader(false);
  }
}

async function deleteRecord() {
  if (!confirm('ยืนยันลบข้อมูลนี้?')) return;
  const payload = {
    type: document.getElementById('fType').value,
    agency: document.getElementById('fAgency').value,
    year: Number(document.getElementById('fYear').value),
    month: document.getElementById('fMonth').value,
    user: currentUser?.code || ''
  };
  toggleLoader(true, 'กำลังลบ...');
  try {
    const res = await jsonp({ action: 'delete', payload: JSON.stringify(payload) });
    if (res.success) {
      toast('✓ ' + res.message, 'success');
      closeForm();
      await loadData(false);
    } else {
      toast('❌ ' + (res.error || 'ลบไม่สำเร็จ'), 'error');
    }
  } catch(e) {
    toast('❌ ' + e.message, 'error');
  } finally {
    toggleLoader(false);
  }
}
