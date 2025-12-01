(() => {
  if (window.__ypmLoaded) return;
  window.__ypmLoaded = true;

  const ready = () => document.body;
  if (!ready()) {
    const observer = new MutationObserver(() => {
      if (ready()) {
        observer.disconnect();
        init();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } else {
    init();
  }

  function init() {
    if (document.getElementById('ypm-launcher')) return;

    const button = document.createElement('button');
    button.id = 'ypm-launcher';
    button.className = 'ypm-launcher-btn';
    button.type = 'button';
    button.textContent = 'Mentor';
    button.setAttribute('aria-expanded', 'false');

    const tooltip = document.createElement('span');
    tooltip.className = 'ypm-tooltip';
    tooltip.textContent = 'Need a hint?';
    button.appendChild(tooltip);

    const iframe = document.createElement('iframe');
    iframe.className = 'ypm-panel-frame';
    iframe.title = 'Your Personal Mentor';
    iframe.src = chrome.runtime.getURL('panel.html');

    button.addEventListener('click', () => togglePanel());
    document.body.append(button, iframe);

    window.addEventListener('message', (event) => {
      if (event.data?.type === 'YPM_HIDE_PANEL') {
        togglePanel(false);
      }
    });

    if (!localStorage.getItem('ypm_has_seen_panel')) {
      setTimeout(() => {
        tooltip.classList.add('ypm-visible');
        togglePanel(true);
        localStorage.setItem('ypm_has_seen_panel', '1');
        setTimeout(() => tooltip.classList.remove('ypm-visible'), 3000);
      }, 2500);
    }

    chrome.runtime?.onMessage?.addListener((message) => {
      if (message?.type === 'YPM_TOGGLE_PANEL') {
        togglePanel();
      }
    });

    function togglePanel(force) {
      const isOpen = iframe.classList.contains('ypm-open');
      const nextState = typeof force === 'boolean' ? force : !isOpen;
      iframe.classList.toggle('ypm-open', nextState);
      button.setAttribute('aria-expanded', String(nextState));
    }
  }
})();
