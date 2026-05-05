(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const guide = [
    {
      icon: '🧾',
      title: 'Datos básicos',
      text: 'Identifica la ficha con los datos mínimos. Nombre y habitación son los campos que más ayudan a localizarla después.',
      tips: ['Nombre visible', 'Habitación o ubicación', 'Estado de la ficha', 'Referente o contacto autorizado']
    },
    {
      icon: '💚',
      title: 'Bienestar y trato',
      text: 'Describe cómo tratar mejor a la persona: qué le tranquiliza, qué le incomoda y qué claves debe conocer el personal.',
      tips: ['Lo que le hace sentir bien', 'Lo que puede incomodarle', 'Claves para cuidarle mejor']
    },
    {
      icon: '🩺',
      title: 'Cuidados importantes',
      text: 'Completa los aspectos prácticos de cuidado diario. Las alertas, alergias y movilidad deben quedar muy claras.',
      tips: ['Comunicación', 'Movilidad', 'Alimentación', 'Sueño', 'Alergias', 'Alertas']
    },
    {
      icon: '📄',
      title: 'Resultado final',
      text: 'Revisa la ficha como quedará impresa. Desde aquí puedes guardar, imprimir el PDF o generar el QR de la ficha.',
      tips: ['Guardar antes de QR', 'Revisar datos sensibles', 'Imprimir o guardar PDF']
    }
  ];

  function ready(fn){ document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

  ready(() => {
    buildGuidedShell();
    patchStepUpdates();
    updateGuide();
  });

  function buildGuidedShell(){
    const wizard = document.querySelector('.wizard-card');
    const form = document.querySelector('.form-grid');
    if(!wizard || !form || $('guidedHelper')) return;

    const helper = document.createElement('section');
    helper.id = 'guidedHelper';
    helper.className = 'guided-helper no-print';
    helper.innerHTML = `
      <div class="guided-helper-icon" id="guidedHelperIcon">🧾</div>
      <div class="guided-helper-body">
        <p class="eyebrow">Asistente guiado</p>
        <h3 id="guidedHelperTitle">Datos básicos</h3>
        <p id="guidedHelperText">Completa la ficha paso a paso.</p>
        <div id="guidedHelperTips" class="guided-tips"></div>
      </div>
    `;
    wizard.insertAdjacentElement('afterend', helper);

    const quick = document.createElement('section');
    quick.id = 'quickProgress';
    quick.className = 'quick-progress no-print';
    quick.innerHTML = `
      <article><strong id="quickName">Sin nombre</strong><span>Nombre</span></article>
      <article><strong id="quickRoom">—</strong><span>Habitación</span></article>
      <article><strong id="quickStatus">Activa</strong><span>Estado</span></article>
      <article><strong id="quickRequired">0%</strong><span>Completado</span></article>
    `;
    helper.insertAdjacentElement('afterend', quick);

    document.querySelectorAll('.form-section[data-step]').forEach(section => {
      const step = Number(section.dataset.step || 0);
      section.classList.add('guided-section-card');
      if(!section.querySelector('.section-guide-label')){
        const label = document.createElement('div');
        label.className = 'section-guide-label';
        label.innerHTML = `<span>${guide[step]?.icon || '•'}</span><small>${guide[step]?.title || 'Paso'}</small>`;
        section.prepend(label);
      }
    });

    const watched = ['nombre','habitacion','estado','resumen','bien','incomoda','claves','comunicacion','movilidad','alimentacion','sueno','alergias','alertas','observaciones'];
    watched.forEach(id => {
      const el = $(id);
      if(el) el.addEventListener('input', updateQuickProgress);
      if(el) el.addEventListener('change', updateQuickProgress);
    });
    updateQuickProgress();
  }

  function patchStepUpdates(){
    const oldSetStep = window.setStep;
    if(typeof oldSetStep === 'function' && !oldSetStep.__guidedPatched){
      window.setStep = function(n){
        const result = oldSetStep.apply(this, arguments);
        setTimeout(() => { updateGuide(); updateQuickProgress(); }, 40);
        return result;
      };
      window.setStep.__guidedPatched = true;
    }

    document.querySelectorAll('[data-go-step], #prevStepBtn, #nextStepBtn, #previewFichaBtn, #backToFormBtn').forEach(btn => {
      btn.addEventListener('click', () => setTimeout(() => { updateGuide(); updateQuickProgress(); }, 120));
    });
  }

  function currentStep(){
    if(typeof state !== 'undefined' && Number.isFinite(state.step)) return Math.max(0, Math.min(3, state.step));
    const active = document.querySelector('.step-pill.active');
    return active ? Number(active.dataset.goStep || 0) : 0;
  }

  function updateGuide(){
    const idx = currentStep();
    const item = guide[idx] || guide[0];
    const icon = $('guidedHelperIcon'), title = $('guidedHelperTitle'), text = $('guidedHelperText'), tips = $('guidedHelperTips');
    if(icon) icon.textContent = item.icon;
    if(title) title.textContent = item.title;
    if(text) text.textContent = item.text;
    if(tips) tips.innerHTML = item.tips.map(t => `<span>${escapeHtml(t)}</span>`).join('');
    document.querySelectorAll('.guided-helper').forEach(el => {
      el.dataset.step = String(idx);
    });
  }

  function updateQuickProgress(){
    const name = value('nombre') || 'Sin nombre';
    const room = value('habitacion') || '—';
    const status = value('estado') || 'Activa';
    const fields = ['nombre','habitacion','estado','resumen','bien','incomoda','claves','comunicacion','movilidad','alimentacion','sueno','alergias','alertas','observaciones'];
    const filled = fields.filter(id => value(id)).length;
    const percent = Math.round((filled / fields.length) * 100);
    if($('quickName')) $('quickName').textContent = name;
    if($('quickRoom')) $('quickRoom').textContent = room;
    if($('quickStatus')) $('quickStatus').textContent = status;
    if($('quickRequired')) $('quickRequired').textContent = percent + '%';
  }

  function value(id){ return ($(id)?.value || '').trim(); }
  function escapeHtml(str){ return String(str||'').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
})();
