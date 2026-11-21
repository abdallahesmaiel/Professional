(function(){
'use strict';
var $=function(q,r){return (r||document).querySelector(q)};
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var CATS=[
 ['مستلزمات شخصية','البقالة','fa-basket-shopping','#2e9e5b,#1b6b3a'],
 ['أجهزة كهربائية','أجهزة كهربائية','fa-plug','#3b82f6,#1d4ed8'],
 ['أجهزة شخصية','أجهزة شخصية','fa-mobile-screen','#8b5cf6,#5b21b6'],
 ['عناية طبيعية','عناية طبيعية','fa-leaf','#10b981,#047857'],
 ['ملابس','ملابس','fa-shirt','#ec4899,#9d174d'],
 ['ألعاب وإكسسوارات','ألعاب وإكسسوارات','fa-gamepad','#f59e0b,#b45309']];
function toast(m){var t=document.createElement('div');t.className='mk-toast';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.classList.add('out')},2200);setTimeout(function(){t.remove()},2600)}
window.__mkToast=toast;
function P(){return (window.__store&&window.__store.products)||[]}
function pct(p){var v=parseFloat(p.discountValue)||0,t=p.discountType;if(!v||t==='none')return 0;
 if(t==='percent')return Math.min(99,Math.round(v));return p.price>0?Math.min(99,Math.round(v/p.price*100)):0}
function fin(p){var v=parseFloat(p.discountValue)||0,t=p.discountType,b=+p.price||0;
 if(t==='percent')return Math.max(0,b-b*Math.min(v,100)/100);if(t==='amount')return Math.max(0,b-v);return b}
function go(page){if(window.switchPage)window.switchPage(page)}
function pickCat(v){
 go('home');
 setTimeout(function(){
  var sel=$('#categorySelect');if(!sel)return;sel.value=v;sel.dispatchEvent(new Event('change',{bubbles:true}));
  var h=$('.mk-grid-h');if(h)h.scrollIntoView({behavior:'smooth',block:'start'});
  document.querySelectorAll('.mk-cats [data-c]').forEach(function(b){b.classList.toggle('on',b.dataset.c===v)});
 },60);
}

/* ---------- شريط إعلاني + الهيدر ---------- */
function buildHeader(){
 var bar=$('.top-bar'),tc=$('.top-container');if(!bar||!tc||$('.mk-cats'))return;
 var a=document.createElement('div');a.className='mk-annc';
 var tk=['🚚 توصيل لحد باب بيتك','💵 الدفع عند الاستلام','↩️ استرجاع خلال 24 ساعة','🎁 توصيل مجاني للطلب الأول','⚡ عروض يومية بخصومات حتى 50%'].map(function(t){return '<span>'+t+'</span>'}).join('');
 var set='<div class="mk-set" aria-hidden="true">'+tk+tk+'</div>';
 a.setAttribute('role','marquee');a.innerHTML='<div class="mk-track"><div class="mk-set">'+tk+tk+'</div>'+set+'</div>';
 bar.parentNode.insertBefore(a,bar);
 var sc=$('.search-container');
 var tl=$('.top-left'),la=$('#logoArea'),rg=$('.logo-ring');if(rg)rg.remove();
 if(tl&&la&&la.parentNode!==tl)tl.insertBefore(la,tl.children[1]||null);
 var tr=$('.top-right');if(sc&&tr)tc.insertBefore(sc,tr);else if(sc)tc.appendChild(sc);
 var n=document.createElement('nav');n.className='mk-cats';n.setAttribute('aria-label','الأقسام');
 n.innerHTML='<button class="mk-all" data-mega><i class="fa-solid fa-bars"></i> كل الأقسام</button><button class="mk-hot" data-deals><i class="fa-solid fa-bolt"></i> العروض</button>'+
  CATS.map(function(c){return '<button data-c="'+esc(c[0])+'"><i class="fa-solid '+c[2]+'"></i> '+esc(c[1])+'</button>'}).join('');
 bar.appendChild(n);
 var m=document.createElement('div');m.className='mk-mega';
 m.innerHTML='<div class="mk-mega-panel"><h4>تسوّق حسب القسم</h4><button class="row" data-deals><i class="fa-solid fa-bolt" style="color:var(--discount)"></i>عروض وخصومات</button><button class="row" data-c="all"><i class="fa-solid fa-store"></i>كل المنتجات<small class="cnt" data-k="all"></small></button>'+
  CATS.map(function(c){return '<button class="row" data-c="'+esc(c[0])+'"><i class="fa-solid '+c[2]+'"></i>'+esc(c[1])+'<small class="cnt" data-k="'+esc(c[0])+'"></small></button>'}).join('')+'</div>';
 document.body.appendChild(m);
 n.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-mega'))m.classList.add('on');else if(b.hasAttribute('data-deals'))go('deals');else pickCat(b.dataset.c)});
 m.addEventListener('click',function(e){var r=e.target.closest('.row');
  if(r){m.classList.remove('on');if(r.hasAttribute('data-deals'))go('deals');else pickCat(r.dataset.c)}else if(e.target===m)m.classList.remove('on')});
 function h(){document.documentElement.style.setProperty('--mk-head',(bar.offsetHeight-2)+'px')}
 h();addEventListener('resize',h);setTimeout(h,800);setTimeout(h,2500);
 requestAnimationFrame(function(){requestAnimationFrame(function(){h();document.documentElement.classList.add('mk-built')})});
}

function recentIds(){try{return JSON.parse(localStorage.getItem('mk_recent')||'[]')}catch(e){return []}}
function recentList(prods){var m={};prods.forEach(function(p){m[p.id]=p});return recentIds().map(function(i){return m[i]}).filter(Boolean).slice(0,12)}
function pushRecent(id){try{var r=recentIds().filter(function(x){return x!==id});r.unshift(id);localStorage.setItem('mk_recent',JSON.stringify(r.slice(0,12)))}catch(e){}}
/* ---------- أقسام الرئيسية ---------- */
function stars(p){var a=(p.rating&&p.rating.average)||0;return a>0?'<div class="st">'+'★'.repeat(Math.round(a))+'☆'.repeat(5-Math.round(a))+' <small>('+((p.rating&&p.rating.count)||0)+')</small></div>':''}
function card(p,deal){
 var d=pct(p),f=fin(p),out=(p.quantity||0)<=0,sold=Math.max(8,Math.min(92,100-Math.min(90,(p.quantity||0)*4)));
 return '<div class="mk-card" data-id="'+esc(p.id)+'">'+(d?'':'')+'<div class="im">'+(d?'<span class="mk-pct">-'+d+'%</span>':'')+(p.image?'<img loading="lazy" decoding="async" src="'+esc(p.image)+'" alt="">':'<i class="fas '+esc(p.icon||'fa-box')+'"></i>')+(out?'':'<button class="add" data-add="'+esc(p.id)+'" aria-label="أضف للسلة">+</button>')+'</div>'+
  '<div class="nm">'+esc(p.name)+'</div>'+stars(p)+'<div class="pr'+(d?' d':'')+'">'+f.toFixed(2)+' ج'+(d?'<s>'+(+p.price).toFixed(2)+'</s>':'')+'</div>'+
  (deal?'<div class="sold"><span style="width:'+sold+'%"></span></div><div class="sl">'+((p.quantity||0)<=5?'🔥 تبقّى '+p.quantity+' فقط':'تم بيع '+sold+'%')+'</div>':'')+'</div>';
}
function rail(title,list,opts){
 if(!list.length)return '';opts=opts||{};
 return '<section class="mk-sec"><div class="mk-sec-h"><h3>'+title+(opts.cd?'<span class="cd" id="mkCd">--:--:--</span>':'')+'</h3>'+(opts.clear?'<button data-clear-recent>مسح</button>':'')+(opts.all?'<button data-go="'+opts.all+'">عرض الكل ›</button>':'')+'</div><div class="mk-row">'+list.map(function(p){return card(p,opts.deal)}).join('')+'</div></section>';
}
var lastSig='';
function buildSections(){
 var prods=P();var sig=recentIds().join(',')+'#'+prods.map(function(p){return p.id+'|'+p.price+'|'+p.quantity+'|'+p.discountValue}).join(';');
 if(sig===lastSig)return;lastSig=sig;
 var inStock=prods.filter(function(p){return (p.quantity||0)>0});
 var deals=inStock.filter(function(p){return pct(p)>0}).sort(function(a,b){return pct(b)-pct(a)}).slice(0,14);
 var top=inStock.filter(function(p){return p.rating&&p.rating.average>=4&&p.rating.count>0}).sort(function(a,b){return b.rating.average-a.rating.average||b.rating.count-a.rating.count}).slice(0,14);
 var fresh=inStock.slice().sort(function(a,b){return (b.createdAt||0)-(a.createdAt||0)}).slice(0,14);
 var low=inStock.filter(function(p){return p.quantity<=5}).slice(0,14);
 var tiles='<section class="mk-sec mk-tiles-sec"><div class="mk-sec-h"><h3>🛍️ تسوّق حسب القسم</h3></div><div class="mk-tiles"><button class="mk-tile" data-go="deals"><i style="background:linear-gradient(135deg,#e11d48,#be123c)" class="fa-solid fa-bolt"></i>العروض</button>'+
  CATS.map(function(c){var g=c[3].split(',');return '<button class="mk-tile" data-c="'+esc(c[0])+'"><i style="background:linear-gradient(135deg,'+g[0]+','+g[1]+')" class="fa-solid '+c[2]+'"></i>'+esc(c[1])+'</button>'}).join('')+'</div></section>';
 var rec=recentList(prods);
 var html=rail('⭐ الأعلى تقييماً',top)+rail('🆕 وصل حديثاً',fresh)+rail('🔥 ينفد قريباً',low);
 function bind(bx){bx.addEventListener('click',function(e){
   var add=e.target.closest('[data-add]');if(add){e.stopPropagation();if(window.addToCart)window.addToCart(add.dataset.add);return}
   var g=e.target.closest('[data-go]');if(g){go(g.dataset.go);return}
   var t=e.target.closest('[data-c]');if(t){pickCat(t.dataset.c);return}
   var c=e.target.closest('.mk-card');if(c&&window.openProductDetail)window.openProductDetail(c.dataset.id)})}
 var tb=$('#mkTiles'),box=$('#mkSections');
 if(!tb){var ta=$('#flashSaleSection')||$('.mk-grid-h')||$('#storeFilterBar');if(!ta)return;tb=document.createElement('div');tb.id='mkTiles';ta.parentNode.insertBefore(tb,ta);bind(tb)}
 if(!box){var anchor=$('.mk-grid-h')||$('#storeFilterBar');if(!anchor)return;box=document.createElement('div');box.id='mkSections';anchor.parentNode.insertBefore(box,anchor);bind(box)}
 tb.innerHTML=tiles;box.innerHTML=html;
 document.querySelectorAll('.mk-mega .cnt').forEach(function(el){var k=el.dataset.k;el.textContent=(k==='all'?prods.length:prods.filter(function(p){return (p.category||'')===k}).length)+' منتج'});
}
function buildGridHead(){
 if($('.mk-grid-h'))return;var fb=$('#storeFilterBar');if(!fb)return;
 var h=document.createElement('div');h.className='mk-grid-h';
 h.innerHTML='<h2>كل المنتجات</h2><div class="mk-chips"><button data-q="rated">الأعلى تقييماً</button><button data-q="discount">أكبر الخصومات</button><button data-q="available">المتوفر الآن</button><button data-q="all">الكل</button></div>';
 fb.parentNode.insertBefore(h,fb);
 h.addEventListener('click',function(e){var b=e.target.closest('[data-q]');if(!b)return;
  var map={rated:'showBestRatedBtn',discount:'showDiscountsBtn',available:'showAvailableBtn',all:'clearDiscoveryBtn'},t=document.getElementById(map[b.dataset.q]);
  if(t)t.click();h.querySelectorAll('button').forEach(function(x){x.classList.toggle('active',x===b&&b.dataset.q!=='all')})});
}
/* عدّاد العروض: مربوط بوقت انتهاء الخصم السريع في قاعدة البيانات */
__tick(function(){var el=document.getElementById('mkCd');if(!el)return;var st=window.__store,end=st&&st.flashEnd;
 if(!end){el.style.display='none';return}el.style.display='';
 var d=Math.max(0,end-st.now()),z=function(v){return String(v).padStart(2,'0')},dy=Math.floor(d/864e5);
 el.textContent=(dy?dy+'ي ':'')+z(Math.floor(d%864e5/36e5))+':'+z(Math.floor(d%36e5/6e4))+':'+z(Math.floor(d%6e4/1e3))},1000);

/* ---------- صفحة المنتج ---------- */
function enhanceDetail(){
 var info=$('#productDetailModal .product-detail-info');if(!info)return;
 var name=($('#detailName')||{}).textContent,p=P().filter(function(x){return x.name===name})[0];
 var o=$('.mk-pd-extra',info);if(o)o.remove();var os=$('.mk-save',info);if(os)os.remove();if(!p)return;
 pushRecent(p.id);lastSig='';
 var pr=$('#detailPrice');if(pr&&pct(p)>0){var s=document.createElement('span');s.className='mk-save';s.textContent='وفّرت '+((+p.price)-fin(p)).toFixed(2)+' ج ('+pct(p)+'%)';pr.insertAdjacentElement('afterend',s)}
 var f=function(d){return d.toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long'})};
 var x=document.createElement('div');x.className='mk-pd-extra';
 x.innerHTML='<div><i class="fa-solid fa-truck-fast"></i><span>توصيل متوقع <b>'+f(new Date(Date.now()+2*864e5))+' – '+f(new Date(Date.now()+4*864e5))+'</b></span></div><div><i class="fa-solid fa-rotate-left"></i><span>استرجاع خلال 24 ساعة من الاستلام</span></div><div><i class="fa-solid fa-shield-halved"></i><span>فحص المنتج عند الاستلام</span></div><div><i class="fa-solid fa-hand-holding-dollar"></i><span>الدفع عند الاستلام متاح</span></div>';
 var st=$('#detailStock');if(st)st.insertAdjacentElement('afterend',x);
 var sh=document.createElement('button');sh.type='button';sh.className='mk-share';sh.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg> مشاركة المنتج';
 sh.onclick=function(){var u=location.origin+location.pathname+'?product='+encodeURIComponent(p.id),d={title:p.name,text:p.name+' - سوق بروفيشنال',url:u};
  if(navigator.share){navigator.share(d).catch(function(){})}else if(navigator.clipboard){navigator.clipboard.writeText(u).then(function(){toast('تم نسخ رابط المنتج')})}else{prompt('انسخي الرابط',u)}};
 x.appendChild(sh);
}
var pm=$('#productDetailModal');
if(pm)new MutationObserver(function(){if(pm.classList.contains('show'))setTimeout(enhanceDetail,60)}).observe(pm,{attributes:true,attributeFilter:['class']});

/* ---------- SEO ---------- */
function seo(){
 var o=location.origin+location.pathname,h=document.head;
 function add(tag,at){var k=Object.keys(at)[0],sel=tag+'['+k+'="'+at[k]+'"]';if(h.querySelector(sel))return;var e=document.createElement(tag);for(var a in at)e.setAttribute(a,at[a]);h.appendChild(e)}
 add('link',{rel:'canonical',href:o});add('link',{rel:'alternate',hreflang:'ar',href:o});add('link',{rel:'alternate',hreflang:'x-default',href:o});
 add('meta',{property:'og:url',content:o});add('meta',{property:'og:locale',content:'ar_EG'});add('meta',{property:'og:site_name',content:'سوق بروفيشنال'});
 var items=P().slice(0,30).map(function(p,i){return {'@type':'ListItem',position:i+1,url:o+'?product='+encodeURIComponent(p.id),name:p.name}});
 var j={'@context':'https://schema.org','@graph':[{'@type':'Organization',name:'سوق بروفيشنال Professional Souq',alternateName:['Professional Souq','بروفيشنال سوق'],url:o},
  {'@type':'WebSite',name:'سوق بروفيشنال',alternateName:['Professional Souq','بروفيشنال سوق'],url:o,inLanguage:'ar',potentialAction:{'@type':'SearchAction',target:o+'?q={search_term_string}','query-input':'required name=search_term_string'}},
  {'@type':'ItemList',itemListElement:items}]};
 var s=document.getElementById('mkJsonLd');if(!s){s=document.createElement('script');s.type='application/ld+json';s.id='mkJsonLd';h.appendChild(s)}s.textContent=JSON.stringify(j);
}
var q=new URLSearchParams(location.search).get('q');
if(q)setTimeout(function(){var i=$('#searchInput');if(i){i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}))}},2500);

function tick(){try{
 buildHeader();buildGridHead();
 var cs=$('#categorySelect');document.body.classList.toggle('mk-filtered',!!(cs&&cs.value&&cs.value!=='all'));
 document.body.classList.toggle('mk-has-promo',!!($('#promoCarousel')&&$('#promoCarousel').classList.contains('active')));
 if(P().length){buildSections();seo()}
}catch(e){console.warn('[mk]',e)}}
tick();__tick(tick,2000);
})();
