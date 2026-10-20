(() => {
  const root = document.documentElement;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone =
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches;

  root.classList.add('pwa');
  if (isIOS) root.classList.add('is-ios');
  if (isStandalone) root.classList.add('is-standalone');

  // Keep iOS gestures from fighting the slingshot.
  document.addEventListener('gesturestart', (event) => event.preventDefault(), { passive: false });
  document.addEventListener('contextmenu', (event) => event.preventDefault());

  if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('service-worker.js', document.baseURI).href).catch((error) => {
        console.warn('[Angry Aviators] Offline cache unavailable:', error.message);
      });
    });
  }

  // A gentle install hint for Safari visitors. Once installed, it stays gone.
  const dismissed = sessionStorage.getItem('aa-ios-install-dismissed') === '1';
  if (isIOS && !isStandalone && !dismissed) {
    const banner = document.createElement('div');
    banner.className = 'ios-install';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Install Angry Aviators');

    const icon = document.createElement('span');
    icon.className = 'ios-install-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '↑';

    const copy = document.createElement('div');
    copy.className = 'ios-install-copy';
    const title = document.createElement('strong');
    title.textContent = 'INSTALL ANGRY AVIATORS';
    const detail = document.createElement('span');
    const isSafari = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    detail.textContent = isSafari
      ? 'Tap Share, then “Add to Home Screen” for full-screen, offline play.'
      : 'Open this page in Safari, then use Share → “Add to Home Screen”.';
    copy.append(title, detail);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'ios-install-close';
    close.setAttribute('aria-label', 'Dismiss install instructions');
    close.textContent = '×';
    close.addEventListener('click', () => {
      sessionStorage.setItem('aa-ios-install-dismissed', '1');
      banner.remove();
    });

    banner.append(icon, copy, close);
    document.body.appendChild(banner);
  }

  // Shown automatically over the game in portrait via CSS.
  if (!document.getElementById('rotateGate')) {
    const gate = document.createElement('div');
    gate.id = 'rotateGate';
    gate.setAttribute('role', 'status');
    gate.innerHTML = [
      '<div class="rotate-phone" aria-hidden="true"><span></span></div>',
      '<strong>TURN IT SIDEWAYS</strong>',
      '<p>Angry Aviators is a landscape game.<br>Rotate your device to keep playing.</p>'
    ].join('');
    document.body.appendChild(gate);
  }

  // Keep the viewport height honest when Safari's chrome animates.
  const setViewportHeight = () => {
    root.style.setProperty('--app-height', `${window.innerHeight}px`);
  };
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => setTimeout(setViewportHeight, 200));
})();
