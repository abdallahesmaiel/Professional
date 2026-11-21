(function(){
'use strict';
var $=function(q){return document.querySelector(q)};
function toast(m){window.__mkToast&&window.__mkToast(m)}

/* ---- زر رجوع في الصفحات الداخلية ---- */
function homeActive(){var h=$('#homePage');return !h||h.classList.contains('active-page')}
function backBtn(){
 var tl=$('.top-left');if(!tl||$('#mkBack'))return;
 var b=document.createElement('button');b.id='mkBack';b.type='button';b.setAttribute('aria-label','رجوع');
 b.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
 b.addEventListener('click',function(){var st=history.state;if(st&&st.base===false)history.back();else if(window.switchPage)window.switchPage('home')});
 tl.insertBefore(b,tl.firstChild);
}
function syncBack(){var b=$('#mkBack');if(b)b.style.display=homeActive()?'none':'flex'}

/* ---- تذكر مكان التمرير لكل صفحة ---- */
var scrollMap={},fromPop=0,raf=0;
function activeId(){var a=document.querySelector('.page.active-page');return a?a.id:null}
addEventListener('scroll',function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;var id=activeId();if(id&&id!=='homePage')scrollMap[id]=scrollY})},{passive:true});
addEventListener('popstate',function(){fromPop=Date.now()});
new MutationObserver(function(ms){
 ms.forEach(function(m){var el=m.target;
  if(el.classList&&el.classList.contains('page')&&el.classList.contains('active-page')&&!(m.oldValue||'').includes('active-page')){
   syncBack();
   if(Date.now()-fromPop<600&&el.id!=='homePage'&&scrollMap[el.id]){var y=scrollMap[el.id];setTimeout(function(){scrollTo(0,y)},140);setTimeout(function(){scrollTo(0,y)},420)}
  }})
}).observe(document.getElementById('homePage').parentNode,{subtree:true,attributes:true,attributeFilter:['class'],attributeOldValue:true});

/* ---- زر العودة للأعلى ---- */
var fb;
function fab(){} /* تم الاكتفاء بزر #backToTop */

/* ---- بحث صوتي ---- */
function voice(){
 var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 var w=$('.top-bar .search-wrapper');if(!SR||!w||$('#mkMic'))return;
 var inp=$('#searchInput');if(!inp)return;
 var m=document.createElement('button');m.id='mkMic';m.type='button';m.setAttribute('aria-label','بحث صوتي');
 m.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>';
 var cam=w.querySelector('.barcode-search-camera-btn');if(cam)w.insertBefore(m,cam);else w.appendChild(m);
 var rec=null,on=false;
 m.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();
  if(on&&rec){rec.stop();return}
  rec=new SR();rec.lang='ar-EG';rec.interimResults=false;rec.maxAlternatives=1;
  rec.onstart=function(){on=true;m.classList.add('rec');toast('🎤 اتكلمي دلوقتي...')};
  rec.onend=function(){on=false;m.classList.remove('rec')};
  rec.onerror=function(){on=false;m.classList.remove('rec');toast('مقدرتش أسمعك، جرّبي تاني')};
  rec.onresult=function(ev){var t=ev.results[0][0].transcript;inp.value=t;inp.focus();inp.dispatchEvent(new Event('input',{bubbles:true}));
   inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))};
  try{rec.start()}catch(x){}
 });
}

/* ---- رابط مباشر للمنتج ---- */
var deepDone=false;
function deep(){
 if(deepDone)return;var id=new URLSearchParams(location.search).get('product');if(!id){deepDone=true;return}
 var st=window.__store;if(!st||!st.products.length||!window.openProductDetail)return;
 deepDone=true;
 if(st.products.some(function(p){return String(p.id)===id}))setTimeout(function(){window.openProductDetail(id)},400);
 else toast('المنتج ده مش متاح حالياً');
}

/* ---- حالة الاتصال ---- */
function net(){
 var n=$('#mkNet');if(!n){n=document.createElement('div');n.id='mkNet';document.body.appendChild(n)}
 if(!navigator.onLine){n.textContent='⚠️ مفيش اتصال بالإنترنت — بتشوفي آخر بيانات محفوظة';n.className='off on'}
 else if(n.classList.contains('off')){n.textContent='✅ رجع الاتصال';n.className='ok on';setTimeout(function(){n.className=''},2200)}
}


/* ---- تثبيت التطبيق ---- */
var dp=null;
addEventListener('beforeinstallprompt',function(e){e.preventDefault();dp=e;try{if(localStorage.getItem('mk_inst')==='1')return}catch(x){}
 setTimeout(function(){if(!dp||$('#mkInstall'))return;var c=document.createElement('div');c.id='mkInstall';
  c.innerHTML='<span>📲 ثبّتي المتجر كتطبيق على موبايلك</span><button data-i>تثبيت</button><button data-x aria-label="إغلاق">✕</button>';
  document.body.appendChild(c);
  c.querySelector('[data-i]').onclick=function(){dp.prompt();dp.userChoice.finally(function(){c.remove();dp=null})};
  c.querySelector('[data-x]').onclick=function(){c.remove();try{localStorage.setItem('mk_inst','1')}catch(x){}};
 },6000)});

/* ---- لمسة اهتزاز عند الإضافة للسلة ---- */
document.addEventListener('click',function(e){if(e.target.closest('.add-btn,[data-add],.cx-qty button')&&navigator.vibrate)navigator.vibrate(12)},true);

/* ---- هيكل تحميل (Skeleton) ---- */
function skel(){
 var has=window.__store&&window.__store.products.length;var s=$('#mkSkel');
 if(has){if(s)s.remove();return}
 if(s)return;var a=$('#flashSaleSection')||$('#storeFilterBar');if(!a)return;
 s=document.createElement('div');s.id='mkSkel';
 s.innerHTML='<div class="sk-row"></div><div class="sk-grid">'+'<i></i>'.repeat(6)+'</div>';
 a.parentNode.insertBefore(s,a);
}

function tick(){try{voice();deep();skel()}catch(e){}}
tick();__tick(tick,1000);
})();
