(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  function ready(fn){ document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

  ready(() => {
    buildSettingsDashboard();
    buildPeopleRegistry();
    hookBaseRefresh();
    setInterval(refreshPeopleStats, 1200);
  });

  function buildSettingsDashboard(){
    const sidebar = document.querySelector('.sidebar');
    if(!sidebar || $('settingsDashboard')) return;

    const dashboard = document.createElement('section');
    dashboard.id = 'settingsDashboard';
    dashboard.className = 'settings-dashboard no-print';
    dashboard.innerHTML = `
      <article class="settings-hero-card">
        <div>
          <p class="eyebrow">Modo tablet local</p>
          <h2>Seguridad y copias</h2>
          <p>La información queda guardada en esta tablet dentro de una base local cifrada. Haz copias periódicas para no perder datos.</p>
        </div>
        <span class="settings-lock-icon">🔐</span>
      </article>

      <div class="settings-grid">
        <article class="settings-card">
          <h3>Seguridad</h3>
          <p>Bloquea la app cuando termines o si vas a dejar la tablet sin supervisión.</p>
          <button type="button" class="primary" id="settingsLockNowBtn">Bloquear ahora</button>
          <small>La contraseña maestra nunca se muestra ni se envía fuera del dispositivo.</small>
        </article>

        <article class="settings-card">
          <h3>Copias cifradas</h3>
          <p>Exporta una copia cifrada de la base y guárdala fuera de la tablet.</p>
          <button type="button" class="secondary" id="settingsExportBtn">Hacer copia cifrada</button>
          <button type="button" class="secondary" id="settingsImportBtn">Importar copia</button>
          <small>Para restaurar la copia hará falta la misma contraseña maestra.</small>
        </article>

        <article class="settings-card">
          <h3>Instalación en tablet</h3>
          <ol>
            <li>Abre la app desde Chrome.</li>
            <li>Pulsa instalar o añadir a pantalla de inicio.</li>
            <li>Usa bloqueo de pantalla en la tablet.</li>
            <li>Haz copia cifrada al finalizar cambios importantes.</li>
          </ol>
        </article>

        <article class="settings-card warning-card">
          <h3>Mantenimiento</h3>
          <p>Usa esta zona solo si sabes lo que haces.</p>
          <button type="button" class="danger" id="settingsWipeBtn">Borrar base local</button>
          <small>Antes de borrar, exporta una copia cifrada si necesitas conservar los datos.</small>
        </article>
      </div>

      <article class="settings-version-card">
        <strong>Versión instalada</strong>
        <span id="settingsVersionText">—</span>
        <small>Aplicación local-first · offline · base cifrada en IndexedDB</small>
      </article>
    `;

    const securePanel = document.querySelector('.secure-panel');
    if(securePanel) securePanel.insertAdjacentElement('beforebegin', dashboard);
    else sidebar.appendChild(dashboard);

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
      <article class="people-hero">
        <div>
          <p class="eyebrow">Base de personas</p>
          <h2>Alta rápida de residente</h2>
          <p>Primero crea la persona con datos mínimos. Después podrás rellenar su ficha completa desde el nombre, habitación o QR.</p>
        </div>
        <span>👥</span>
      </article>

      <form id="quickPersonForm" class="quick-person-form" autocomplete="off">
        <div><label for="personName">Nombre</label><input id="personName" placeholder="Ej. María García" required></div>
        <div><label for="personRoom">Habitación</label><input id="personRoom" placeholder="Ej. 12, 104, A-03"></div>
        <div><label for="personWing">Ala / zona</label><input id="personWing" placeholder="Ej. Ala Norte, Planta 1"></div>
        <div><label for="personStatus">Estado</label><select id="personStatus"><option>Activa</option><option>Revisión</option><option>Archivada</option></select></div>
        <button class="primary" type="submit">Crear persona y QR</button>
      </form>

      <div class="people-stats-grid">
        <article><strong id="peopleTotalStat">0</strong><span>Personas</span></article>
        <article><strong id="peopleRoomsStat">0</strong><span>Habitaciones</span></article>
        <article><strong id="peopleWingsStat">0</strong><span>Alas/Zonas</span></article>
      </div>

      <details class="people-picker" open>
        <summary>Seleccionar persona para rellenar</summary>
        <div class="people-picker-body">
          <input id="peoplePickerSearch" placeholder="Buscar por nombre, habitación o ala">
          <div id="peoplePickerList" class="people-picker-list"></div>
        </div>
      </details>
    `;

    const toolbar = document.querySelector('.toolbar');
    if(toolbar) toolbar.insertAdjacentElement('beforebegin', panel);
    else sidebar.prepend(panel);

    $('quickPersonForm').addEventListener('submit', createPerson);
    $('peoplePickerSearch').addEventListener('input', refreshPeoplePicker);
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
    const person = {id,createdAt:now,updatedAt:now,kind:'person',profileCreated:true,reportStarted:false,nombre,habitacion,ala,estado,fechaNacimiento:'',referente:'',contacto:'',resumen:'',bien:[],incomoda:[],claves:[],comunicacion:'',movilidad:'',alimentacion:'',sueno:'',alergias:'',alertas:'',observaciones:'',photoDataUrl:'',history:[{ts:now,action:'Persona creada en alta rápida'}]};

    try{
      const box = await seal(state.key, person);
      await put({key:'resident:' + id, type:'resident', id, updatedAt: now, box});
      await loadResidents();
      clearQuickForm();
      if(typeof selectFicha === 'function') selectFicha(id, false);
      if(window.setSantaScreen) window.setSantaScreen('db');
      refreshPeopleStats();
      refreshPeoplePicker();
      setTimeout(() => {
        if(confirm(`Persona creada: ${person.nombre}${person.habitacion ? ' · Hab. ' + person.habitacion : ''}.\n\n¿Imprimir QR ahora?`)){
          const btn = $('previewQrBtn') || $('qrFichaBtn');
          if(btn) btn.click();
        }
      }, 250);
    }catch(err){ console.error(err); alert('No se ha podido crear la persona.'); }
  }

  function clearQuickForm(){ ['personName','personRoom','personWing'].forEach(id => { const el = $(id); if(el) el.value=''; }); if($('personStatus')) $('personStatus').value = 'Activa'; }

  function refreshPeopleStats(){
    if(typeof state === 'undefined' || !state.residents) return;
    const people = state.residents || [];
    const rooms = new Set(people.map(p => (p.habitacion||'').trim()).filter(Boolean));
    const wings = new Set(people.map(p => (p.ala||extractWing(p.habitacion)||'').trim()).filter(Boolean));
    if($('peopleTotalStat')) $('peopleTotalStat').textContent = people.length;
    if($('peopleRoomsStat')) $('peopleRoomsStat').textContent = rooms.size;
    if($('peopleWingsStat')) $('peopleWingsStat').textContent = wings.size;
    refreshPeoplePicker();
  }

  function refreshPeoplePicker(){
    const out = $('peoplePickerList');
    if(!out || typeof state === 'undefined') return;
    const q = ($('peoplePickerSearch')?.value || '').trim().toLowerCase();
    const people = (state.residents || []).filter(p => `${p.nombre||''} ${p.habitacion||''} ${p.ala||''} ${p.estado||''}`.toLowerCase().includes(q));
    if(!people.length){ out.innerHTML = '<p class="muted empty-picker">No hay personas que mostrar.</p>'; return; }
    out.innerHTML = people.map(p => `
      <article class="person-mini-card" data-id="${escapeHtml(p.id)}">
        <div><strong>${escapeHtml(p.nombre || 'Sin nombre')}</strong><span>${escapeHtml([p.habitacion ? 'Hab. ' + p.habitacion : '', p.ala || extractWing(p.habitacion), p.estado || 'Activa'].filter(Boolean).join(' · '))}</span></div>
        <div class="person-mini-actions"><button type="button" data-action="fill">Rellenar</button><button type="button" data-action="qr">QR</button></div>
      </article>`).join('');
    out.querySelectorAll('button').forEach(btn => {
      btn.onclick = event => {
        event.preventDefault();
        const id = btn.closest('.person-mini-card')?.dataset?.id;
        if(!id) return;
        if(btn.dataset.action === 'fill') openPersonForFill(id);
        if(btn.dataset.action === 'qr') openPersonQr(id);
      };
    });
  }

  function openPersonForFill(id){ if(typeof selectFicha === 'function') selectFicha(id, false); if(typeof setStep === 'function') setStep(1); if(window.setSantaScreen) window.setSantaScreen('form'); }
  function openPersonQr(id){ if(typeof selectFicha === 'function') selectFicha(id, false); const btn = $('previewQrBtn') || $('qrFichaBtn'); if(btn) btn.click(); }
  function hookBaseRefresh(){ const navDb = $('navDbBtn'); if(navDb) navDb.addEventListener('click', () => setTimeout(() => { refreshPeopleStats(); refreshPeoplePicker(); }, 120)); const navFill = $('navFillBtn'); if(navFill) navFill.addEventListener('click', () => setTimeout(refreshPeoplePicker, 120)); }
  function extractWing(room){ const value = String(room || '').trim(); if(!value) return ''; const m = value.match(/^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+|\d+)[\-\s]/); return m ? 'Zona ' + m[1].toUpperCase() : ''; }
  function refreshVersion(){ const out = $('settingsVersionText'); if(out) out.textContent = $('appVersion')?.textContent || '—'; }
  function escapeHtml(str){ return String(str || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
})();
