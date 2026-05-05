(() => {
  'use strict';

  const QR_PREFIX = 'STC|';
  const $ = id => document.getElementById(id);

  function ready(fn){ document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

  ready(() => {
    insertScreenShell();
    insertButtons();
    patchNavigation();
    setScreen('home');
  });

  function insertScreenShell(){
    const app = $('appView');
    const hero = document.querySelector('.app-hero');
    if(!app || !hero || $('moduleHome')) return;

    const home = document.createElement('section');
    home.id = 'moduleHome';
    home.className = 'module-home no-print';
    home.innerHTML = `
      <p class="eyebrow">Menú principal</p>
      <h2>Residencia Santa Teresa</h2>
      <p class="lead">Elige qué quieres hacer. Cada apartado tiene su propia pantalla para que la app sea más clara en móvil y tablet.</p>
      <div class="module-actions">
        <button id="screenFillBtn" class="module-tile primary-tile" type="button"><span class="ico">✍️</span><strong>Rellenar ficha</strong><span>Crear una ficha nueva con pasos guiados.</span></button>
        <button id="screenDbBtn" class="module-tile" type="button"><span class="ico">📋</span><strong>Base de datos</strong><span>Buscar, abrir y modificar fichas guardadas.</span></button>
        <button id="screenSettingsBtn" class="module-tile" type="button"><span class="ico">⚙️</span><strong>Configuración</strong><span>Copias, contraseña y bloqueo de la app.</span></button>
        <button id="screenQrBtn" class="module-tile" type="button"><span class="ico">▦</span><strong>Escanear QR</strong><span>Abrir una ficha rápidamente con la cámara.</span></button>
      </div>`;
    hero.after(home);

    const title = document.createElement('section');
    title.id = 'moduleTitle';
    title.className = 'module-title no-print';
    title.innerHTML = `<h2 id="moduleTitleText">Pantalla</h2><p id="moduleSubtitle" class="muted">Apartado de trabajo</p>`;
    home.after(title);

    const back = document.createElement('button');
    back.id = 'moduleBackBtn';
    back.className = 'secondary module-back no-print';
    back.type = 'button';
    back.textContent = 'Inicio';
    const actions = document.querySelector('.hero-actions');
    if(actions) actions.prepend(back);

    $('screenFillBtn').onclick = () => { if(typeof clearForm === 'function') clearForm(); setScreen('form'); };
    $('screenDbBtn').onclick = () => setScreen('db');
    $('screenSettingsBtn').onclick = () => setScreen('settings');
    $('screenQrBtn').onclick = openScanner;
    back.onclick = () => setScreen('home');
  }

  function setScreen(screen){
    const app = $('appView');
    if(!app) return;
    app.classList.remove('screen-home','screen-form','screen-db','screen-settings','screen-preview','preview-mode');
    app.classList.add('screen-' + screen);
    const titles = {
      home:['Menú principal','Elige una opción para trabajar.'],
      form:['Rellenar ficha','Completa la ficha paso a paso.'],
      db:['Base de datos','Busca, abre o modifica fichas guardadas.'],
      settings:['Configuración','Copias cifradas, contraseña y seguridad local.'],
      preview:['Vista final','Ficha con el formato visual de impresión.']
    };
    if($('moduleTitleText')) $('moduleTitleText').textContent = titles[screen]?.[0] || 'Pantalla';
    if($('moduleSubtitle')) $('moduleSubtitle').textContent = titles[screen]?.[1] || '';
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function patchNavigation(){
    const heroNew = $('heroNewFichaBtn');
    if(heroNew) heroNew.onclick = () => { if(typeof clearForm === 'function') clearForm(); setScreen('form'); };

    const newBtn = $('newFichaBtn');
    if(newBtn){
      const old = newBtn.onclick;
      newBtn.onclick = e => { if(old) old.call(newBtn,e); setScreen('form'); };
    }

    const previewBtn = $('previewFichaBtn');
    if(previewBtn){
      const old = previewBtn.onclick;
      previewBtn.onclick = e => { if(old) old.call(previewBtn,e); setScreen('preview'); };
    }

    const backToForm = $('backToFormBtn');
    if(backToForm){
      const old = backToForm.onclick;
      backToForm.onclick = e => { if(old) old.call(backToForm,e); setScreen('form'); };
    }

    const previewPrint = $('previewPrintBtn');
    if(previewPrint){
      const old = previewPrint.onclick;
      previewPrint.onclick = e => { setScreen('preview'); if(old) old.call(previewPrint,e); };
    }
  }

  function insertButtons(){
    const toolbar = document.querySelector('.toolbar');
    if(toolbar && !$('scanQrBtn')){
      const scan = document.createElement('button');
      scan.id = 'scanQrBtn';
      scan.className = 'secondary';
      scan.type = 'button';
      scan.textContent = 'Escanear QR';
      scan.onclick = openScanner;
      toolbar.appendChild(scan);
    }
    const editorActions = document.querySelector('.editor-actions');
    if(editorActions && !$('qrFichaBtn')){
      const qr = document.createElement('button');
      qr.id = 'qrFichaBtn';
      qr.className = 'secondary';
      qr.type = 'button';
      qr.textContent = 'QR ficha';
      qr.onclick = showCurrentQr;
      editorActions.insertBefore(qr, editorActions.firstChild);
    }
    const previewActions = document.querySelector('.preview-actions');
    if(previewActions && !$('previewQrBtn')){
      const qr = document.createElement('button');
      qr.id = 'previewQrBtn';
      qr.className = 'secondary';
      qr.type = 'button';
      qr.textContent = 'QR ficha';
      qr.onclick = showCurrentQr;
      previewActions.insertBefore(qr, previewActions.firstChild);
    }
  }

  function currentFicha(){
    if(typeof state === 'undefined' || !state.selectedId) return null;
    return state.residents.find(r => r.id === state.selectedId) || null;
  }

  function showCurrentQr(){
    const ficha = currentFicha();
    if(!ficha){ alert('Guarda primero la ficha para poder generar su QR.'); return; }
    const code = QR_PREFIX + ficha.id;
    showQrModal(ficha, code);
  }

  function showQrModal(ficha, code){
    closeQrModal();
    const modal = document.createElement('div');
    modal.className = 'qr-modal';
    modal.id = 'qrModal';
    modal.innerHTML = `
      <section class="qr-panel" role="dialog" aria-modal="true" aria-label="Código QR de la ficha">
        <h2>QR de ficha</h2>
        <p class="muted">Este QR no contiene datos personales: solo abre esta ficha dentro de la base local desbloqueada.</p>
        <div class="qr-box">${makeQrSvg(code)}</div>
        <p><strong>${escapeHtml(ficha.nombre || 'Ficha')}</strong>${ficha.habitacion ? ' · Hab. ' + escapeHtml(ficha.habitacion) : ''}</p>
        <div class="qr-code-text">${escapeHtml(code)}</div>
        <div class="qr-actions">
          <button class="secondary" type="button" id="copyQrCodeBtn">Copiar código</button>
          <button class="secondary" type="button" id="printQrBtn">Imprimir QR</button>
          <button class="primary" type="button" id="closeQrBtn">Cerrar</button>
        </div>
      </section>`;
    document.body.appendChild(modal);
    $('closeQrBtn').onclick = closeQrModal;
    $('copyQrCodeBtn').onclick = () => navigator.clipboard?.writeText(code).then(()=>alert('Código copiado.')).catch(()=>prompt('Copia el código:', code));
    $('printQrBtn').onclick = () => printQr(ficha, code);
    modal.addEventListener('click', e => { if(e.target === modal) closeQrModal(); });
  }

  function printQr(ficha, code){
    const w = window.open('', '_blank', 'noopener,noreferrer,width=520,height=720');
    if(!w){ alert('El navegador ha bloqueado la ventana de impresión.'); return; }
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>QR ${escapeHtml(ficha.nombre||'ficha')}</title></head><body><main class="qr-print-page"><h1>${escapeHtml(ficha.nombre||'Ficha')}</h1><p>${ficha.habitacion ? 'Habitación ' + escapeHtml(ficha.habitacion) : 'Residencia Santa Teresa'}</p>${makeQrSvg(code)}<p>Código interno: ${escapeHtml(code)}</p><p>Escanear desde la app desbloqueada.</p></main><style>.qr-print-page{font-family:Arial,sans-serif;text-align:center;padding:24px}.qr-print-page svg{width:260px;max-width:90vw}.qr-print-page h1{font-size:22px;margin:8px 0}.qr-print-page p{color:#555}</style></body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 250);
  }

  async function openScanner(){
    if(typeof state === 'undefined' || !state.key){ alert('Primero desbloquea la base local.'); return; }
    if(!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia){
      const manual = prompt('Este navegador no permite lectura QR directa. Introduce o pega el código QR:');
      if(manual) openByQrCode(manual.trim());
      return;
    }
    closeQrModal();
    const modal = document.createElement('div');
    modal.className = 'qr-modal';
    modal.id = 'qrModal';
    modal.innerHTML = `
      <section class="qr-panel" role="dialog" aria-modal="true" aria-label="Escáner QR">
        <h2>Escanear QR</h2>
        <p class="scanner-help">Apunta la cámara al QR de la ficha. La app abrirá la ficha si existe en esta base.</p>
        <video id="qrVideo" class="qr-video" autoplay playsinline muted></video>
        <div class="qr-actions">
          <button id="manualQrBtn" class="secondary" type="button">Código manual</button>
          <button id="closeScannerBtn" class="primary" type="button">Cerrar</button>
        </div>
      </section>`;
    document.body.appendChild(modal);
    const video = $('qrVideo');
    let stream = null;
    let stopped = false;
    const detector = new BarcodeDetector({formats:['qr_code']});
    async function stop(){
      stopped = true;
      if(stream) stream.getTracks().forEach(t => t.stop());
      closeQrModal();
    }
    $('closeScannerBtn').onclick = stop;
    $('manualQrBtn').onclick = () => { const v = prompt('Introduce el código QR:'); if(v) openByQrCode(v.trim()); };
    try{
      stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}, audio:false});
      video.srcObject = stream;
      await video.play();
      const tick = async () => {
        if(stopped) return;
        try{
          const codes = await detector.detect(video);
          if(codes.length){
            const value = codes[0].rawValue || '';
            await stop();
            openByQrCode(value);
            return;
          }
        }catch(err){ console.warn(err); }
        setTimeout(tick, 550);
      };
      tick();
    }catch(err){
      console.warn(err);
      closeQrModal();
      const manual = prompt('No se ha podido abrir la cámara. Introduce el código manualmente:');
      if(manual) openByQrCode(manual.trim());
    }
  }

  function openByQrCode(value){
    const id = parseQrId(value);
    if(!id){ alert('Este QR no pertenece a esta app.'); return; }
    if(typeof state === 'undefined' || !state.residents){ alert('Primero desbloquea la base local.'); return; }
    const ficha = state.residents.find(r => r.id === id);
    if(!ficha){ alert('No encuentro esta ficha en la base local de este dispositivo.'); return; }
    selectFicha(id, false);
    if(typeof setStep === 'function') setStep(3);
    setScreen('preview');
    if(typeof status === 'function') status('appStatus', 'Ficha abierta desde QR.', 'ok');
  }

  function parseQrId(value){
    if(!value) return '';
    if(value.startsWith(QR_PREFIX)) return value.slice(QR_PREFIX.length);
    const m = value.match(/(?:stc:|STC:)([a-f0-9-]{20,})/);
    return m ? m[1] : '';
  }

  function closeQrModal(){
    const old = $('qrModal');
    if(old) old.remove();
  }

  function escapeHtml(str){
    return String(str||'').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  // Generador QR local sin servicios externos: QR versión 3-L, modo byte, máscara 0.
  function makeQrSvg(text){
    const size = 29, dataCodewords = 55, eccCodewords = 15;
    const bytes = Array.from(new TextEncoder().encode(text));
    if(bytes.length > 48) throw new Error('Texto QR demasiado largo para esta versión.');
    const bits = [];
    pushBits(bits, 0b0100, 4);
    pushBits(bits, bytes.length, 8);
    bytes.forEach(b => pushBits(bits, b, 8));
    const maxBits = dataCodewords * 8;
    for(let i=0; i<4 && bits.length<maxBits; i++) bits.push(0);
    while(bits.length % 8) bits.push(0);
    const data = [];
    for(let i=0; i<bits.length; i+=8) data.push(bits.slice(i,i+8).reduce((a,b)=>(a<<1)|b,0));
    for(let pad=0; data.length<dataCodewords; pad++) data.push(pad%2 ? 0x11 : 0xec);
    const ecc = reedSolomon(data, eccCodewords);
    const allCodewords = data.concat(ecc);
    const m = Array.from({length:size}, () => Array(size).fill(false));
    const reserved = Array.from({length:size}, () => Array(size).fill(false));
    const set = (x,y,v,res=true) => { if(x<0||y<0||x>=size||y>=size) return; m[y][x]=!!v; if(res) reserved[y][x]=true; };
    const reserve = (x,y) => { if(x>=0&&y>=0&&x<size&&y<size) reserved[y][x]=true; };
    addFinder(set,0,0); addFinder(set,size-7,0); addFinder(set,0,size-7);
    for(let i=8;i<size-8;i++){ set(i,6,i%2===0); set(6,i,i%2===0); }
    addAlignment(set,22,22);
    set(8,21,true);
    reserveFormat(reserve,size);
    const dataBits=[]; allCodewords.forEach(cw=>pushBits(dataBits,cw,8));
    let bit=0, upward=true;
    for(let x=size-1; x>0; x-=2){
      if(x===6) x--;
      for(let yi=0; yi<size; yi++){
        const y = upward ? size-1-yi : yi;
        for(let dx=0; dx<2; dx++){
          const xx = x-dx;
          if(reserved[y][xx]) continue;
          const raw = bit < dataBits.length ? dataBits[bit++] : 0;
          const masked = raw ^ (((xx + y) % 2) === 0 ? 1 : 0);
          m[y][xx] = !!masked;
        }
      }
      upward = !upward;
    }
    addFormatBits(set,size);
    let rects='';
    const quiet = 4;
    for(let y=0;y<size;y++) for(let x=0;x<size;x++) if(m[y][x]) rects += `<rect x="${x+quiet}" y="${y+quiet}" width="1" height="1"/>`;
    const total=size+quiet*2;
    return `<svg viewBox="0 0 ${total} ${total}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Código QR"><rect width="${total}" height="${total}" fill="#fff"/><g fill="#163f25">${rects}</g></svg>`;
  }

  function pushBits(arr,val,len){ for(let i=len-1;i>=0;i--) arr.push((val>>>i)&1); }
  function addFinder(set,x,y){
    for(let dy=-1; dy<=7; dy++) for(let dx=-1; dx<=7; dx++){
      const xx=x+dx, yy=y+dy;
      const in7 = dx>=0 && dx<=6 && dy>=0 && dy<=6;
      const dark = in7 && (dx===0||dx===6||dy===0||dy===6||(dx>=2&&dx<=4&&dy>=2&&dy<=4));
      set(xx,yy,dark,true);
    }
  }
  function addAlignment(set,cx,cy){
    for(let dy=-2; dy<=2; dy++) for(let dx=-2; dx<=2; dx++){
      const dark = Math.max(Math.abs(dx),Math.abs(dy))===2 || (dx===0 && dy===0);
      set(cx+dx,cy+dy,dark,true);
    }
  }
  function reserveFormat(reserve,size){
    for(let i=0;i<=8;i++){ if(i!==6){ reserve(8,i); reserve(i,8); } }
    for(let i=0;i<8;i++) reserve(size-1-i,8);
    for(let i=8;i<15;i++) reserve(8,size-15+i);
  }
  function addFormatBits(set,size){
    const bits='111011111000100';
    const b=i=>bits[i]==='1';
    for(let i=0;i<=5;i++) set(8,i,b(i),true);
    set(8,7,b(6),true); set(8,8,b(7),true); set(7,8,b(8),true);
    for(let i=9;i<15;i++) set(14-i,8,b(i),true);
    for(let i=0;i<8;i++) set(size-1-i,8,b(i),true);
    for(let i=8;i<15;i++) set(8,size-15+i,b(i),true);
  }
  function reedSolomon(data, degree){
    const gen=[1];
    for(let i=0;i<degree;i++){
      gen.push(0);
      for(let j=gen.length-1;j>0;j--) gen[j]=gen[j-1]^gfMul(gen[j],gfPow(i));
      gen[0]=gfMul(gen[0],gfPow(i));
    }
    const res=Array(degree).fill(0);
    for(const b of data){
      const factor = b ^ res.shift();
      res.push(0);
      for(let i=0;i<degree;i++) res[i] ^= gfMul(gen[i+1], factor);
    }
    return res;
  }
  function gfPow(i){ let x=1; for(let n=0;n<i;n++) x=gfMul(x,2); return x; }
  function gfMul(x,y){
    let r=0;
    while(y){ if(y&1) r^=x; x<<=1; if(x&0x100) x^=0x11d; y>>=1; }
    return r;
  }
})();
