(function(){
'use strict';
var dock,io,watched=null,barVisible=false;
function mk(){
 if(dock)return dock;
 dock=document.createElement('div');dock.id='mkCheckoutDock';dock.hidden=true;
 dock.innerHTML='<div class="mk-dock-in"><div class="mk-dock-tot"><small>الإجمالي</small><b id="mkDockTotal">0.00 ج</b><span id="mkDockCount"></span></div><button type="button" id="mkDockBtn">إتمام الطلب <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button></div>';
 document.body.appendChild(dock);
 dock.querySelector('#mkDockBtn').addEventListener('click',function(){var b=document.getElementById('openCheckoutBtn');if(b)b.click()});
 return dock;
}
function update(){
 var page=document.getElementById('cartPage'),btn=document.getElementById('openCheckoutBtn');
 if(dock&&window.__waNum&&!dock.querySelector('#mkDockWa')){var w=document.createElement('button');w.type='button';w.id='mkDockWa';w.setAttribute('aria-label','اطلب عبر واتساب');w.textContent='💬';w.addEventListener('click',function(){window.__mkWaStart&&window.__mkWaStart()});var tot=dock.querySelector('.mk-dock-tot');tot.insertAdjacentElement('afterend',w)}
 var on=!!(page&&page.classList.contains('active-page')&&btn);
 mk();
 if(!on){dock.hidden=true;document.body.classList.remove('mk-dock-on');watched=null;return}
 if(watched!==btn){
  if(io)io.disconnect();
  io=new IntersectionObserver(function(en){barVisible=en[0].isIntersecting;apply()},{threshold:.6});
  io.observe(btn);watched=btn;barVisible=false;
 }
 var t=document.querySelector('.cx-bar .tot b')||document.querySelector('.cx-sum .r.t span:last-child');
 if(t)document.getElementById('mkDockTotal').textContent=t.textContent.trim();
 var ch=document.querySelector('.cx-chip');document.getElementById('mkDockCount').textContent=ch?ch.textContent.trim():'';
 apply();
}
function apply(){
 var show=watched&&!barVisible;
 dock.hidden=!show;
 document.body.classList.toggle('mk-dock-on',!!show);
}
__tick(update,1000);
document.addEventListener('click',function(){setTimeout(update,60)});
})();
