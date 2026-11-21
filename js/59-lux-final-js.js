(function(){
'use strict';
/* Ripple + cart feedback (delegated, does not interfere with app handlers) */
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('.add-btn,.btn-primary,#mkDockBtn');
  if(!b||b.disabled)return;
  var r=b.getBoundingClientRect(),s=Math.max(r.width,r.height),d=document.createElement('span');
  d.className='lux-ripple';d.style.cssText='width:'+s+'px;height:'+s+'px;left:'+(e.clientX-r.left-s/2)+'px;top:'+(e.clientY-r.top-s/2)+'px';
  if(getComputedStyle(b).position==='static')b.style.position='relative';
  b.appendChild(d);setTimeout(function(){d.remove()},650);
  if(b.classList.contains('add-btn')){
    var w=document.getElementById('cartWidgetTop');
    if(w){w.classList.remove('lux-bump');void w.offsetWidth;w.classList.add('lux-bump')}
    if(navigator.vibrate){try{navigator.vibrate(18)}catch(x){}}
  }
},true);
/* Scroll reveal for sections */
var io='IntersectionObserver' in window?new IntersectionObserver(function(en){
  en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})
},{threshold:.08}):null;
function reveal(){
  if(!io)return;
  document.querySelectorAll('.trust-item,.promo-slide,.review-summary,.returns-empty-state,.cart-item,.search-results-heading').forEach(function(el){
    if(!el.__lux){el.__lux=1;el.classList.add('lux-reveal');io.observe(el)}
  });
}
/* Watch DOM for dynamically rendered cards / cart items */
var mo=new MutationObserver(function(){clearTimeout(mo.t);mo.t=setTimeout(reveal,120)});
mo.observe(document.body,{childList:true,subtree:true});
reveal();
/* Cart badge bump when count changes */
var last=null;
setInterval(function(){
  var c=document.getElementById('cartCountTop');if(!c)return;
  var v=c.textContent;
  if(last!==null&&v!==last){var w=document.getElementById('cartWidgetTop');if(w){w.classList.remove('lux-bump');void w.offsetWidth;w.classList.add('lux-bump')}}
  last=v;
},700);
/* Always-visible zoom-friendly header colour */
var m=document.querySelector('meta[name=theme-color]');if(m&&document.documentElement.getAttribute('data-theme')!=='dark')m.content='#1A0F07';
})();
