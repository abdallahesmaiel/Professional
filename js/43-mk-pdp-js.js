(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var S=function(){return window.__store||{products:[],wishlist:[]}};
var esc=function(t){var d=document.createElement('div');d.textContent=t==null?'':String(t);return d.innerHTML};
var fmt=function(n){return (Math.round((n||0)*100)/100).toLocaleString('ar-EG')+' ج'};
var th=function(u,w){return S().thumb?S().thumb(u,w||200):u};
var fin=function(p){try{return S().price(p)}catch(e){return +p.price||0}};
var cur=null,imgs=[],idx=0;

function gallery(p){
  var list=[p.image];
  ['images','gallery','extraImages','photos'].forEach(function(k){
    var v=p[k];if(!v)return;
    (Array.isArray(v)?v:Object.keys(v).map(function(x){return v[x]})).forEach(function(u){if(typeof u==='string'&&u&&list.indexOf(u)<0)list.push(u)})
  });
  return list.filter(Boolean);
}
/* lightbox with pinch / wheel / double-tap zoom */
function lightbox(i){
  var lb=document.createElement('div');lb.className='mk-lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
  lb.innerHTML='<img alt=""><button class="c" aria-label="إغلاق">✕</button>'+(imgs.length>1?'<button class="pv" aria-label="التالي">›</button><button class="nx" aria-label="السابق">‹</button>':'');
  document.body.appendChild(lb);
  var im=lb.querySelector('img'),sc=1,tx=0,ty=0,pts={},d0=0,s0=1,last=0,entry={pushed:false,pop:function(){destroy()}};
  function apply(){im.style.transform='translate('+tx+'px,'+ty+'px) scale('+sc+')'}
  function show(n){idx=(n+imgs.length)%imgs.length;im.src=imgs[idx];sc=1;tx=ty=0;apply()}
  function destroy(){document.removeEventListener('keydown',key,true);lb.remove()}
  function close(){destroy();var k=window.__mkLayers.indexOf(entry);if(k>=0&&entry.pushed){window.__mkLayers.splice(k,1);entry.pushed=false;window.__mkSkip=true;try{history.back()}catch(e){window.__mkSkip=false}}}
  function key(e){if(e.key==='Escape'){e.stopImmediatePropagation();e.preventDefault();close()}else if(e.key==='ArrowLeft')show(idx+1);else if(e.key==='ArrowRight')show(idx-1)}
  document.addEventListener('keydown',key,true);
  try{history.pushState(Object.assign({},history.state,{mkLb:1}),'');window.__mkLayers.push(entry);entry.pushed=true}catch(e){}
  show(i);lb.querySelector('.c').focus();
  lb.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.classList.contains('c'))close();else if(b.classList.contains('nx'))show(idx-1);else if(b.classList.contains('pv'))show(idx+1)});
  lb.addEventListener('wheel',function(e){e.preventDefault();sc=Math.max(1,Math.min(5,sc*(e.deltaY<0?1.15:.87)));if(sc===1)tx=ty=0;apply()},{passive:false});
  lb.addEventListener('pointerdown',function(e){if(e.target.closest('button'))return;pts[e.pointerId]={x:e.clientX,y:e.clientY};lb.setPointerCapture&&lb.setPointerCapture(e.pointerId);
    var ks=Object.keys(pts);if(ks.length===2){d0=Math.hypot(pts[ks[0]].x-pts[ks[1]].x,pts[ks[0]].y-pts[ks[1]].y);s0=sc}
    var now=Date.now();if(ks.length===1&&now-last<300){sc=sc>1?1:2.5;if(sc===1)tx=ty=0;apply()}last=now});
  lb.addEventListener('pointermove',function(e){var q=pts[e.pointerId];if(!q)return;var ks=Object.keys(pts);
    if(ks.length===2){pts[e.pointerId]={x:e.clientX,y:e.clientY};var d=Math.hypot(pts[ks[0]].x-pts[ks[1]].x,pts[ks[0]].y-pts[ks[1]].y);sc=Math.max(1,Math.min(5,s0*d/(d0||1)));apply()}
    else if(sc>1){tx+=e.clientX-q.x;ty+=e.clientY-q.y;pts[e.pointerId]={x:e.clientX,y:e.clientY};apply()}
    else pts[e.pointerId]={x:e.clientX,y:e.clientY,sx:q.sx==null?q.x:q.sx}});
  function up(e){var q=pts[e.pointerId];delete pts[e.pointerId];
    if(q&&sc===1&&imgs.length>1&&q.sx!=null){var dx=e.clientX-q.sx;if(Math.abs(dx)>60)show(dx<0?idx+1:idx-1)}}
  lb.addEventListener('pointerup',up);lb.addEventListener('pointercancel',function(e){delete pts[e.pointerId]});
}
function mark(){}

/* build everything for the current product */
function build(){
  var btn=$('#detailAddToCart'),id=btn&&btn.dataset.productId;if(!id)return;
  var p=S().products.filter(function(x){return x.id===id})[0];if(!p)return;
  cur=p;imgs=gallery(p);idx=0;
  var wrap=$('#detailImageWrap'),info=$('#productDetailModal .product-detail-info');if(!wrap||!info)return;
  ['.mk-thumbs','.mk-wish','.mk-zoomhint'].forEach(function(s){var o=$(s,wrap.parentNode);o&&o.remove()});
  ['.mk-bundle','.mk-rv'].forEach(function(s){var o=$(s,info);o&&o.remove()});
  var im=$('#detailImage');
  if(im&&p.image){var ht=document.createElement('span');ht.className='mk-zoomhint';ht.textContent='اضغط للتكبير';wrap.appendChild(ht)}
  if(imgs.length>1){
    var tb=document.createElement('div');tb.className='mk-thumbs';
    tb.innerHTML=imgs.map(function(u,i){return '<button type="button" class="'+(i?'':'on')+'" data-i="'+i+'" aria-label="صورة '+(i+1)+'"><img src="'+esc(th(u,120))+'" alt="" loading="lazy"></button>'}).join('');
    wrap.insertAdjacentElement('afterend',tb);
    tb.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;idx=+b.dataset.i;im.src=th(imgs[idx],600);tb.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b)})});
  }
  var w=document.createElement('button');w.type='button';w.className='mk-wish';w.setAttribute('aria-label','المفضلة');
  var on=function(){return (S().wishlist||[]).indexOf(p.id)>=0||(S().wishlist||[]).some(function(x){return x&&x.id===p.id})};
  var paint=function(){var o=on();w.classList.toggle('on',o);w.textContent=o?'♥':'♡';w.setAttribute('aria-pressed',o)};paint();
  w.onclick=function(e){e.stopPropagation();try{S().toggleWish(p.id)}catch(x){}setTimeout(paint,50)};
  wrap.appendChild(w);
  /* bundle: complements from same category */
  var sim=S().products.filter(function(x){return x.id!==p.id&&(x.quantity||0)>0&&x.category===p.category}).sort(function(a,b){return Math.abs(fin(a)-fin(p))-Math.abs(fin(b)-fin(p))}).slice(0,2);
  var anchor=$('#similarWrap');
  if(sim.length&&(p.quantity||0)>0&&anchor){
    var bx=document.createElement('div');bx.className='mk-bundle';
    var all=[p].concat(sim);
    bx.innerHTML='<h4>🛍️ كمّل طلبك</h4>'+all.map(function(x,i){return '<div class="mk-bi"><label><input type="checkbox" data-b="'+i+'" checked'+(i===0?' disabled':'')+'><img src="'+esc(th(x.image,100))+'" alt="" loading="lazy"><span>'+esc(x.name)+'</span></label><b>'+fmt(fin(x))+'</b></div>'}).join('')+'<div class="mk-bsum"><span>الإجمالي: <b id="mkBt"></b></span><button type="button" class="mk-bbtn">أضف المحدد للسلة</button></div>';
    anchor.insertAdjacentElement('beforebegin',bx);
    var calc=function(){var t=0;bx.querySelectorAll('input').forEach(function(c){if(c.checked)t+=fin(all[+c.dataset.b])});bx.querySelector('#mkBt').textContent=fmt(t)};calc();
    bx.addEventListener('change',calc);
    bx.querySelector('.mk-bbtn').onclick=function(){var n=0;bx.querySelectorAll('input').forEach(function(c){if(c.checked){try{window.addToCart(all[+c.dataset.b].id);n++}catch(e){}}})};
  }
  /* recently viewed */
  var rec=[];try{rec=JSON.parse(localStorage.getItem('mk_recent')||'[]')}catch(e){}
  var rp=rec.filter(function(r){return r!==p.id}).map(function(r){return S().products.filter(function(x){return x.id===r})[0]}).filter(Boolean).slice(0,8);
  if(rp.length&&anchor){
    var rv=document.createElement('div');rv.className='mk-rv';
    rv.innerHTML='<h4>🕘 شاهدتها مؤخرًا</h4><div class="row">'+rp.map(function(x){return '<div class="sim-card" data-sim-id="'+esc(x.id)+'" role="button" tabindex="0"><div class="im"><img loading="lazy" src="'+esc(th(x.image,200))+'" alt=""></div><div style="font-size:12px;margin-top:4px">'+esc(x.name)+'</div><b style="font-size:12px;color:#8a5a1f">'+fmt(fin(x))+'</b></div>'}).join('')+'</div>';
    anchor.insertAdjacentElement('afterend',rv);
    rv.addEventListener('click',function(e){var c=e.target.closest('[data-sim-id]');c&&window.openProductDetail&&window.openProductDetail(c.dataset.simId)});
  }
}
document.addEventListener('click',function(e){
  if(e.target.id==='detailImage'&&imgs.length)lightbox(idx);
  else if(e.target.closest('#detailRating')){var a=$('#reviewsAnchor');a&&a.scrollIntoView({behavior:'smooth',block:'start'})}
});
var t;function later(){clearTimeout(t);t=setTimeout(function(){var m=$('#productDetailModal');if(m&&m.classList.contains('show'))try{build()}catch(e){console.warn('[pdp]',e)}},120)}
var m=$('#productDetailModal');
if(m)new MutationObserver(later).observe(m,{attributes:true,attributeFilter:['class']});
var n=$('#detailName');if(n)new MutationObserver(later).observe(n,{childList:true,characterData:true,subtree:true});
})();
