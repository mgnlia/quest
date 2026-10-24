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
  document.addEventListener('visibilitychange', () => { if (document.hidden) App.save(); });
})();
