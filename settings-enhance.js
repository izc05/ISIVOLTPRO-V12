(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const PEOPLE_VERSION = window.SANTA_TERESA_APP_VERSION || '3.23.0-user-photo-flow';
  let quickPhotoDataUrl = '';

  function ready(fn){ document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

  ready(() => {
    injectPeopleStyles();
    injectHomeHeroStyles();
    setVisibleVersion();
    buildSettingsDashboard();
    buildPeopleRegistry();
    hookBaseRefresh();
    setInterval(refreshPeopleStats, 1200);
    setInterval(setVisibleVersion, 2000);
  });

  function buildSettingsDashboard(){
    const sidebar = document.querySelector('.sidebar');
    if(!sidebar || $('settingsDashboard')) return;
    const dashboard = document.createElement('section');
    dashboard.id = 'settingsDashboard';
    dashboard.className = 'settings-dashboard no-print';
    dashboard.innerHTML = `
      <article class="settings-hero-card"><div><p class="eyebrow">Modo tablet local</p><h2>Seguridad y copias</h2><p>La información queda guardada en esta tablet dentro de una base local cifrada. Haz copias periódicas para no perder datos.</p></div><span class="settings-lock-icon">🔐</span></article>
      <div class="settings-grid">
        <article class="settings-card"><h3>Seguridad</h3><p>Bloquea la app cuando termines o si vas a dejar la tablet sin supervisión.</p><button type="button" class="primary" id="settingsLockNowBtn">Bloquear ahora</button><small>La contraseña maestra nunca se muestra ni se envía fuera del dispositivo.</small></article>
        <article class="settings-card"><h3>Copias cifradas</h3><p>Exporta una copia cifrada de la base y guárdala fuera de la tablet.</p><button type="button" class="secondary" id="settingsExportBtn">Hacer copia cifrada</button><button type="button" class="secondary" id="settingsImportBtn">Importar copia</button><small>Para restaurar la copia hará falta la misma contraseña maestra.</small></article>
        <article class="settings-card"><h3>Instalación en tablet</h3><ol><li>Abre la app desde Chrome.</li><li>Pulsa instalar o añadir a pantalla de inicio.</li><li>Usa bloqueo de pantalla en la tablet.</li><li>Haz copia cifrada al finalizar cambios importantes.</li></ol></article>
        <article class="settings-card warning-card"><h3>Mantenimiento</h3><p>Usa esta zona solo si sabes lo que haces.</p><button type="button" class="danger" id="settingsWipeBtn">Borrar base local</button><small>Antes de borrar, exporta una copia cifrada si necesitas conservar los datos.</small></article>
      </div>
      <article class="settings-version-card"><strong>Versión instalada</strong><span id="settingsVersionText">—</span><small>Aplicación local-first · offline · base cifrada en IndexedDB</small></article>`;
    const legal = document.createElement('details');
    legal.className = 'settings-legal-card';
    legal.open = true;
    legal.innerHTML = `<summary>Documento legal y privacidad</summary><div><p><strong>Uso previsto.</strong> Herramienta local de apoyo para crear fichas e informes internos de cuidados en una tablet controlada por la residencia.</p><p><strong>Datos sensibles.</strong> No introduzcas datos reales en demos, capturas o repositorios. La informacion debe tratarse conforme a la normativa aplicable y a las instrucciones de la entidad responsable.</p><p><strong>Seguridad.</strong> Mantener bloqueo de pantalla, acceso limitado al dispositivo, copias cifradas periodicas y custodia separada de la contrasena maestra.</p><p><strong>Sin recuperacion.</strong> Si se pierde la contrasena maestra no se puede recuperar la base cifrada.</p></div>`;
    dashboard.querySelector('.settings-version-card')?.insertAdjacentElement('beforebegin', legal);
    const securePanel = document.querySelector('.secure-panel');
    if(securePanel) securePanel.insertAdjacentElement('beforebegin', dashboard); else sidebar.appendChild(dashboard);
    $('settingsLockNowBtn').onclick = () => $('lockBtn')?.click();
    $('settingsExportBtn').onclick = () => $('exportBackupBtn')?.click();
    $('settingsImportBtn').onclick = () => $('importBackupBtn')?.click();
    $('settingsWipeBtn').onclick = () => $('wipeBtn')?.click();
    refreshVersion();
    setInterval(refreshVersion, 1500);
  }

  function buildPeopleRegistry(){
    const sidebar = document.querySelector('.sidebar');
    if(!sidebar || $('peopleRegistryPanel')) return;
    const panel = document.createElement('section');
    panel.id = 'peopleRegistryPanel';
    panel.className = 'people-registry no-print';
    panel.innerHTML = `
      <article class="people-hero"><div><p class="eyebrow">Base de personas</p><h2>Alta rápida de residente</h2><p>Primero crea la persona con datos mínimos. Después podrás rellenar su ficha completa desde el nombre, habitación o QR.</p></div><span>👥</span></article>
      <form id="quickPersonForm" class="quick-person-form" autocomplete="off">
        <div><label for="personName">Nombre</label><input id="personName" placeholder="Ej. María García" required></div>
        <div><label for="personRoom">Habitación</label><input id="personRoom" placeholder="Ej. 12, 104, A-03"></div>
        <div><label for="personWing">Ala / zona</label><input id="personWing" placeholder="Ej. Ala Norte, Planta 1"></div>
        <div><label for="personStatus">Estado</label><select id="personStatus"><option>Activa</option><option>Revisión</option><option>Archivada</option></select></div>
        <section class="quick-person-photo">
          <div class="quick-person-photo-preview"><img id="personPhotoPreview" alt="" hidden><span id="personPhotoEmpty">Sin foto</span></div>
          <div>
            <label>Foto del usuario</label>
            <p class="muted">Opcional. Se reduce si pesa mucho y queda cifrada en la base local.</p>
            <button id="personChoosePhotoBtn" class="secondary" type="button">Añadir foto</button>
            <button id="personRemovePhotoBtn" class="secondary" type="button">Quitar foto</button>
            <input id="personPhotoInput" type="file" accept="image/*">
          </div>
        </section>
        <button class="primary" type="submit">Crear persona y QR</button>
      </form>
      <div class="people-stats-grid"><article><strong id="peopleTotalStat">0</strong><span>Personas</span></article><article><strong id="peopleRoomsStat">0</strong><span>Habitaciones</span></article><article><strong id="peopleWingsStat">0</strong><span>Alas/Zonas</span></article></div>
      <details class="people-picker" open><summary>Seleccionar persona para rellenar</summary><div class="people-picker-body"><input id="peoplePickerSearch" placeholder="Buscar por nombre, habitación o ala"><div id="peoplePickerList" class="people-picker-list"></div></div></details>`;
    const toolbar = document.querySelector('.toolbar');
    if(toolbar) toolbar.insertAdjacentElement('beforebegin', panel); else sidebar.prepend(panel);
    $('quickPersonForm').addEventListener('submit', createPerson);
    $('personChoosePhotoBtn').onclick = () => $('personPhotoInput')?.click();
    $('personRemovePhotoBtn').onclick = () => { quickPhotoDataUrl = ''; if($('personPhotoInput')) $('personPhotoInput').value = ''; renderQuickPhoto(); };
    $('personPhotoInput').onchange = event => loadQuickPhoto(event.target.files[0]);
    $('peoplePickerSearch').addEventListener('input', refreshPeoplePicker);
    renderQuickPhoto();
    refreshPeopleStats();
    refreshPeoplePicker();
  }

  async function createPerson(event){
    event.preventDefault();
    if(typeof state === 'undefined' || !state.key){ alert('Primero desbloquea la base.'); return; }
    const nombre = $('personName').value.trim();
    const habitacion = $('personRoom').value.trim();
    const ala = $('personWing').value.trim();
    const estado = $('personStatus').value || 'Activa';
    if(!nombre){ alert('El nombre es obligatorio.'); return; }
    const duplicate = state.residents?.find(r => (r.nombre||'').toLowerCase() === nombre.toLowerCase() && (r.habitacion||'') === habitacion);
    if(duplicate && !confirm('Ya existe una persona con ese nombre y habitación. ¿Crear otra igualmente?')) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
    const now = new Date().toISOString();
    const person = {id,createdAt:now,updatedAt:now,kind:'person',profileCreated:true,reportStarted:false,nombre,habitacion,ala,estado,fechaNacimiento:'',referente:'',contacto:'',resumen:'',bien:[],incomoda:[],claves:[],comunicacion:'',movilidad:'',alimentacion:'',sueno:'',alergias:'',alertas:'',observaciones:'',photoDataUrl:quickPhotoDataUrl,history:[{ts:now,action:'Persona creada en alta rápida'}]};
    try{
      const box = await seal(state.key, person);
      await put({key:'resident:' + id, type:'resident', id, updatedAt: now, box});
      await loadResidents();
      clearQuickForm();
      if(typeof selectFicha === 'function') selectFicha(id, false);
      if(window.setSantaScreen) window.setSantaScreen('db');
      refreshPeopleStats();
      refreshPeoplePicker();
      setTimeout(() => { const btn = $('previewQrBtn') || $('qrFichaBtn'); if(btn) btn.click(); }, 250);
    }catch(err){ console.error(err); alert('No se ha podido crear la persona.'); }
  }

  function clearQuickForm(){ ['personName','personRoom','personWing'].forEach(id => { const el = $(id); if(el) el.value=''; }); if($('personStatus')) $('personStatus').value = 'Activa'; quickPhotoDataUrl = ''; if($('personPhotoInput')) $('personPhotoInput').value = ''; renderQuickPhoto(); }
  async function loadQuickPhoto(file){ if(!file) return; if(!file.type.startsWith('image/')){ alert('El archivo seleccionado no es una imagen.'); return; } try{ quickPhotoDataUrl = typeof preparePhoto === 'function' ? await preparePhoto(file) : await readLocalPhoto(file); renderQuickPhoto(); }catch(err){ console.error(err); alert('No se ha podido preparar la foto. Prueba con JPG o PNG.'); } }
  function readLocalPhoto(file){ return new Promise((res,rej)=>{ const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(file); }); }
  function renderQuickPhoto(){ const img = $('personPhotoPreview'), empty = $('personPhotoEmpty'), choose = $('personChoosePhotoBtn'); if(!img || !empty) return; if(quickPhotoDataUrl){ img.src = quickPhotoDataUrl; img.hidden = false; empty.hidden = true; if(choose) choose.textContent = 'Cambiar foto'; }else{ img.removeAttribute('src'); img.hidden = true; empty.hidden = false; if(choose) choose.textContent = 'Añadir foto'; } }
  function refreshPeopleStats(){ if(typeof state === 'undefined' || !state.residents) return; const people = state.residents || []; const rooms = new Set(people.map(p => (p.habitacion||'').trim()).filter(Boolean)); const wings = new Set(people.map(p => (p.ala||extractWing(p.habitacion)||'').trim()).filter(Boolean)); if($('peopleTotalStat')) $('peopleTotalStat').textContent = people.length; if($('peopleRoomsStat')) $('peopleRoomsStat').textContent = rooms.size; if($('peopleWingsStat')) $('peopleWingsStat').textContent = wings.size; refreshPeoplePicker(); }
  function refreshPeoplePicker(){ const out = $('peoplePickerList'); if(!out || typeof state === 'undefined') return; const q = ($('peoplePickerSearch')?.value || '').trim().toLowerCase(); const people = (state.residents || []).filter(p => `${p.nombre||''} ${p.habitacion||''} ${p.ala||''} ${p.estado||''}`.toLowerCase().includes(q)); if(!people.length){ out.innerHTML = '<p class="muted empty-picker">No hay personas que mostrar.</p>'; return; } out.innerHTML = people.map(p => `<article class="person-mini-card" data-id="${escapeHtml(p.id)}"><div><strong>${escapeHtml(p.nombre || 'Sin nombre')}</strong><span>${escapeHtml([p.habitacion ? 'Hab. ' + p.habitacion : '', p.ala || extractWing(p.habitacion), p.estado || 'Activa'].filter(Boolean).join(' · '))}</span></div><div class="person-mini-actions"><button type="button" data-action="fill">Rellenar</button><button type="button" data-action="qr">QR</button></div></article>`).join(''); out.querySelectorAll('button').forEach(btn => { btn.onclick = event => { event.preventDefault(); const id = btn.closest('.person-mini-card')?.dataset?.id; if(!id) return; if(btn.dataset.action === 'fill') openPersonForFill(id); if(btn.dataset.action === 'qr') openPersonQr(id); }; }); }
  function openPersonForFill(id){ if(typeof selectFicha === 'function') selectFicha(id, false); if(typeof setStep === 'function') setStep(1); if(window.setSantaScreen) window.setSantaScreen('form'); }
  function openPersonQr(id){ if(typeof selectFicha === 'function') selectFicha(id, false); const btn = $('previewQrBtn') || $('qrFichaBtn'); if(btn) btn.click(); }
  function hookBaseRefresh(){ const navDb = $('navDbBtn'); if(navDb) navDb.addEventListener('click', () => setTimeout(() => { refreshPeopleStats(); refreshPeoplePicker(); }, 120)); const navFill = $('navFillBtn'); if(navFill) navFill.addEventListener('click', () => setTimeout(refreshPeoplePicker, 120)); }
  function extractWing(room){ const value = String(room || '').trim(); if(!value) return ''; const m = value.match(/^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+|\d+)[\-\s]/); return m ? 'Zona ' + m[1].toUpperCase() : ''; }
  function refreshVersion(){ const out = $('settingsVersionText'); if(out) out.textContent = $('appVersion')?.textContent || PEOPLE_VERSION; }
  function setVisibleVersion(){ const out = $('appVersion'); if(out) out.textContent = PEOPLE_VERSION; refreshVersion(); }
  function escapeHtml(str){ return String(str || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }

  function injectHomeHeroStyles(){
    if($('homeHeroFixStyles')) return;
    const style = document.createElement('style');
    style.id = 'homeHeroFixStyles';
    style.textContent = `
      .module-home{overflow:hidden!important;background:linear-gradient(180deg,#fffdf8,#ecf8ec)!important}
      .residence-cover{height:300px!important;object-fit:cover!important;object-position:center 48%!important;filter:saturate(1.04) contrast(1.02) brightness(.98)!important;background:#e9f6e9!important}
      .app-logo-mark{width:min(360px,82vw)!important;min-height:112px!important;margin:-56px auto 18px!important;border-radius:30px!important;background:#fff url('assets/diputacion-jaen-logo.svg?v=logobalance') center/74% auto no-repeat!important;box-shadow:0 18px 40px rgba(47,125,59,.22)!important;border:8px solid #fffdf8!important;color:transparent!important;font-size:0!important}
      .app-logo-mark::before,.app-logo-mark::after{display:none!important}.module-home .eyebrow{margin-top:8px!important}.module-home h2{margin-top:4px!important}
      @media(max-width:620px){.residence-cover{height:292px!important;object-position:center center!important}.app-logo-mark{width:min(330px,82vw)!important;min-height:104px!important;margin-top:-52px!important;background-size:73% auto!important;border-radius:28px!important}}
    `;
    document.head.appendChild(style);
  }

  function injectPeopleStyles(){
    if($('peopleRegistryStyles')) return;
    const style = document.createElement('style');
    style.id = 'peopleRegistryStyles';
    style.textContent = `.people-registry{display:block;margin:14px 0;padding:14px;border-radius:28px;background:linear-gradient(180deg,#fffdf8,#f2fbf1);border:1px solid #d8ead5;box-shadow:0 12px 30px rgba(48,39,30,.08)}.screen-settings .people-registry{display:none!important}.people-hero{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:16px;border-radius:22px;background:linear-gradient(135deg,#e9f6e9,#e7f3fb);border:1px solid #cce7c9}.people-hero h2{margin:0 0 6px;color:#164f25}.people-hero p{margin:0;color:#665d56}.people-hero>span{width:58px;height:58px;border-radius:20px;background:#fff;display:grid;place-items:center;font-size:28px;box-shadow:0 8px 18px rgba(47,125,59,.14)}.quick-person-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.quick-person-form label{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;color:#665d56}.quick-person-form input,.quick-person-form select{width:100%;border-radius:16px;border:1px solid #d8d0c7;padding:11px;background:#fff}.quick-person-form button{grid-column:1/-1;border-radius:18px;padding:13px;font-weight:950}.people-stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.people-stats-grid article{background:#fff;border:1px solid #d8ead5;border-radius:18px;padding:12px;text-align:center}.people-stats-grid strong{display:block;font-size:24px;color:#164f25}.people-stats-grid span{font-size:11px;color:#665d56;font-weight:850;text-transform:uppercase}.people-picker{background:#fff;border:1px solid #d8ead5;border-radius:20px;padding:10px}.people-picker summary{font-weight:950;color:#164f25;cursor:pointer}.people-picker-body{display:grid;gap:10px;margin-top:10px}.people-picker-body input{border-radius:16px;border:1px solid #d8d0c7;padding:11px}.people-picker-list{display:grid;gap:8px}.person-mini-card{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;border:1px solid #eee1d7;border-radius:18px;padding:10px;background:#fffdf8}.person-mini-card strong{display:block;color:#164f25}.person-mini-card span{display:block;color:#665d56;font-size:12px;margin-top:3px}.person-mini-actions{display:flex;gap:6px}.person-mini-actions button{border:1px solid #d8ead5;background:#fff;border-radius:13px;padding:8px 9px;font-size:12px;font-weight:900;color:#315064}.person-mini-actions button:first-child{background:#e9f6e9;color:#164f25}.empty-picker{margin:0;padding:10px;border:1px dashed #d8d0c7;border-radius:14px;text-align:center}@media(max-width:620px){.quick-person-form{grid-template-columns:1fr}.people-stats-grid{grid-template-columns:1fr 1fr}.person-mini-card{grid-template-columns:1fr}.person-mini-actions{display:grid;grid-template-columns:1fr 1fr}.people-hero{grid-template-columns:1fr;text-align:center}.people-hero>span{margin:0 auto}}`;
    document.head.appendChild(style);
  }
})();
