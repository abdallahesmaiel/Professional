(function(){
'use strict';
var S=function(){return window.__store||{products:[],wishlist:[]}};
var $=function(s,r){return (r||document).querySelector(s)};
var esc=function(t){var d=document.createElement('div');d.textContent=t==null?'':String(t);return d.innerHTML};
var fmt=function(n){return (Math.round((n||0)*100)/100).toLocaleString('ar-EG')+' ج'};
var LS={get:function(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var price=function(p){try{return S().price(p)}catch(e){return +p.price||0}};
var find=function(id){return S().products.filter(function(x){return x.id===id})[0]};
var DAY=864e5;

/* alerts store */
function alerts(){return LS.get('mk_alerts',[]).filter(function(a){return Date.now()-a.ts<7*DAY})}
function addAlert(a){var l=alerts().filter(function(x){return !(x.type===a.type&&x.id===a.id)});a.ts=Date.now();l.unshift(a);LS.set('mk_alerts',l.slice(0,10));render();try{NotificationSystem.info(a.txt.replace(/<[^>]+>/g,''))}catch(e){}}
function dismiss(i){var l=alerts();l.splice(i,1);LS.set('mk_alerts',l);render()}
function render(){
  var home=$('#homePage');if(!home)return;var box=$('#mkAlerts');
  var l=alerts();
  if(!l.length){box&&box.remove();return}
  if(!box){box=document.createElement('div');box.id='mkAlerts';box.setAttribute('role','status');home.insertBefore(box,home.firstChild);
    box.addEventListener('click',function(e){var b=e.target.closest('button'),r=e.target.closest('.mk-al');if(!r)return;var i=+r.dataset.i,a=alerts()[i];
      if(b){dismiss(i);return}
      if(!a)return;dismiss(i);if(a.type==='cart'){window.switchPage&&window.switchPage('cart')}else if(a.id&&window.openProductDetail){window.openProductDetail(a.id)}})}
  box.innerHTML=l.slice(0,3).map(function(a,i){return '<div class="mk-al '+a.type+'" data-i="'+i+'" role="button" tabindex="0"><span style="font-size:20px">'+({cart:'🛒',price:'📉',stock:'📦'})[a.type]+'</span><span class="t">'+a.txt+'</span><button aria-label="إخفاء">✕</button></div>'}).join('');
}

/* watch list: {id:{p:lastPrice,s:wasOutOfStock}} */
function watch(){return LS.get('mk_watch',{})}
function check(){
  var P=S().products;if(!P.length)return;
  var w=watch(),ch=false;
  (S().wishlist||[]).forEach(function(id){if(!w[id]){var p=find(id);if(p){w[id]={p:price(p),s:(p.quantity||0)<1?1:0,auto:1};ch=true}}});
  Object.keys(w).forEach(function(id){
    var p=find(id);if(!p)return;var cur=price(p),it=w[id];
    if(it.s&&(p.quantity||0)>0){addAlert({type:'stock',id:id,txt:'<b>'+esc(p.name)+'</b> رجع متوفر!'});it.s=0;it.p=cur;ch=true}
    else if(!it.s&&cur<it.p-0.009&&(p.quantity||0)>0){addAlert({type:'price',id:id,txt:'سعر <b>'+esc(p.name)+'</b> نزل من '+fmt(it.p)+' إلى <b>'+fmt(cur)+'</b>'});it.p=cur;ch=true}
    else if(Math.abs(cur-it.p)>0.009&&!it.s){it.p=cur;ch=true}
    else if(!it.s&&(p.quantity||0)<1){it.s=1;ch=true}
  });
  if(ch)LS.set('mk_watch',w);
}

/* abandoned cart: in-app recovery after >2h away */
var LAST='mk_last_seen';
function cartCheck(){
  var C=window.__cart;if(!C)return;var items=C.items();if(!items.length)return;
  var last=+localStorage.getItem(LAST)||0;
  if(last&&Date.now()-last>2*36e5&&Date.now()-(+localStorage.getItem('mk_cart_nudge')||0)>DAY){
    var sub=C.subtotal();
    addAlert({type:'cart',txt:'سلتك مستنياك: <b>'+items.length+'</b> منتج بإجمالي <b>'+fmt(sub)+'</b> — كمّل طلبك'});
    try{localStorage.setItem('mk_cart_nudge',String(Date.now()))}catch(e){}
  }
}
function touch(){try{localStorage.setItem(LAST,String(Date.now()))}catch(e){}}

/* PDP watch button */
function pdpBtn(){
  var m=$('#productDetailModal');if(!m||!m.classList.contains('show'))return;
  var b=$('#detailAddToCart'),id=b&&b.dataset.productId;if(!id)return;var p=find(id);if(!p)return;
  var o=$('.mk-watch',m);o&&o.remove();
  var w=watch(),oos=(p.quantity||0)<1,on=!!(w[id]&&!w[id].auto);
  var btn=document.createElement('button');btn.type='button';btn.className='mk-watch'+(on?' on':'');
  var paint=function(){btn.textContent=on?(oos?'✅ هننبهك لما يتوفر (اضغط للإلغاء)':'✅ هننبهك لو السعر نزل (اضغط للإلغاء)'):(oos?'🔔 أبلغني عند التوفر':'🔔 نبّهني لو السعر نزل');btn.classList.toggle('on',on);btn.setAttribute('aria-pressed',on)};paint();
  btn.onclick=function(){var w=watch();if(on){delete w[id];on=false}else{w[id]={p:price(p),s:oos?1:0};on=true;try{NotificationSystem.success('تم. هننبهك عند فتح المتجر')}catch(e){}}LS.set('mk_watch',w);paint()};
  var st=$('#detailStock');if(st)st.insertAdjacentElement('afterend',btn);
}
var t;function later(){clearTimeout(t);t=setTimeout(pdpBtn,160)}
var m=$('#productDetailModal');if(m)new MutationObserver(later).observe(m,{attributes:true,attributeFilter:['class']});
var n=$('#detailName');if(n)new MutationObserver(later).observe(n,{childList:true,characterData:true,subtree:true});

/* loyalty badge in cart page */
function badge(){
  var host=$('#cartPageContent');if(!host||!window.__cart)return;
  var d=window.__cart.orders().filter(function(o){return o.status==='delivered'||o.deliveredAt}).length;
  var old=$('#mkLoy');
  var label=d>=5?'👑 عميل VIP':d>=2?'🏅 مشتري متكرر':d>=1?'⭐ عميل مميز':'';
  if(!label){old&&old.remove();return}
  var txt=label+' — '+d+' طلب مكتمل';
  if(old&&old.textContent===txt)return;old&&old.remove();
  var b=document.createElement('div');b.id='mkLoy';b.className='mk-badge';b.textContent=txt;host.insertBefore(b,host.firstChild);
}
var started=false;
__tick(function(){
  try{
    if(!S().products.length)return;
    check();
    if(!started){started=true;cartCheck();touch()}
    render();badge();
  }catch(e){console.warn('[ret]',e)}
},3000);
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')touch()});
window.addEventListener('pagehide',touch);
setInterval(touch,60000);
})();
