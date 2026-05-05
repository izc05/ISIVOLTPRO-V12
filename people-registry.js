(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  function ready(fn){ document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

  ready(() => {
    buildPeopleRegistry();
    hookBaseRefresh();
    setInterval(refreshPeopleStats, 1200);
  });

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
        <div>
          <label for="personName">Nombre</label>
          <input id="personName" placeholder="Ej. María García" required>
        </div>
        <div>
          <label for="personRoom">Habitación</label>
          <input id="personRoom" placeholder="Ej. 12, 104, A-03">
        </div>
        <div>
          <label for="personWing">Ala / zona</label>
          <input id="personWing" placeholder="Ej. Ala Norte, Planta 1">
        </div>
        <div>
          <label for="personStatus">Estado</label>
          <select id="personStatus"><option>Activa</option><option>Revisión</option><option>Archivada</option></select>
        </div>
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
    const person = {
      id,
      createdAt: now,
      updatedAt: now,
      kind: 'person',
      profileCreated: true,
      reportStarted: false,
      nombre,
      habitacion,
      ala,
      estado,
      fechaNacimiento: '',
      referente: '',
      contacto: '',
      resumen: '',
      bien: [],
      incomoda: [],
      claves: [],
      comunicacion: '',
      movilidad: '',
      alimentacion: '',
      sueno: '',
      alergias: '',
      alertas: '',
      observaciones: '',
      photoDataUrl: '',
      history: [{ts: now, action: 'Persona creada en alta rápida'}]
    };

    try{
      const box = await seal(state.key, person);
      await put({key:'resident:' + id, type:'resident', id, updatedAt: now, box});
      await loadResidents();
      clearQuickForm();
      if(typeof selectFicha === 'function') selectFicha(id, false);
      if(window.setSantaScreen) window.setSantaScreen('db');
      refreshPeopleStats();
      refreshPeoplePicker();
      showCreatedPerson(person);
    }catch(err){
      console.error(err);
      alert('No se ha podido crear la persona.');
    }
  }

  function clearQuickForm(){
    ['personName','personRoom','personWing'].forEach(id => { const el = $(id); if(el) el.value=''; });
    if($('personStatus')) $('personStatus').value = 'Activa';
  }

  function showCreatedPerson(person){
    const code = 'STC|' + person.id;
    const msg = `Persona creada: ${person.nombre}${person.habitacion ? ' · Hab. ' + person.habitacion : ''}.\n\nYa puedes imprimir su QR o rellenar su ficha completa.`;
    setTimeout(() => {
      if(confirm(msg + '\n\n¿Imprimir QR ahora?')){
        const btn = $('previewQrBtn') || $('qrFichaBtn');
        if(btn) btn.click();
        else prompt('Código QR interno:', code);
      }
    }, 250);
  }

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
    if(!people.length){
      out.innerHTML = '<p class="muted empty-picker">No hay personas que mostrar.</p>';
      return;
    }
    out.innerHTML = people.map(p => `
      <article class="person-mini-card" data-id="${escapeHtml(p.id)}">
        <div>
          <strong>${escapeHtml(p.nombre || 'Sin nombre')}</strong>
          <span>${escapeHtml([p.habitacion ? 'Hab. ' + p.habitacion : '', p.ala || extractWing(p.habitacion), p.estado || 'Activa'].filter(Boolean).join(' · '))}</span>
        </div>
        <div class="person-mini-actions">
          <button type="button" data-action="fill">Rellenar</button>
          <button type="button" data-action="qr">QR</button>
        </div>
      </article>
    `).join('');
    out.querySelectorAll('button').forEach(btn => {
      btn.onclick = event => {
        event.preventDefault();
        const card = btn.closest('.person-mini-card');
        const id = card?.dataset?.id;
        if(!id) return;
        if(btn.dataset.action === 'fill') openPersonForFill(id);
        if(btn.dataset.action === 'qr') openPersonQr(id);
      };
    });
  }

  function openPersonForFill(id){
    if(typeof selectFicha === 'function') selectFicha(id, false);
    if(typeof setStep === 'function') setStep(1);
    if(window.setSantaScreen) window.setSantaScreen('form');
  }

  function openPersonQr(id){
    if(typeof selectFicha === 'function') selectFicha(id, false);
    const btn = $('previewQrBtn') || $('qrFichaBtn');
    if(btn) btn.click();
  }

  function hookBaseRefresh(){
    const navDb = $('navDbBtn');
    if(navDb) navDb.addEventListener('click', () => setTimeout(() => { refreshPeopleStats(); refreshPeoplePicker(); }, 120));
    const navFill = $('navFillBtn');
    if(navFill) navFill.addEventListener('click', () => setTimeout(refreshPeoplePicker, 120));
  }

  function extractWing(room){
    const value = String(room || '').trim();
    if(!value) return '';
    const m = value.match(/^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+|\d+)[\-\s]/);
    return m ? 'Zona ' + m[1].toUpperCase() : '';
  }

  function escapeHtml(str){
    return String(str || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }
})();
