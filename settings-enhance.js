(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  function ready(fn){ document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

  ready(() => {
    buildSettingsDashboard();
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

  function refreshVersion(){
    const out = $('settingsVersionText');
    if(out) out.textContent = $('appVersion')?.textContent || '—';
  }
})();
