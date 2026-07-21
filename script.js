/* ============================================================
   Downer Australia — Driver Self Service Portal
   Client-side logic for 3-screen workflow
   ============================================================ */

// ---------- Mock data (would come from D365 F&O API) ----------
const MOCK_LOADS = [
    {
        id: 'LD-100234',
        route: 'Sydney DC → Newcastle Yard',
        product: 'Ballast Aggregate 20mm',
        weight: 28.5,
        scheduled: '2026-07-21 08:30',
        status: 'Active'
    },
    {
        id: 'LD-100235',
        route: 'Sydney DC → Wollongong Site B',
        product: 'Rail Sleepers (Concrete)',
        weight: 24.0,
        scheduled: '2026-07-21 11:15',
        status: 'Active'
    },
    {
        id: 'LD-100236',
        route: 'Port Botany → Chullora Yard',
        product: 'Signal Equipment Crates',
        weight: 12.3,
        scheduled: '2026-07-21 14:00',
        status: 'Pending'
    },
    {
        id: 'LD-100201',
        route: 'Newcastle Yard → Maitland Depot',
        product: 'Track Ballast',
        weight: 30.0,
        scheduled: '2026-07-20 09:00',
        status: 'Completed'
    }
];

// ---------- State ----------
const state = {
    driverId: '',
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
        const val = input.value.trim();
        // Simple non-empty + min length validation.
        // Alphanumeric, hyphens allowed. Adjust to your real ID format.
        if (!/^[A-Za-z0-9\-]{4,}$/.test(val)) {
            err.hidden = false;
            input.focus();
            return;
        }
        err.hidden = true;
        state.driverId = val.toUpperCase();

        // Update header + badge
        $('#headerRight').textContent = 'Driver: ' + state.driverId;
        $('#driverBadge').textContent = state.driverId;

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

    MOCK_LOADS.forEach(load => {
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
    const load = MOCK_LOADS.find(l => l.id === state.selectedLoadId);
    if (!load) return;

    const html = `
        <h3>Load Details</h3>
        <div class="detail-row"><span class="label">Load ID</span><span class="value">${load.id}</span></div>
        <div class="detail-row"><span class="label">Route</span><span class="value">${load.route}</span></div>
        <div class="detail-row"><span class="label">Product</span><span class="value">${load.product}</span></div>
        <div class="detail-row"><span class="label">Weight</span><span class="value">${load.weight.toFixed(1)} tonnes</span></div>
        <div class="detail-row"><span class="label">Scheduled</span><span class="value">${load.scheduled}</span></div>
        <div class="detail-row"><span class="label">Assigned To</span><span class="value">${state.driverId}</span></div>
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
function doPrint() {
    const load = MOCK_LOADS.find(l => l.id === state.selectedLoadId);
    if (!load) return;

    const now = new Date();
    const docketNo = 'DKT-' + now.getTime().toString().slice(-8);

    // Fill printable area
    $('#printDocketNo').textContent = 'Docket #: ' + docketNo;
    $('#printDriver').innerHTML =
        '<strong>Driver ID / Licence:</strong> ' + state.driverId;
    $('#printLoad').innerHTML = `
        <div><strong>Load ID:</strong> ${load.id}</div>
        <div><strong>Route:</strong> ${load.route}</div>
        <div><strong>Product:</strong> ${load.product}</div>
        <div><strong>Weight:</strong> ${load.weight.toFixed(1)} tonnes</div>
        <div><strong>Scheduled:</strong> ${load.scheduled}</div>
        <div><strong>Status:</strong> ${load.status}</div>
    `;
    $('#printSigImg').src = sigPad.toDataURL('image/png');
    $('#printTimestamp').textContent =
        'Signed at: ' + now.toLocaleString('en-AU');

    // Trigger browser print dialog
    window.print();
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
