// ==================== CONFIG ====================
// !!! แทนที่ URL นี้ด้วย Deployment URL ของ Google Apps Script ของคุณ !!!
const API_URL = 'https://script.google.com/macros/s/AKfycbynywo0eMNDu-C2Xyv5i0xdd2-GJ7nbzsCFs4a5ADeWiSeVe4Ti7IDNNq9Jkr72Pp0XAw/exec';

const THAI_MONTHS = [
  'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม', 
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 
  'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
  'กรกฎาคม', 'สิงหาคม', 'กันยายน'
];

const MONTH_SHORT = [
  'ต.ค.', 'พ.ย.', 'ธ.ค.', 
  'ม.ค.', 'ก.พ.', 'มี.ค.', 
  'เม.ย.', 'พ.ค.', 'มิ.ย.', 
  'ก.ค.', 'ส.ค.', 'ก.ย.'
];

// STATE
let mode = 'elec'; // 'elec' | 'oil'
let allData = { electricity: [], oil: [], agencies: [] };
let currentUser = null; // {code, isAdmin}
let charts = {};
