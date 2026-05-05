(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  const stepMeta = [
    {
      icon: '👤',
      title: 'Datos básicos',
      tag: 'Identificación',
      text: 'Rellena los datos mínimos para reconocer la ficha: nombre, habitación, estado y contacto autorizado.',
      tips: ['Nombre visible obligatorio', 'Habitación ayuda a localizar rápido', 'Estado permite filtrar en la base']
    },
    {
      icon: '💚',
      title: 'Bienestar y trato',
      tag: 'Humanización',
      text: 'Anota cómo tratar a la persona, qué le tranquiliza y qué situaciones conviene evitar.',
      tips: ['Una idea por línea', 'Usa frases cortas', 'Piensa en el turno que no conoce a la persona']
    },
    {
      icon: '🩺',
      title: 'Cuidados importantes',
      tag: 'Atención diaria',
      text: 'Completa los puntos prácticos para el cuidado: comunicación, movilidad, alimentación, descanso y alertas.',
      tips: ['Destaca alergias o alertas', 'Evita textos demasiado largos', 'Incluye observaciones útiles para todos']
    },
    {
      icon: '📄',
      title: 'Resultado final',
      tag: 'Ficha/PDF',
      text: 'Revisa el formato final antes de imprimir o generar PDF. Guarda la ficha para activar su QR.',
      tips: ['Comprueba nombre y habitación', 'Guarda antes de imprimir QR', 'El PDF oculta menús y botones']
    }
  ];

  function ready(fn){ document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

  ready(() => {
    enhanceWizard();
    enhanceSections();
    enhanceRequiredFields();
    watchStepChanges();
    refreshGuide();
  });

  function enhanceWizard(){
    const wizard = document.querySelector('.wizard-card');
    if(!wizard || $('guidedHero')) return;

    const hero = document.createElement('section');
    hero.id = 'guidedHero';
    hero.className = 'guided-hero no-print';
    hero.innerHTML = `
      <div class="guided-icon" id="guidedIcon">👤</div>
      <div class="guided-copy">
        <p class="guided-tag" id="guidedTag">Identificación</p>
        <h3 id="guidedTitle">Datos básicos</h3>
        <p id="guidedText">Rellena los datos mínimos para reconocer la ficha.</p>
      </div>
      <aside class="guided-tips" aria-label="Consejos del paso">
        <strong>Consejos rápidos</strong>
        <ul id="guidedTips"></ul>
      </aside>
    `;
    wizard.insertAdjacentElement('beforebegin', hero);

    const quick = document.createElement('div');
    quick.className = 'quick-actions no-print';
    quick.innerHTML = `
      <button type="button" id="quickSaveBtn">Guardar ahora</button>
      <button type="button" id="quickPreviewBtn">Ver ficha</button>
      <button type="button" id="quickClearBtn">Nueva ficha limpia</button>
    `;
    wizard.insertAdjacentElement('afterend', quick);

    const save = $('quickSaveBtn'), preview = $('quickPreviewBtn'), clear = $('quickClearBtn');
    if(save) save.onclick = () => $('saveFichaBtn')?.click();
    if(preview) preview.onclick = () => $('previewFichaBtn')?.click();
    if(clear) clear.onclick = () => {
      if(typeof state !== 'undefined' && state.dirty && !confirm('Hay cambios sin guardar. ¿Crear una ficha nueva?')) return;
      if(typeof clearForm === 'function') clearForm();
      if(typeof setStep === 'function') setStep(0);
      if(window.setSantaScreen) window.setSantaScreen('form');
    };
  }

  function enhanceSections(){
    const map = [
      ['Datos principales', 'Completa primero estos campos. Son los que identifican la ficha y se verán arriba en el PDF.', '📌'],
      ['Foto opcional', 'Puedes añadir una foto si se autoriza su uso. La imagen queda cifrada dentro de la base local.', '📷'],
      ['Bienestar y forma de tratarle', 'Escribe pautas sencillas y humanas. Cada línea se convertirá en un punto de la ficha.', '💚'],
      ['Cuidados y observaciones', 'Registra solo información útil para la atención diaria y para evitar errores de cuidado.', '🩺']
    ];
    document.querySelectorAll('.form-section').forEach(section => {
      if(section.dataset.guided === '1') return;
      const h3 = section.querySelector('h3');
      if(!h3) return;
      const found = map.find(([title]) => title === h3.textContent.trim());
      if(!found) return;
      section.dataset.guided = '1';
      section.classList.add('guided-section');
      const note = document.createElement('div');
      note.className = 'section-guide-note';
      note.innerHTML = `<span>${found[2]}</span><p>${found[1]}</p>`;
      h3.insertAdjacentElement('afterend', note);
    });
  }

  function enhanceRequiredFields(){
    const nombre = $('nombre');
    if(!nombre || $('nombreAssist')) return;
    const assist = document.createElement('p');
    assist.id = 'nombreAssist';
    assist.className = 'field-assist';
    assist.textContent = 'Campo obligatorio para guardar la ficha y generar QR.';
    nombre.insertAdjacentElement('afterend', assist);
    nombre.addEventListener('input', () => {
      nombre.classList.toggle('field-warning', !nombre.value.trim());
      assist.classList.toggle('warning', !nombre.value.trim());
    });
    nombre.classList.toggle('field-warning', !nombre.value.trim());
    assist.classList.toggle('warning', !nombre.value.trim());
  }

  function watchStepChanges(){
    const stepCounter = $('stepCounter');
    if(stepCounter){
      new MutationObserver(refreshGuide).observe(stepCounter, {childList:true, characterData:true, subtree:true});
    }
    document.querySelectorAll('[data-go-step], #nextStepBtn, #prevStepBtn, #previewFichaBtn, #backToFormBtn').forEach(btn => {
      btn.addEventListener('click', () => setTimeout(refreshGuide, 80));
    });
  }

  function currentStep(){
    if(typeof state !== 'undefined' && Number.isFinite(state.step)) return state.step;
    const text = $('stepCounter')?.textContent || '1 de 4';
    const n = parseInt(text, 10);
    return Number.isFinite(n) ? Math.max(0, n - 1) : 0;
  }

  function refreshGuide(){
    const meta = stepMeta[Math.max(0, Math.min(stepMeta.length - 1, currentStep()))];
    if(!meta) return;
    const icon = $('guidedIcon'), tag = $('guidedTag'), title = $('guidedTitle'), text = $('guidedText'), tips = $('guidedTips');
    if(icon) icon.textContent = meta.icon;
    if(tag) tag.textContent = meta.tag;
    if(title) title.textContent = meta.title;
    if(text) text.textContent = meta.text;
    if(tips) tips.innerHTML = meta.tips.map(t => `<li>${escapeHtml(t)}</li>`).join('');
    document.querySelector('.editor')?.setAttribute('data-current-step', String(currentStep()));
  }

  function escapeHtml(str){
    return String(str || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }
})();
