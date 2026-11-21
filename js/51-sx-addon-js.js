(function(){
  'use strict';
  /* 1) تحميل الصور كسولاً (أسرع + يوفر باقة العميل) */
  function lazy(root){
    try{(root.querySelectorAll?root.querySelectorAll('img:not([loading])'):[]).forEach(function(im,i){
      if(im.closest('header,.top-bar,.hero,[class*="banner"],[class*="slider"]'))return;
      im.setAttribute('loading','lazy');im.setAttribute('decoding','async');});}catch(e){}
  }
  lazy(document);
  try{new MutationObserver(function(m){m.forEach(function(r){r.addedNodes.forEach(function(n){if(n.nodeType===1){if(n.tagName==='IMG'&&!n.hasAttribute('loading')&&!n.closest('header,.hero,[class*="banner"],[class*="slider"]')){n.setAttribute('loading','lazy');n.setAttribute('decoding','async');}else lazy(n);}});});}).observe(document.body,{childList:true,subtree:true});}catch(e){}

  /* 4) شبكة أمان: أخطاء غير متوقعة لا تُظهر شاشة بيضاء، وتُبلَّغ مرة كل 8 ثوانٍ فقط */
  var last=0;
  addEventListener('unhandledrejection',function(e){
    var now=Date.now();if(now-last<8000)return;last=now;
    try{console.warn('unhandled:',e.reason);}catch(_){}
  });
})();
