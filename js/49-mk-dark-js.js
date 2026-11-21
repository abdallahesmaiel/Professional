(function(){
'use strict';
var KEY='mk_theme';
var stored=function(){try{return localStorage.getItem(KEY)}catch(e){return null}};
function apply(t){
  document.documentElement.setAttribute('data-theme',t);
  var m=document.querySelector('meta[name=theme-color]');if(m)m.content=t==='dark'?'#14100c':'#1A0F07';
  var b=document.getElementById('mkThemeBtn');if(b){b.querySelector('span').textContent=t==='dark'?'الوضع الفاتح':'الوضع الداكن (تجريبي)';b.querySelector('i').className='fa-solid '+(t==='dark'?'fa-sun':'fa-moon');b.setAttribute('aria-pressed',t==='dark')}
}
var init=stored()||'light';
apply(init);
var menu=document.getElementById('sideMenu');
if(menu&&!document.getElementById('mkThemeBtn')){
  var b=document.createElement('button');b.type='button';b.id='mkThemeBtn';b.className='menu-item menu-theme';b.innerHTML='<i class="fa-solid fa-moon"></i><span>الوضع الداكن (تجريبي)</span>';
  var div=menu.querySelector('.menu-divider');menu.insertBefore(b,div||null);
  b.onclick=function(){var t=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';try{localStorage.setItem(KEY,t)}catch(e){}apply(t)};
  apply(init);
}
/* واتساب: يظهر فقط لو رقم المتجر محدد في الإعدادات */
function wa(){
  var n=window.__waNum;var el=document.getElementById('mkWa');
  if(!n){el&&el.remove();return}
  if(!el){el=document.createElement('a');el.id='mkWa';el.className='mk-wa';el.target='_blank';el.rel='noopener noreferrer';el.setAttribute('aria-label','تواصل معنا على واتساب');el.innerHTML='<i class="fa-brands fa-whatsapp" aria-hidden="true"></i>';document.body.appendChild(el)}
  el.href=href();
  if(!el.__mkBound){el.__mkBound=1;el.addEventListener('click',function(e){if(window.__mkWaHasCart&&window.__mkWaHasCart()&&window.__mkWaStart){e.preventDefault();window.__mkWaStart();return}el.href=href()},true)}
}
function href(){
  var n=window.__waNum;
  var m=document.getElementById('productDetailModal'),nm=document.getElementById('detailName'),b=document.getElementById('detailAddToCart');
  if(m&&m.classList.contains('show')&&nm&&b&&b.dataset.productId)return 'https://wa.me/'+n+'?text='+encodeURIComponent('مرحباً، عندي استفسار عن: '+nm.textContent.trim()+'\n'+location.origin+location.pathname+'?product='+encodeURIComponent(b.dataset.productId));
  return 'https://wa.me/'+n+'?text='+encodeURIComponent('مرحباً، عندي استفسار عن المتجر');
}
__tick(function(){
  wa();
  var el=document.getElementById('mkWa');if(!el)return;
  var cp=document.getElementById('cartPage'),onCart=cp&&cp.classList.contains('active-page');
  var hide=onCart||document.querySelector('.modal-overlay.show,#checkoutModalOverlay.show')||document.querySelector('.mk-ov');
  el.style.display=hide?'none':'';
},2000);
})();
