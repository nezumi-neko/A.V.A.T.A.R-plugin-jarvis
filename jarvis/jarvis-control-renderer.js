// Renderer Chromium — pas de Node.js ici

function setBar(id, v) {
    const b = document.getElementById(id);
    if (!b) return;
    b.style.width = `${Math.min(v, 100)}%`;
    b.className = 'bar-fill' + (v >= 80 ? ' high' : v >= 60 ? ' medium' : '');
}

function updateStats(data) {
    if (!data) return;
    document.getElementById('val-cpu').textContent  = `${data.cpu}%`;
    document.getElementById('val-ram').textContent  = `${data.ram}%`;
    document.getElementById('val-uptime').textContent = data.uptime || '—';
    const pm = { win32:'Windows', darwin:'macOS', linux:'Linux' };
    document.getElementById('val-platform').textContent = pm[data.platform] || data.platform || '—';
    if (data.totalRam !== undefined) {
        const used = data.totalRam - (data.freeRam || 0);
        document.getElementById('sub-ram').textContent = `${used} Go / ${data.totalRam} Go`;
    }
    setBar('bar-cpu', data.cpu);
    setBar('bar-ram', data.ram);
    const n = new Date();
    document.getElementById('footer').textContent =
        `Actualisé ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`;
}

// Refresh toutes les 5s
let timer = null;
function startRefresh() {
    if (timer) return;
    timer = setInterval(async () => {
        try { updateStats(await window.jarvisControlAPI.getData()); } catch {}
    }, 5000);
}

// Boutons — confirmation pour les actions dangereuses
const DANGER = new Set(['shutdownsystem', 'restartsystem', 'restartall']);

document.querySelectorAll('.btn[data-action]').forEach(btn => {
    const action   = btn.dataset.action;
    const origHTML = btn.innerHTML;

    btn.addEventListener('click', () => {
        if (DANGER.has(action)) {
            if (!btn.dataset.confirming) {
                btn.dataset.confirming = '1';
                btn.innerHTML = '<span class="ico">⚠️</span><span class="lbl">Confirmer ?</span>';
                btn.style.borderColor = '#f85149';
                setTimeout(() => {
                    delete btn.dataset.confirming;
                    btn.innerHTML = origHTML;
                    btn.style.borderColor = '';
                }, 3000);
                return;
            }
            delete btn.dataset.confirming;
            btn.innerHTML = origHTML;
            btn.style.borderColor = '';
        }
        // Feedback visuel
        btn.style.opacity = '0.5';
        setTimeout(() => { btn.style.opacity = ''; }, 300);
        window.jarvisControlAPI.doAction(action);
    });
});

// Bouton fermeture
document.getElementById('closeBtn').addEventListener('click', () => {
    if (timer) clearInterval(timer);
    window.jarvisControlAPI.close();
});
window.onbeforeunload = (e) => {
    e.returnValue = false;
    if (timer) clearInterval(timer);
    window.jarvisControlAPI.close();
};

// Init
window.jarvisControlAPI.onInit(data => { updateStats(data); startRefresh(); });
window.jarvisControlAPI.onUpdate(data => { updateStats(data); });
