(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
/* ---------- dynamic meta + breadcrumb for the open product ---------- */
var base={title:document.title,desc:(document.querySelector('meta[name=description]')||{}).content||'',img:(document.querySelector('meta[property="og:image"]')||{}).content||''};
function meta(sel,attr,key,val){var e=$(sel);if(!e){e=document.createElement('meta');e.setAttribute(attr,key);document.head.appendChild(e)}e.setAttribute('content',val)}
function canon(href){var l=$('link[rel=canonical]');if(!l){l=document.createElement('link');l.rel='canonical';document.head.appendChild(l)}l.href=href}
function setMeta(p){
  var o=location.origin+location.pathname,url=p?o+'?product='+encodeURIComponent(p.id):o;
  var title=p?p.name+' | سوق بروفيشنال':base.title;
  var d=p?((p.description||p.name)+'').replace(/\s+/g,' ').slice(0,155):base.desc;
  var img=p&&p.image?p.image:base.img;
  document.title=title;
  meta('meta[name=description]','name','description',d);
  meta('meta[property="og:title"]','property','og:title',title);
  meta('meta[property="og:description"]','property','og:description',d);
  meta('meta[property="og:url"]','property','og:url',url);
  if(img)meta('meta[property="og:image"]','property','og:image',img);
  meta('meta[property="og:type"]','property','og:type',p?'product':'website');
  meta('meta[name="twitter:card"]','name','twitter:card',img?'summary_large_image':'summary');
  canon(url);
  var bc=document.getElementById('mkBreadcrumb');
  if(!p){bc&&bc.remove();return}
  if(!bc){bc=document.createElement('script');bc.type='application/ld+json';bc.id='mkBreadcrumb';document.head.appendChild(bc)}
  bc.textContent=JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
    {'@type':'ListItem',position:1,name:'الرئيسية',item:o},
    {'@type':'ListItem',position:2,name:p.category||'المنتجات',item:o+'?cat='+encodeURIComponent(p.category||'')},
    {'@type':'ListItem',position:3,name:p.name,item:url}]});
}
function syncMeta(){
  var m=$('#productDetailModal'),b=$('#detailAddToCart');
  var P=(window.__store&&window.__store.products)||[];
  if(m&&m.classList.contains('show')&&b&&b.dataset.productId){var p=P.filter(function(x){return x.id===b.dataset.productId})[0];if(p){setMeta(p);return}}
  setMeta(null);
}
var t;function later(){clearTimeout(t);t=setTimeout(syncMeta,150)}
var m=$('#productDetailModal');if(m)new MutationObserver(later).observe(m,{attributes:true,attributeFilter:['class']});
var n=$('#detailName');if(n)new MutationObserver(later).observe(n,{childList:true,characterData:true,subtree:true});

/* ---------- accessibility patcher ---------- */
var ICONS=[['xmark','إغلاق'],['times','إغلاق'],['trash','حذف'],['plus','زيادة'],['minus','إنقاص'],['heart','المفضلة'],['share','مشاركة'],['magnifying','بحث'],['search','بحث'],['bars','القائمة'],['microphone','بحث صوتي'],['camera','مسح الباركود'],['barcode','مسح الباركود'],['arrow-up','لأعلى'],['chevron-left','السابق'],['chevron-right','التالي'],['bell','الإشعارات'],['cart','السلة'],['user','الحساب']];
function nameOf(e){return (e.getAttribute('aria-label')||e.getAttribute('title')||e.textContent||'').trim()}
function patch(root){
  root=root||document;
  root.querySelectorAll('.wishlist-btn,[data-wishlist-id]').forEach(function(b){
    var on=b.classList.contains('active');
    b.setAttribute('aria-label',on?'إزالة من المفضلة':'إضافة إلى المفضلة');b.setAttribute('aria-pressed',on?'true':'false')});
  root.querySelectorAll('button,a[href],[role=button]').forEach(function(e){
    if(nameOf(e)||e.querySelector('img[alt]:not([alt=""])'))return;
    var i=e.querySelector('i[class*="fa-"]'),c=i?i.className:'';
    for(var k=0;k<ICONS.length;k++){if(c.indexOf('fa-'+ICONS[k][0])>=0){e.setAttribute('aria-label',ICONS[k][1]);return}}
  });
  root.querySelectorAll('[onclick]:not(button):not(a):not(input):not([role])').forEach(function(e){
    e.setAttribute('role','button');if(!e.hasAttribute('tabindex'))e.tabIndex=0;
    if(!e.getAttribute('aria-label')){var l=(e.querySelector('img[alt]')||{}).alt||(e.closest('.product-card')&&(e.closest('.product-card').querySelector('.product-name,h3')||{}).textContent)||'';if(l)e.setAttribute('aria-label','عرض '+l.trim())}
  });
  var nc=document.getElementById('notificationCenter');if(nc&&!nc.getAttribute('role')){nc.setAttribute('role','status');nc.setAttribute('aria-live','polite')}
  var nv=document.getElementById('bottomNav');if(nv&&!nv.getAttribute('aria-label'))nv.setAttribute('aria-label','التنقل الرئيسي');
  var mn=$('main.main-content');if(mn&&!mn.id)mn.id='mainContent';
}
document.addEventListener('keydown',function(e){
  if((e.key==='Enter'||e.key===' ')&&e.target&&e.target.matches&&e.target.matches('[role=button][tabindex]:not(button):not(a)')){e.preventDefault();e.target.click()}
});
var busy=false;
new MutationObserver(function(){if(busy)return;busy=true;setTimeout(function(){requestAnimationFrame(function(){try{patch()}catch(e){}busy=false})},500)}).observe(document.body,{childList:true,subtree:true});
patch();
})();
