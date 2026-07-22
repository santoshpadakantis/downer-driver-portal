/* ============================================================
   Downer Australia — Driver Self Service Portal
   Client-side logic for 3-screen workflow
   ============================================================ */

// ---------- Reference data (would come from D365 F&O in production) ----------

// The three approved product codes
const PROD = {
    PMB:  'PMB A15R wet blend CR15%',
    AC20: 'AC20M 30% RAP C450',
    AC10: 'AC10M R117 25% RAP C450'
};

// Customer directory: short-key -> { name, address }
const CUSTOMERS = {
    METRO: {
        name: 'Metro Civil Pty Ltd',
        address: '45 Parramatta Road, Homebush West NSW 2140, Australia'
    },
    QUICKSEAL: {
        name: 'QuickSeal Spray',
        address: '12 Industrial Drive, Dandenong South VIC 3175, Australia'
    },
    REGIONAL: {
        name: 'Regional Roads Co',
        address: 'Unit 3, 88 Boundary Road, Yatala QLD 4207, Australia'
    }
};

// Driver directory: Driver ID -> full name
const DRIVERS = {
    'DR-01': 'Jack Thompson',
    'DR-02': 'Priya Nair',
    'DR-03': "Liam O'Brien",
    'DR-04': 'Mei Nguyen',
    'DR-05': 'Ethan Williams',
    'DR-06': 'Noah Papadopoulos',
    'DR-07': 'Ava Wiradjuri',
    'DR-08': 'Rajesh Kumar',
    'DR-09': 'Sofia Costa',
    'DR-10': 'Marcus Chen'
};

// Per-driver load allocation. Each driver gets a unique set of USMF loads.
// Each load carries: product, customer, and a Customer Order (CO-#####) number.
const LOADS_BY_DRIVER = {
    'DR-01': [
        { id: 'USMF-1001', route: 'Sydney DC → Parramatta Site',      product: PROD.PMB,  weight: 28.5, scheduled: '2026-07-22 08:00', status: 'Active',    customer: CUSTOMERS.METRO,     customerOrder: 'CO-88274' },
        { id: 'USMF-1002', route: 'Sydney DC → Wollongong Site B',    product: PROD.AC20, weight: 24.0, scheduled: '2026-07-22 11:15', status: 'Active',    customer: CUSTOMERS.METRO,     customerOrder: 'CO-88291' },
        { id: 'USMF-1003', route: 'Sydney DC → Newcastle Yard',       product: PROD.AC10, weight: 26.0, scheduled: '2026-07-21 14:00', status: 'Completed', customer: CUSTOMERS.QUICKSEAL, customerOrder: 'CO-88175' }
    ],
    'DR-02': [
        { id: 'USMF-1010', route: 'Melbourne DC → Geelong Yard',      product: PROD.AC20, weight: 27.0, scheduled: '2026-07-22 07:30', status: 'Active',    customer: CUSTOMERS.QUICKSEAL, customerOrder: 'CO-90112' },
        { id: 'USMF-1011', route: 'Melbourne DC → Ballarat Depot',    product: PROD.PMB,  weight: 22.5, scheduled: '2026-07-22 13:00', status: 'Pending',   customer: CUSTOMERS.QUICKSEAL, customerOrder: 'CO-90118' },
        { id: 'USMF-1012', route: 'Geelong Yard → Werribee Site',     product: PROD.AC10, weight: 25.0, scheduled: '2026-07-21 09:15', status: 'Completed', customer: CUSTOMERS.QUICKSEAL, customerOrder: 'CO-90007' }
    ],
    'DR-03': [
        { id: 'USMF-1020', route: 'Brisbane North → Toowoomba Depot', product: PROD.PMB,  weight: 29.0, scheduled: '2026-07-22 06:45', status: 'Active',    customer: CUSTOMERS.REGIONAL,  customerOrder: 'CO-77455' },
        { id: 'USMF-1021', route: 'Brisbane North → Ipswich Yard',    product: PROD.AC10, weight: 24.5, scheduled: '2026-07-22 12:00', status: 'Active',    customer: CUSTOMERS.REGIONAL,  customerOrder: 'CO-77462' },
        { id: 'USMF-1022', route: 'Toowoomba → Warwick Site',         product: PROD.AC20, weight: 23.0, scheduled: '2026-07-23 08:00', status: 'Pending',   customer: CUSTOMERS.REGIONAL,  customerOrder: 'CO-77501' }
    ],
    'DR-04': [
        { id: 'USMF-1030', route: 'Perth DC → Fremantle Yard',        product: PROD.AC20, weight: 28.0, scheduled: '2026-07-22 09:00', status: 'Active',    customer: CUSTOMERS.REGIONAL,  customerOrder: 'CO-65128' },
        { id: 'USMF-1031', route: 'Perth DC → Rockingham Site',       product: PROD.PMB,  weight: 25.5, scheduled: '2026-07-22 15:30', status: 'Pending',   customer: CUSTOMERS.METRO,     customerOrder: 'CO-65134' },
        { id: 'USMF-1032', route: 'Fremantle → Kwinana Yard',         product: PROD.AC10, weight: 26.5, scheduled: '2026-07-21 11:00', status: 'Completed', customer: CUSTOMERS.REGIONAL,  customerOrder: 'CO-65099' }
    ],
    'DR-05': [
        { id: 'USMF-1040', route: 'Adelaide DC → Mount Barker Site',  product: PROD.AC10, weight: 27.5, scheduled: '2026-07-22 08:15', status: 'Active',    customer: CUSTOMERS.METRO,     customerOrder: 'CO-71304' },
        { id: 'USMF-1041', route: 'Adelaide DC → Port Adelaide Yard', product: PROD.PMB,  weight: 24.0, scheduled: '2026-07-22 13:45', status: 'Active',    customer: CUSTOMERS.REGIONAL,  customerOrder: 'CO-71310' },
        { id: 'USMF-1042', route: 'Mount Barker → Murray Bridge',     product: PROD.AC20, weight: 23.5, scheduled: '2026-07-23 07:30', status: 'Pending',   customer: CUSTOMERS.METRO,     customerOrder: 'CO-71322' }
    ],
    'DR-06': [
        { id: 'USMF-1050', route: 'Sydney DC → Bankstown Site',       product: PROD.PMB,  weight: 26.0, scheduled: '2026-07-22 06:00', status: 'Active',    customer: CUSTOMERS.METRO,     customerOrder: 'CO-88301' },
        { id: 'USMF-1051', route: 'Port Botany → Chullora Yard',      product: PROD.AC20, weight: 29.5, scheduled: '2026-07-22 10:30', status: 'Active',    customer: CUSTOMERS.METRO,     customerOrder: 'CO-88318' },
        { id: 'USMF-1052', route: 'Sydney DC → Liverpool Depot',      product: PROD.AC10, weight: 25.0, scheduled: '2026-07-20 15:00', status: 'Completed', customer: CUSTOMERS.METRO,     customerOrder: 'CO-88266' }
    ],
    'DR-07': [
        { id: 'USMF-1060', route: 'Newcastle → Maitland Depot',       product: PROD.AC10, weight: 28.5, scheduled: '2026-07-22 07:00', status: 'Active',    customer: CUSTOMERS.METRO,     customerOrder: 'CO-88208' },
        { id: 'USMF-1061', route: 'Newcastle → Charlestown Site',     product: PROD.PMB,  weight: 22.0, scheduled: '2026-07-22 12:15', status: 'Pending',   customer: CUSTOMERS.QUICKSEAL, customerOrder: 'CO-88214' },
        { id: 'USMF-1062', route: 'Newcastle → Cardiff Yard',         product: PROD.AC20, weight: 24.5, scheduled: '2026-07-21 08:45', status: 'Completed', customer: CUSTOMERS.METRO,     customerOrder: 'CO-88155' }
    ],
    'DR-08': [
        { id: 'USMF-1070', route: 'Melbourne DC → Dandenong Yard',    product: PROD.AC20, weight: 30.0, scheduled: '2026-07-22 05:45', status: 'Active',    customer: CUSTOMERS.QUICKSEAL, customerOrder: 'CO-90201' },
        { id: 'USMF-1071', route: 'Melbourne DC → Frankston Site',    product: PROD.AC10, weight: 26.0, scheduled: '2026-07-22 11:00', status: 'Active',    customer: CUSTOMERS.QUICKSEAL, customerOrder: 'CO-90214' },
        { id: 'USMF-1072', route: 'Melbourne DC → Sunbury Depot',     product: PROD.PMB,  weight: 23.5, scheduled: '2026-07-23 09:15', status: 'Pending',   customer: CUSTOMERS.QUICKSEAL, customerOrder: 'CO-90223' }
    ],
    'DR-09': [
        { id: 'USMF-1080', route: 'Brisbane North → Gold Coast Yard', product: PROD.PMB,  weight: 27.0, scheduled: '2026-07-22 07:30', status: 'Active',    customer: CUSTOMERS.REGIONAL,  customerOrder: 'CO-77522' },
        { id: 'USMF-1081', route: 'Brisbane North → Redcliffe Site',  product: PROD.AC10, weight: 24.0, scheduled: '2026-07-22 14:00', status: 'Pending',   customer: CUSTOMERS.REGIONAL,  customerOrder: 'CO-77530' },
        { id: 'USMF-1082', route: 'Gold Coast → Nerang Depot',        product: PROD.AC20, weight: 25.5, scheduled: '2026-07-20 10:30', status: 'Completed', customer: CUSTOMERS.REGIONAL,  customerOrder: 'CO-77488' }
    ],
    'DR-10': [
        { id: 'USMF-1090', route: 'Sydney DC → Ryde Site',            product: PROD.AC20, weight: 28.0, scheduled: '2026-07-22 06:30', status: 'Active',    customer: CUSTOMERS.METRO,     customerOrder: 'CO-88355' },
        { id: 'USMF-1091', route: 'Sydney DC → Hornsby Depot',        product: PROD.PMB,  weight: 25.5, scheduled: '2026-07-22 12:45', status: 'Active',    customer: CUSTOMERS.QUICKSEAL, customerOrder: 'CO-88367' },
        { id: 'USMF-1092', route: 'Sydney DC → Manly Site',           product: PROD.AC10, weight: 22.5, scheduled: '2026-07-23 08:30', status: 'Pending',   customer: CUSTOMERS.METRO,     customerOrder: 'CO-88401' }
    ]
};

function getLoadsForDriver(driverId) {
    return LOADS_BY_DRIVER[driverId] || [];
}

function findLoad(driverId, loadId) {
    return getLoadsForDriver(driverId).find(l => l.id === loadId);
}

// ---------- State ----------
const state = {
    driverId: '',
    driverName: '',
    selectedLoadId: null
};

// ---------- Utilities ----------
function $(sel) { return document.querySelector(sel); }
function $all(sel) { return document.querySelectorAll(sel); }

function goToScreen(n) {
    $all('.screen').forEach(s => s.classList.remove('active'));
    $('#screen-' + n).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setYear() {
    const y = new Date().getFullYear();
    const el = document.getElementById('year');
    if (el) el.textContent = y;
    $all('.year-slot').forEach(s => s.textContent = y);
}

// ============================================================
// SCREEN 1 — Login
// ============================================================
function initLogin() {
    const form = $('#loginForm');
    const input = $('#driverId');
    const err = $('#loginError');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = input.value.trim().toUpperCase();

        // Accept both 'DR-01' and 'DR01' by inserting the missing hyphen.
        const normalised = /^DR\d+$/.test(raw)
            ? raw.replace(/^DR/, 'DR-')
            : raw;

        if (!/^[A-Z0-9\-]{4,}$/.test(normalised)) {
            err.textContent = 'Please enter a valid Driver ID (e.g. DR-01).';
            err.hidden = false;
            input.focus();
            return;
        }

        const name = DRIVERS[normalised];
        if (!name) {
            err.textContent = 'Driver ID not recognised. Valid IDs are DR-01 to DR-10.';
            err.hidden = false;
            input.focus();
            input.select();
            return;
        }

        err.hidden = true;
        state.driverId   = normalised;
        state.driverName = name;

        // Update header + badge (name + ID)
        $('#headerRight').textContent = state.driverName + ' (' + state.driverId + ')';
        $('#driverBadge').textContent = state.driverName + ' (' + state.driverId + ')';

        renderLoads();
        goToScreen(2);
    });
}

// ============================================================
// SCREEN 2 — Loads list
// ============================================================
function renderLoads() {
    const body = $('#loadsBody');
    body.innerHTML = '';

    const loads = getLoadsForDriver(state.driverId);

    if (loads.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" style="text-align:center;padding:24px;color:#6B7280;">No loads assigned to this driver.</td>';
        body.appendChild(tr);
    } else {
        loads.forEach(load => {
            const tr = document.createElement('tr');
            const isSelectable = (load.status === 'Active');
            if (!isSelectable) tr.classList.add('inactive');
            tr.dataset.loadId = load.id;

            const badgeClass =
                load.status === 'Active'    ? 'badge-active' :
                load.status === 'Pending'   ? 'badge-pending' :
                                              'badge-complete';

            tr.innerHTML = `
                <td>
                    <input type="radio" name="loadPick"
                           value="${load.id}"
                           ${isSelectable ? '' : 'disabled'}
                           aria-label="Select load ${load.id}" />
                </td>
                <td><strong>${load.id}</strong></td>
                <td>${load.route}</td>
                <td>${load.product}</td>
                <td>${load.weight.toFixed(1)}</td>
                <td>${load.scheduled}</td>
                <td><span class="badge ${badgeClass}">${load.status}</span></td>
            `;

            if (isSelectable) {
                tr.addEventListener('click', () => {
                    const radio = tr.querySelector('input[type=radio]');
                    radio.checked = true;
                    onLoadSelected(load.id);
                });
            }
            body.appendChild(tr);
        });
    }

    // Reset selection state
    state.selectedLoadId = null;
    $('#proceedBtn').disabled = true;
    $('#selectionHint').textContent = 'Select an active load to continue.';
    $all('#loadsBody tr').forEach(r => r.classList.remove('selected'));
}

function onLoadSelected(loadId) {
    state.selectedLoadId = loadId;
    $all('#loadsBody tr').forEach(r => {
        r.classList.toggle('selected', r.dataset.loadId === loadId);
    });
    $('#proceedBtn').disabled = false;
    $('#selectionHint').textContent = 'Load ' + loadId + ' selected.';
}

function initLoadsScreen() {
    $('#backToLogin').addEventListener('click', () => {
        state.driverId = '';
        state.driverName = '';
        state.selectedLoadId = null;
        $('#driverId').value = '';
        $('#headerRight').textContent = '';
        goToScreen(1);
    });

    $('#proceedBtn').addEventListener('click', () => {
        if (!state.selectedLoadId) return;
        renderAckDetails();
        // Reset the checkbox each time we enter Screen 3
        $('#agreeChk').checked = false;
        // IMPORTANT: navigate first so the canvas is visible,
        // THEN size it (a hidden canvas measures 0x0).
        goToScreen(3);
        resizeSignaturePad();
        resetSignature();
        updatePrintButton();
    });
}

// ============================================================
// SCREEN 3 — Acknowledgement + Signature + Print
// ============================================================
function renderAckDetails() {
    const load = findLoad(state.driverId, state.selectedLoadId);
    if (!load) return;

    const html = `
        <h3>Load Details</h3>
        <div class="detail-row"><span class="label">Load ID</span><span class="value">${load.id}</span></div>
        <div class="detail-row"><span class="label">Customer Order</span><span class="value">${load.customerOrder}</span></div>
        <div class="detail-row"><span class="label">Customer</span><span class="value">${load.customer.name}</span></div>
        <div class="detail-row"><span class="label">Deliver To</span><span class="value" style="max-width:60%;">${load.customer.address}</span></div>
        <div class="detail-row"><span class="label">Route</span><span class="value">${load.route}</span></div>
        <div class="detail-row"><span class="label">Product</span><span class="value">${load.product}</span></div>
        <div class="detail-row"><span class="label">Weight</span><span class="value">${load.weight.toFixed(1)} tonnes</span></div>
        <div class="detail-row"><span class="label">Scheduled</span><span class="value">${load.scheduled}</span></div>
        <div class="detail-row"><span class="label">Assigned To</span><span class="value">${state.driverName} (${state.driverId})</span></div>
        <div class="detail-row"><span class="label">Status</span><span class="value">${load.status}</span></div>
    `;
    $('#ackDetails').innerHTML = html;
}

// ---------- Signature Pad (canvas) ----------
let sigCtx, sigPad, drawing = false, hasSignature = false;
let lastX = 0, lastY = 0;
let sigDpr = 1;

// Size (or re-size) the canvas backing store to match its CSS box.
// Must be called AFTER the containing screen is visible, otherwise
// getBoundingClientRect() returns 0x0 and the canvas cannot draw.
function resizeSignaturePad() {
    if (!sigPad) return;
    const rect = sigPad.getBoundingClientRect();
    if (rect.width === 0) return; // still hidden
    sigDpr = window.devicePixelRatio || 1;
    sigPad.width  = Math.round(rect.width * sigDpr);
    sigPad.height = Math.round(220 * sigDpr);
    // Reset transform then apply DPR scale
    sigCtx.setTransform(1, 0, 0, 1, 0, 0);
    sigCtx.scale(sigDpr, sigDpr);
    sigCtx.lineWidth = 2.2;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';
    sigCtx.strokeStyle = '#111827';
}

function initSignaturePad() {
    sigPad = $('#sigPad');
    sigCtx = sigPad.getContext('2d');

    window.addEventListener('resize', () => {
        // Only re-init if we're currently on Screen 3
        if ($('#screen-3').classList.contains('active')) {
            resizeSignaturePad();
            resetSignature();
        }
    });

    // --- Pointer events cover mouse, touch, pen ---
    sigPad.addEventListener('pointerdown', startDraw);
    sigPad.addEventListener('pointermove', draw);
    sigPad.addEventListener('pointerup', endDraw);
    sigPad.addEventListener('pointerleave', endDraw);
    // Prevent the browser from turning touch into scroll/zoom on the pad
    sigPad.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    sigPad.addEventListener('touchmove',  (e) => e.preventDefault(), { passive: false });

    $('#clearSig').addEventListener('click', resetSignature);
    $('#agreeChk').addEventListener('change', updatePrintButton);

    $('#backToLoads').addEventListener('click', () => {
        goToScreen(2);
    });

    $('#printBtn').addEventListener('click', doPrint);
}

function getPos(e) {
    const rect = sigPad.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function startDraw(e) {
    drawing = true;
    sigPad.setPointerCapture(e.pointerId);
    const p = getPos(e);
    lastX = p.x; lastY = p.y;
    sigCtx.beginPath();
    sigCtx.moveTo(lastX, lastY);
}

function draw(e) {
    if (!drawing) return;
    const p = getPos(e);
    sigCtx.lineTo(p.x, p.y);
    sigCtx.stroke();
    lastX = p.x; lastY = p.y;
    hasSignature = true;
    updatePrintButton();
}

function endDraw(e) {
    if (!drawing) return;
    drawing = false;
    try { sigPad.releasePointerCapture(e.pointerId); } catch(_) {}
    sigCtx.closePath();
}

function resetSignature() {
    if (!sigCtx) return;
    sigCtx.setTransform(1, 0, 0, 1, 0, 0);
    sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);
    sigCtx.scale(sigDpr, sigDpr);
    sigCtx.lineWidth = 2.2;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';
    sigCtx.strokeStyle = '#111827';
    hasSignature = false;
    updatePrintButton();
}

function updatePrintButton() {
    const agreed = $('#agreeChk').checked;
    $('#printBtn').disabled = !(agreed && hasSignature);
}

// ---------- Print Docket ----------
// Opens a dedicated, self-contained window containing only the dispatch
// docket and triggers the print dialog on it. This is more reliable across
// browsers than an in-page @media print approach and also lets the user
// Save-as-PDF from the same dialog.
function doPrint() {
    const load = findLoad(state.driverId, state.selectedLoadId);
    if (!load) {
        alert('No load is selected. Please go back and select a load.');
        return;
    }
    if (!hasSignature) {
        alert('Please sign in the signature box before printing.');
        return;
    }

    const now = new Date();
    const docketNo = 'DKT-' + now.getTime().toString().slice(-8);
    const signedAt = now.toLocaleString('en-AU');
    let sigDataUrl;
    try {
        sigDataUrl = sigPad.toDataURL('image/png');
    } catch (err) {
        alert('Could not capture signature: ' + err.message);
        return;
    }

    const esc = (s) => String(s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Dispatch Docket ${esc(docketNo)}</title>
<style>
    * { box-sizing: border-box; }
    body {
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #1D1D1B;
        margin: 24px 32px;
        font-size: 13px;
    }
    .print-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 4px solid #00BCE7;
        padding-bottom: 12px;
        margin-bottom: 20px;
    }
    .brand {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-size: 26px;
        font-weight: 700;
        letter-spacing: -0.5px;
    }
    .brand-flag {
        display: inline-grid;
        grid-template-columns: 14px 14px;
        grid-gap: 3px;
    }
    .brand-flag span {
        display: block; width: 14px; height: 14px;
    }
    .brand-flag .c { background: #00BCE7; }
    .brand-flag .l { background: #A6E048; }
    .docket-no {
        text-align: right;
    }
    .docket-no h2 {
        margin: 0 0 4px 0; font-size: 20px;
    }
    .docket-no .muted {
        color: #6B7280; font-size: 12px;
    }
    .print-section { margin-bottom: 18px; }
    .print-section h4 {
        margin: 0 0 8px 0;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.5px;
        color: #4A4A4A;
        border-bottom: 1px solid #ccc;
        padding-bottom: 4px;
    }
    .kv { display: grid; grid-template-columns: 160px 1fr; row-gap: 4px; }
    .kv .k { color: #6B7280; }
    .kv .v { font-weight: 600; }
    .sig-box {
        border: 1px solid #ccc;
        border-radius: 6px;
        padding: 8px;
        max-width: 500px;
    }
    .sig-box img {
        display: block;
        max-width: 100%;
        max-height: 140px;
    }
    .sig-caption {
        margin-top: 6px;
        color: #6B7280;
        font-size: 11px;
    }
    .print-footer {
        margin-top: 40px;
        border-top: 1px solid #ccc;
        padding-top: 8px;
        font-size: 10px;
        color: #6B7280;
        display: flex;
        justify-content: space-between;
    }
    /* Two-column layout for Deliver To + Load details */
    .two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
    }
    /* Barcode section */
    .barcodes {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-top: 4px;
    }
    .barcode-block {
        border: 1px solid #E4E7E4;
        border-radius: 6px;
        padding: 10px 12px;
        text-align: center;
    }
    .barcode-block .bc-label {
        display: block;
        text-transform: uppercase;
        font-size: 10px;
        letter-spacing: 0.5px;
        color: #6B7280;
        margin-bottom: 6px;
    }
    .barcode-block svg {
        display: block;
        margin: 0 auto;
        max-width: 100%;
        height: auto;
    }
    @media print {
        body { margin: 12mm; }
        .no-print { display: none !important; }
    }
    .toolbar {
        text-align: right;
        margin-bottom: 12px;
    }
    .toolbar button {
        background: #00BCE7;
        color: #1D1D1B;
        border: none;
        padding: 8px 16px;
        border-radius: 999px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
    }
    .toolbar button:hover { background: #009EC4; color: #fff; }
</style>
</head>
<body>
    <div class="toolbar no-print">
        <button onclick="window.print()">Print / Save as PDF</button>
        <button onclick="window.close()" style="background:transparent;border:1px solid #ccc;">Close</button>
    </div>

    <div class="print-header">
        <div class="brand">
            <span>Downer</span>
            <span class="brand-flag">
                <span class="c"></span><span class="l"></span>
                <span class="l"></span><span></span>
            </span>
        </div>
        <div class="docket-no">
            <h2>Dispatch Docket</h2>
            <div class="muted">Docket #: ${esc(docketNo)}</div>
            <div class="muted">Issued: ${esc(signedAt)}</div>
        </div>
    </div>

    <div class="print-section">
        <h4>Deliver To</h4>
        <div class="kv">
            <div class="k">Customer</div><div class="v">${esc(load.customer.name)}</div>
            <div class="k">Address</div><div class="v">${esc(load.customer.address)}</div>
            <div class="k">Customer Order</div><div class="v">${esc(load.customerOrder)}</div>
        </div>
    </div>

    <div class="print-section">
        <h4>Driver</h4>
        <div class="kv">
            <div class="k">Driver Name</div><div class="v">${esc(state.driverName)}</div>
            <div class="k">Driver ID</div><div class="v">${esc(state.driverId)}</div>
        </div>
    </div>

    <div class="print-section">
        <h4>Load Details</h4>
        <div class="kv">
            <div class="k">Load ID</div><div class="v">${esc(load.id)}</div>
            <div class="k">Route</div><div class="v">${esc(load.route)}</div>
            <div class="k">Product</div><div class="v">${esc(load.product)}</div>
            <div class="k">Weight</div><div class="v">${load.weight.toFixed(1)} tonnes</div>
            <div class="k">Scheduled</div><div class="v">${esc(load.scheduled)}</div>
            <div class="k">Status</div><div class="v">${esc(load.status)}</div>
        </div>
    </div>

    <div class="print-section">
        <h4>Barcodes (Code 128)</h4>
        <div class="barcodes">
            <div class="barcode-block">
                <span class="bc-label">Load Number</span>
                <svg id="bcLoad"></svg>
            </div>
            <div class="barcode-block">
                <span class="bc-label">Customer Order</span>
                <svg id="bcOrder"></svg>
            </div>
        </div>
    </div>

    <div class="print-section">
        <h4>Declaration Acknowledged</h4>
        <div>
            The driver has acknowledged the declaration and confirmed vehicle
            inspection, load restraint, fatigue-management compliance, and load
            accuracy, and accepts responsibility for safe delivery per Downer's
            HSE policies.
        </div>
    </div>

    <div class="print-section">
        <h4>Driver Signature</h4>
        <div class="sig-box">
            <img src="${sigDataUrl}" alt="Driver signature" />
        </div>
        <div class="sig-caption">Signed at: ${esc(signedAt)}</div>
    </div>

    <div class="print-footer">
        <span>Generated by Downer Driver Self Service Portal</span>
        <span>${esc(docketNo)}</span>
    </div>

<!-- JsBarcode (Code128 renderer). Loaded from CDN. -->
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<script>
    // Auto-open the print dialog once the signature image + barcodes are ready.
    (function(){
        var img = document.querySelector('.sig-box img');
        var sigReady = false, bcReady = false;

        function tryPrint() {
            if (!sigReady || !bcReady) return;
            setTimeout(function(){
                try { window.focus(); window.print(); } catch(_) {}
            }, 200);
        }

        // Render barcodes when JsBarcode is available (poll briefly if the
        // CDN script hasn't finished loading yet).
        function renderBarcodes() {
            if (typeof JsBarcode === 'undefined') {
                setTimeout(renderBarcodes, 100);
                return;
            }
            try {
                JsBarcode('#bcLoad',  ${JSON.stringify(load.id)}, {
                    format: 'CODE128',
                    width: 2,
                    height: 60,
                    fontSize: 14,
                    margin: 4,
                    displayValue: true
                });
                JsBarcode('#bcOrder', ${JSON.stringify(load.customerOrder)}, {
                    format: 'CODE128',
                    width: 2,
                    height: 60,
                    fontSize: 14,
                    margin: 4,
                    displayValue: true
                });
            } catch (e) { /* fall through — still allow print */ }
            bcReady = true;
            tryPrint();
        }
        renderBarcodes();

        if (img && !img.complete) {
            img.addEventListener('load',  function(){ sigReady = true; tryPrint(); });
            img.addEventListener('error', function(){ sigReady = true; tryPrint(); });
        } else {
            sigReady = true;
            tryPrint();
        }
    })();
<\/script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=900,height=1000');
    if (!w) {
        alert(
            'The print window was blocked by your browser.\n\n' +
            'Please allow pop-ups for this site and try again.'
        );
        return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
}

// ============================================================
// Bootstrap
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    setYear();
    initLogin();
    initLoadsScreen();
    initSignaturePad();
});
