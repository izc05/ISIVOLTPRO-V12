(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  let activeFilter = 'Todas';
  let enhancing = false;

  function ready(fn){ document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

  ready(() => {
    insertFilterBar();
    enhanceListSoon();
    const list = $('residentList');
    if(list){
      new MutationObserver(() => enhanceListSoon()).observe(list, {childList:true, subtree:true});
    }
    const search = $('searchBox');
    if(search) search.addEventListener('input', () => enhanceListSoon());
  });

  function insertFilterBar(){
    const searchCard = document.querySelector('.search-card');
    if(!searchCard || $('dbFilterBar')) return;
    const bar = document.createElement('div');
    bar.id = 'dbFilterBar';
    bar.className = 'db-filter-bar';
    bar.innerHTML = ['Todas','Activas','Revisión','Archivadas'].map((name, idx) => `<button type="button" class="${idx===0?'active':''}" data-filter="${name}">${name}</button>`).join('');
    searchCard.insertAdjacentElement('afterend', bar);
    bar.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        activeFilter = btn.dataset.filter;
        bar.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
        applyFilter();
      };
    });
  }

  function enhanceListSoon(){
    if(enhancing) return;
    enhancing = true;
    setTimeout(() => { try{ enhanceList(); applyFilter(); } finally { enhancing = false; } }, 60);
  }

  function enhanceList(){
    const list = $('residentList');
    if(!list) return;
    list.classList.add('resident-card-list');
    list.querySelectorAll('.resident-item').forEach(li => enhanceItem(li));
  }

  function enhanceItem(li){
    if(li.dataset.enhanced === '1') return;
    const id = li.dataset.id;
    if(!id || typeof state === 'undefined') return;
    const ficha = state.residents?.find(r => r.id === id);
    if(!ficha) return;
    li.dataset.enhanced = '1';
    li.dataset.estado = ficha.estado || 'Activa';
    const btn = li.querySelector('button');
    let shell = li.querySelector('.resident-card-shell');
    if(!shell){
      shell = document.createElement('article');
      shell.className = 'resident-card-shell';
      if(btn) li.insertBefore(shell, btn);
      if(btn) shell.appendChild(btn);
    }
    if(btn){
      btn.classList.add('resident-card-main');
      const badge = document.createElement('em');
      badge.className = 'status-badge ' + statusClass(ficha.estado || 'Activa');
      badge.textContent = ficha.estado || 'Activa';
      btn.appendChild(badge);
    }
    const actions = document.createElement('div');
    actions.className = 'resident-card-actions';
    actions.innerHTML = `
      <button type="button" data-action="view">Ver ficha</button>
      <button type="button" data-action="edit">Editar</button>
      <button type="button" data-action="qr">QR</button>
      <button type="button" data-action="print">PDF</button>
    `;
    actions.addEventListener('click', event => {
      const action = event.target?.dataset?.action;
      if(!action) return;
      event.preventDefault();
      event.stopPropagation();
      openAction(id, action);
    });
    shell.appendChild(actions);
  }

  function openAction(id, action){
    if(typeof selectFicha !== 'function') return;
    selectFicha(id, false);
    if(action === 'edit'){
      if(typeof setStep === 'function') setStep(0);
      window.setSantaScreen ? window.setSantaScreen('form') : null;
      return;
    }
    if(action === 'view'){
      if(typeof setStep === 'function') setStep(3);
      window.setSantaScreen ? window.setSantaScreen('preview') : null;
      return;
    }
    if(action === 'qr'){
      const btn = $('previewQrBtn') || $('qrFichaBtn');
      if(btn) btn.click();
      return;
    }
    if(action === 'print'){
      if(typeof printFicha === 'function') printFicha();
    }
  }

  function applyFilter(){
    const list = $('residentList');
    if(!list) return;
    list.querySelectorAll('.resident-item').forEach(li => {
      const estado = li.dataset.estado || '';
      let show = true;
      if(activeFilter === 'Activas') show = estado === 'Activa';
      if(activeFilter === 'Revisión') show = estado === 'Revisión';
      if(activeFilter === 'Archivadas') show = estado === 'Archivada';
      li.classList.toggle('filtered-out', !show);
    });
  }

  function statusClass(status){
    if(status === 'Revisión') return 'review';
    if(status === 'Archivada') return 'archived';
    return 'active';
  }
})();
