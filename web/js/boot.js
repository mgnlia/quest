/* Quest demo — boot */
'use strict';
(function(){
  App.load();
  applyTheme();
  if (window.matchMedia){
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if ((App.state.theme || 'system') === 'system'){ nativeStatusBar(); } };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
  }
  if (!location.hash) location.replace('#/login');
  App.render();
  window.addEventListener('pagehide', () => App.save());
  // Installable PWA on the web; the Android APK serves the same files itself and skips this.
  const inApk = !!window.QuestNative || location.hostname === 'appassets.androidplatform.net';
  if ('serviceWorker' in navigator && !inApk && /^https?:$/.test(location.protocol)){
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) App.save(); });
})();
