(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  function ready(fn){
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();
  }

  ready(() => {
    buildReportSelector();
    retitleUserRegistry();
    hookRefresh();
    setInterval(() => {
      refreshReportSelector();
      retitleUserRegistry();
    }, 1200);
  });

  function buildReportSelector(){
    const editor = document.querySelector('.editor');
    if(!editor || $('reportUserSelector')) return;

    const panel = document.createElement('section');
    panel.id = 'reportUserSelector';
    panel.className = 'report-user-selector no-print';
    panel.innerHTML = `
      <div class="report-selector-head">
        <div>
          <p class="eyebrow">Crear informe</p>
          <h3>Selecciona un usuario</h3>
          <p>Busca por nombre, habitacion o zona. Tambien puedes escanear su QR.</p>
        </div>
        <button id="reportScanQrBtn" type="button" class="secondary">Escanear QR</button>
        <button id="reportChangeUserBtn" type="button" class="secondary">Cambiar usuario</button>
      </div>
      <div class="report-selector-search">
        <label for="reportUserSearch">Usuario</label>
        <input id="reportUserSearch" placeholder="Buscar usuario para el informe">
      </div>
      <div id="reportUserList" class="report-user-list"></div>
    `;

    editor.insertBefore(panel, editor.firstChild);
    $('reportUserSearch').addEventListener('input', refreshReportSelector);
    $('reportUserSearch').addEventListener('keydown', event => {
      if(event.key !== 'Enter') return;
      const first = $('reportUserList')?.querySelector('.report-user-card');
      if(!first) return;
      event.preventDefault();
      chooseReportUser(first.dataset.id);
    });
    $('reportScanQrBtn').onclick = () => {
      if(typeof window.openSantaQrScanner === 'function') window.openSantaQrScanner();
      else $('navDbBtn')?.click();
    };
    $('reportChangeUserBtn').onclick = () => {
      panel.classList.remove('has-selection');
      $('reportUserSearch').value = '';
      $('reportUserSearch').focus();
      refreshReportSelector();
    };
    refreshReportSelector();
  }

  function hookRefresh(){
    ['navFillBtn','navUserBtn','navDbBtn'].forEach(id => {
      const btn = $(id);
      if(btn) btn.addEventListener('click', () => setTimeout(() => {
        refreshReportSelector();
        retitleUserRegistry();
      }, 140));
    });
  }

  function refreshReportSelector(){
    const list = $('reportUserList');
    if(!list || typeof state === 'undefined') return;

    const q = ($('reportUserSearch')?.value || '').trim().toLowerCase();
    if(!q){
      list.innerHTML = `
        <article class="report-empty report-hint">
          <strong>Busca un usuario por nombre, habitacion o zona</strong>
          <span>Tambien puedes usar Escanear QR para cargarlo automaticamente.</span>
        </article>
      `;
      refreshSelectedUserState();
      return;
    }

    const people = (state.residents || []).filter(person => `${person.nombre || ''} ${person.habitacion || ''} ${person.ala || ''} ${person.estado || ''}`.toLowerCase().includes(q)).slice(0, 6);

    if(!people.length){
      list.innerHTML = `
        <article class="report-empty">
          <strong>No se encontro ese usuario</strong>
          <span>Revisa el nombre, habitacion o zona. Si no existe, puedes crearlo.</span>
          <button type="button" id="reportCreateUserBtn">Crear usuario</button>
        </article>
      `;
      const create = $('reportCreateUserBtn');
      if(create) create.onclick = () => {
        if(window.setSantaScreen) window.setSantaScreen('user');
        setTimeout(() => $('personName')?.focus(), 120);
      };
      return;
    }

    list.innerHTML = people.map(person => `
      <article class="report-user-card" data-id="${escapeHtml(person.id)}">
        <div>
          <strong>${escapeHtml(person.nombre || 'Sin nombre')}</strong>
          <span>${escapeHtml([person.habitacion ? 'Hab. ' + person.habitacion : '', person.ala || '', person.estado || 'Activa'].filter(Boolean).join(' - '))}</span>
        </div>
        <button type="button">Usar usuario</button>
      </article>
    `).join('');

    list.querySelectorAll('.report-user-card').forEach(card => {
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.onclick = event => {
        event.preventDefault();
        chooseReportUser(card.dataset.id);
      };
      card.onkeydown = event => {
        if(event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        chooseReportUser(card.dataset.id);
      };
    });

    refreshSelectedUserState();
  }

  function chooseReportUser(id){
    if(!id || typeof state === 'undefined') return;
    const selected = (state.residents || []).find(person => person.id === id);
    if(!selected) return;
    if(typeof selectFicha === 'function') selectFicha(id, false);
    if(typeof setStep === 'function') setStep(0);
    const input = $('reportUserSearch');
    if(input) input.value = [selected.nombre || 'Sin nombre', selected.habitacion ? 'Hab. ' + selected.habitacion : ''].filter(Boolean).join(' - ');
    refreshSelectedUserState();
    document.querySelector('.wizard-card')?.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function refreshSelectedUserState(){
    if(typeof state === 'undefined') return;
    const panel = $('reportUserSelector');
    const selected = (state.residents || []).find(person => person.id === state.selectedId);
    if(panel){
      panel.classList.toggle('has-selection', !!selected);
      panel.dataset.selectedName = selected?.nombre || '';
      panel.querySelector('.report-selector-head h3')?.setAttribute('data-user-name', selected?.nombre || '');
    }
    document.querySelectorAll('.report-user-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.id === state.selectedId);
    });
  }

  function retitleUserRegistry(){
    const panel = $('peopleRegistryPanel');
    if(!panel) return;
    const eyebrow = panel.querySelector('.people-hero .eyebrow');
    const title = panel.querySelector('.people-hero h2');
    const copy = panel.querySelector('.people-hero p:not(.eyebrow)');
    const submit = $('quickPersonForm')?.querySelector('button[type="submit"]');
    const summary = panel.querySelector('.people-picker summary');
    const total = $('peopleTotalStat')?.nextElementSibling;
    const fillButtons = panel.querySelectorAll('[data-action="fill"]');

    if(eyebrow) eyebrow.textContent = 'Usuarios';
    if(title) title.textContent = 'Crear usuario';
    if(copy) copy.textContent = 'Guarda sus datos basicos: nombre, habitacion, zona y estado. Despues podras crear informes desde su nombre o QR.';
    if(submit) submit.textContent = 'Crear usuario y QR';
    if(summary) summary.textContent = 'Base de datos usuarios';
    if(total) total.textContent = 'Usuarios';
    fillButtons.forEach(btn => btn.textContent = 'Informe');
  }

  function escapeHtml(value){
    return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  window.refreshReportWorkflow = refreshReportSelector;
})();
