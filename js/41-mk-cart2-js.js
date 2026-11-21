(function(){
'use strict';
var C=function(){return window.__cart};
var $=function(s,r){return (r||document).querySelector(s)};
var fmt=function(n){return (Math.round((n||0)*100)/100).toLocaleString('ar-EG')+' ج'};
var esc=function(t){var d=document.createElement('div');d.textContent=t==null?'':String(t);return d.innerHTML};
var LS={get:function(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var note=function(t,k){try{NotificationSystem[k||'info'](t)}catch(e){}};
var trap=null;

/* ---------- overlay helper (focus trap + Esc + back button) ---------- */
function layerPush(entry){
  try{history.pushState(Object.assign({},history.state,{mkOv:1}),'');window.__mkLayers.push(entry);entry.pushed=true}catch(e){}
}
function layerClose(entry,thenFn){
  var i=window.__mkLayers.indexOf(entry);
  if(i>=0&&entry.pushed){
    window.__mkLayers.splice(i,1);entry.pushed=false;
    var done=false,go=function(){if(done)return;done=true;window.removeEventListener('popstate',go);thenFn&&thenFn()};
    window.__mkSkip=true;
    if(thenFn){window.addEventListener('popstate',go);setTimeout(go,300)}
    try{history.back()}catch(e){window.__mkSkip=false;go()}
  }else thenFn&&thenFn();
}
function openOv(html,cls){
  if(trap)destroy();
  var ov=document.createElement('div');ov.className='mk-ov '+(cls||'');ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
  ov.innerHTML=html;document.body.appendChild(ov);
  var prev=document.activeElement;
  requestAnimationFrame(function(){ov.classList.add('show');var f=ov.querySelector('button,input,select');f&&f.focus()});
  ov.addEventListener('click',function(e){if(e.target===ov)closeOv()});
  var key=function(e){
    if(e.key==='Escape'){closeOv();return}
    if(e.key!=='Tab')return;
    var f=[].slice.call(ov.querySelectorAll('button,input,select,textarea,a[href]')).filter(function(x){return !x.disabled&&x.offsetParent!==null});
    if(!f.length)return;var a=f[0],b=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();b.focus()}else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a.focus()}
  };
  document.addEventListener('keydown',key);
  trap={ov:ov,key:key,prev:prev,pop:function(){destroy()}};
  layerPush(trap);
  return ov;
}
function destroy(){
  if(!trap)return;var t=trap;trap=null;
  document.removeEventListener('keydown',t.key);t.ov.classList.remove('show');
  setTimeout(function(){t.ov.remove()},200);
  try{t.prev&&t.prev.focus&&t.prev.focus()}catch(e){}
}
function closeOv(thenFn){
  if(!trap)return;var t=trap;destroy();layerClose(t,typeof thenFn==='function'?thenFn:null);
}

/* ---------- save for later ---------- */
var LATER='mk_saved_later';
function later(){return LS.get(LATER,[])}
function saveLater(idx){
  var it=C().detach(idx);if(!it)return;
  var l=later().filter(function(x){return !(x.productId===it.productId&&String(x.note||'')===String(it.note||''))});
  l.unshift(it);LS.set(LATER,l.slice(0,30));note('تم حفظ "'+it.name+'" لوقت لاحق','success');renderLater();
}
function moveBack(i){
  var l=later();var it=l[i];if(!it)return;
  if(C().restore(it)){l.splice(i,1);LS.set(LATER,l);renderLater();note('رجع للسلة','success')}
}
function dropLater(i){var l=later();l.splice(i,1);LS.set(LATER,l);renderLater()}
function renderLater(){
  var host=$('#cartPageContent');if(!host)return;
  var old=$('#mkLater');if(old)old.remove();
  var l=later();if(!l.length)return;
  var box=document.createElement('div');box.id='mkLater';box.className='mk-later';
  box.innerHTML='<h4>🔖 محفوظ لوقت لاحق ('+l.length+')</h4>'+l.map(function(it,i){
    return '<div class="mk-it"><img src="'+esc(it.image||'')+'" alt="" loading="lazy"><div style="flex:1"><div class="n">'+esc(it.name)+'</div><div class="p">'+fmt(it.finalPrice||it.price)+'</div></div><button class="mk-lnk" data-lb="'+i+'">انقل للسلة</button><button class="mk-lnk" data-ld="'+i+'" aria-label="حذف">✕</button></div>'}).join('');
  host.appendChild(box);
}

/* ---------- mini cart drawer ---------- */
function miniHtml(){
  var items=C().items();
  var sub=C().subtotal(),fs=C().freeShip();
  var bar='';
  if(fs.enabled&&fs.threshold>0){var left=fs.threshold-sub;bar=left>0?'<div style="font-size:12px;margin-bottom:6px">🚚 باقي '+fmt(left)+' للشحن المجاني</div><div style="height:6px;background:#eee;border-radius:4px"><div style="height:6px;width:'+Math.min(100,sub/fs.threshold*100)+'%;background:#c9972b;border-radius:4px"></div></div>':'<div style="font-size:12px;color:#2e7d32;font-weight:700">🎉 الشحن مجاني</div>'}
  var body=items.length?items.map(function(it,i){return '<div class="mk-it"><img src="'+esc(it.image||'')+'" alt="" loading="lazy"><div style="flex:1;min-width:0"><div class="n">'+esc(it.name)+(it.note?' <small>('+esc(it.note)+')</small>':'')+'</div><div class="p">'+fmt(it.finalPrice||it.price)+'</div><div class="mk-q"><button data-q="'+i+'|-1" aria-label="إنقاص">−</button><b>'+it.quantity+'</b><button data-q="'+i+'|1" aria-label="زيادة">+</button><button class="mk-lnk" data-sl="'+i+'">لوقت لاحق</button><button class="mk-lnk" data-rm="'+i+'">حذف</button></div></div></div>'}).join(''):'<p style="text-align:center;color:#888;padding:40px 0">السلة فاضية</p>';
  return '<div class="mk-drawer"><div class="mk-dh"><span>🛒 سلتي ('+items.length+')</span><button data-x aria-label="إغلاق">✕</button></div><div class="mk-db">'+body+'</div>'+(items.length?'<div class="mk-df">'+bar+'<div style="display:flex;justify-content:space-between;margin:8px 0;font-weight:800"><span>المجموع</span><span>'+fmt(sub)+'</span></div><button class="mk-btn" data-co>إتمام الطلب</button><button class="mk-btn o" data-cart>عرض السلة الكاملة</button></div>':'')+'</div>';
}
function openMini(){
  var ov=openOv(miniHtml());
  ov.addEventListener('click',function(e){
    var t=e.target.closest('button');if(!t)return;
    if(t.hasAttribute('data-x'))return closeOv();
    if(t.dataset.q){var a=t.dataset.q.split('|');C().qty(+a[0],+a[1]);return refreshMini()}
    if(t.dataset.rm!=null&&t.hasAttribute('data-rm')){C().remove(+t.dataset.rm);return refreshMini()}
    if(t.hasAttribute('data-sl')){saveLater(+t.dataset.sl);return refreshMini()}
    if(t.hasAttribute('data-co'))return closeOv(function(){C().checkout()});
    if(t.hasAttribute('data-cart'))return closeOv(function(){window.switchPage&&window.switchPage('cart')});
  });
}
function refreshMini(){if(!trap)return;var tmp=document.createElement('div');tmp.innerHTML=miniHtml();var nd=tmp.firstChild;var od=trap.ov.querySelector('.mk-drawer');if(od&&nd){nd.style.transform='none';od.replaceWith(nd)}}
document.addEventListener('click',function(e){
  var w=e.target.closest('#cartWidgetTop');
  if(w&&window.innerWidth>=0&&!e.__mk){e.preventDefault();e.stopImmediatePropagation();openMini()}
},true);

/* ---------- address book ---------- */
var AB='mk_addr_book',DR='mk_checkout_draft';
function book(){return LS.get(AB,[])}
function saveAddr(){
  var f=function(i){var e=document.getElementById(i);return e?e.value.trim():''};
  var a={name:f('custName'),address:f('custAddress'),phone:f('custPhone'),zone:f('custZone')};
  if(!a.name||!a.address||!a.phone)return;
  var b=book().filter(function(x){return !(x.address===a.address&&x.phone===a.phone)});b.unshift(a);LS.set(AB,b.slice(0,5));
}
function fillAddr(a){
  ['custName:name','custAddress:address','custPhone:phone','custZone:zone'].forEach(function(p){var q=p.split(':'),el=document.getElementById(q[0]);if(el&&a[q[1]]!=null){el.value=a[q[1]];el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}});
}
function enhanceCheckout(){
  var n=document.getElementById('custName');if(!n)return;
  var ov=document.getElementById('checkoutModalOverlay');if(!ov||!ov.classList.contains('show'))return;
  var old=document.getElementById('mkAddr');if(old)old.remove();
  var ob=document.getElementById('mkWaNote');if(ob)ob.remove();
  var b=book(),d=LS.get(DR,null);
  var box=document.createElement('div');box.id='mkAddr';
  if(b.length)box.innerHTML='<div style="font-size:12px;font-weight:700;margin-top:6px">📒 عناوينك المحفوظة</div><div class="mk-chips">'+b.map(function(a,i){return '<button type="button" class="mk-chip" data-ad="'+i+'">'+esc(a.name)+' — '+esc((a.address||'').slice(0,22))+'</button>'}).join('')+'</div>';
  var grp=n.closest('.form-group');grp&&grp.parentNode.insertBefore(box,grp);
  box.addEventListener('click',function(e){var t=e.target.closest('[data-ad]');if(t)fillAddr(book()[+t.dataset.ad])});
  if(window.__mkWaPending&&Date.now()-window.__mkWaPending<30*60*1000){var nb=document.createElement('div');nb.id='mkWaNote';nb.className='mk-wanote';nb.innerHTML='💬 بعد إرسال الطلب هيتسجل عند المتجر ويفتح واتساب بالتفاصيل تلقائيًا';box.parentNode.insertBefore(nb,box)}
  var ad=document.getElementById('custAddress');
  if(d&&!n.value&&ad&&!ad.value&&(d.name||d.address||d.phone)&&Date.now()-(d.t||0)<7*864e5){fillAddr(d);note('استرجعنا بيانات الطلب اللي كنت بتكتبها','info')}
}
(function(){
  var save=function(){var f=function(i){var e=document.getElementById(i);return e?e.value:''};var ov=document.getElementById('checkoutModalOverlay');if(!ov||!ov.classList.contains('show'))return;LS.set(DR,{name:f('custName'),address:f('custAddress'),phone:f('custPhone'),zone:f('custZone'),t:Date.now()})};
  document.addEventListener('input',function(e){if(e.target&&/^cust(Name|Address|Phone|Zone)$/.test(e.target.id))save()});
  var ov=document.getElementById('checkoutModalOverlay');
  if(ov)new MutationObserver(function(){setTimeout(enhanceCheckout,0)}).observe(ov,{attributes:true,attributeFilter:['class']});
})();
window.__mkOrderDone=function(){saveAddr();try{localStorage.removeItem(DR)}catch(e){}};
var _od=window.__orderDone;
window.__orderDone=function(o,opts){
  var re=opts&&opts.reopen;
  if(!re){try{window.__mkOrderDone()}catch(e){}}
  try{_od&&_od.apply(this,arguments)}catch(e){}
  if(!re){try{waAfterOrder(o)}catch(e){console.warn('[wa]',e)}}
};
(function(){var ov=document.getElementById('checkoutModalOverlay');if(ov)new MutationObserver(function(){if(!ov.classList.contains('show'))window.__mkWaClosedAt=Date.now()}).observe(ov,{attributes:true,attributeFilter:['class']})})();

/* ---------- tracking ---------- */
var STEPS=[['pending','تم استلام الطلب'],['accepted','تم قبول الطلب'],['processing','جاري التجهيز'],['shipped','تم الشحن'],['delivering','في الطريق إليك'],['delivered','تم التوصيل']];
function order(id){return C().orders().filter(function(o){return o.orderId===id})[0]}
function openTrack(id,remote){
  var o=order(id)||{orderId:id,status:'pending'};
  var st=o.status||'pending';
  var bad=st==='rejected'||st==='cancelled'||st==='returned';
  var idx=STEPS.findIndex(function(x){return x[0]===st});
  var tl=bad?'<li class="cur">'+({rejected:'تم رفض الطلب',cancelled:'تم إلغاء الطلب',returned:'تم تسجيل مرتجع'})[st]+'</li>':STEPS.map(function(x,i){return '<li class="'+(i<idx?'done':i===idx?'done cur':'')+'">'+x[1]+'</li>'}).join('');
  var items=(o.items||[]).map(function(i){return '<div style="font-size:12px;padding:3px 0">'+esc(i.name)+' × '+i.quantity+'</div>'}).join('');
  var ov=openOv('<div class="mk-modal"><div style="display:flex;justify-content:space-between;align-items:center"><b>📦 تتبع الطلب #'+esc(String(id).slice(-8))+'</b><button class="mk-x" data-x aria-label="إغلاق">✕</button></div><ul class="mk-tl">'+tl+'</ul>'+(o.createdAt?'<div style="font-size:12px;color:#888">تاريخ الطلب: '+new Date(o.createdAt).toLocaleString('ar-EG')+'</div>':'')+items+'<button class="mk-btn o" data-copy>🔗 نسخ رابط التتبع</button></div>','mid');
  ov.addEventListener('click',function(e){var t=e.target.closest('button');if(!t)return;if(t.hasAttribute('data-x'))closeOv();if(t.hasAttribute('data-copy')){var u=location.origin+location.pathname+'?order='+encodeURIComponent(id);(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(function(){note('تم نسخ الرابط','success')},function(){note(u,'info')})}});
  if(!remote&&!order(id)){}
}
/* ---------- invoice ---------- */
function invoice(id){
  var o=order(id);if(!o)return note('تعذر إيجاد الطلب','error');
  var rows=(o.items||[]).map(function(i){return '<tr><td>'+esc(i.name)+'</td><td>'+i.quantity+'</td><td>'+fmt(i.price||i.finalPrice)+'</td><td>'+fmt((i.price||i.finalPrice||0)*i.quantity)+'</td></tr>'}).join('');
  var w=window.open('','_blank');if(!w)return note('اسمح بالنوافذ المنبثقة لطباعة الفاتورة','warning');
  w.document.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>فاتورة #'+esc(String(id).slice(-8))+'</title><style>body{font-family:Tahoma,Arial,sans-serif;padding:24px;color:#222}table{width:100%;border-collapse:collapse;margin:14px 0}td,th{border:1px solid #ccc;padding:8px;text-align:right;font-size:13px}th{background:#f4ede0}h1{color:#8a5a1f;margin:0}</style></head><body><h1>سوق بروفيشنال | Professional Souq</h1><p>فاتورة رقم #'+esc(String(id).slice(-8))+'<br>التاريخ: '+(o.createdAt?new Date(o.createdAt).toLocaleDateString('ar-EG'):'')+'<br>العميل: '+esc(o.recipientName||'')+'</p><table><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>'+rows+'</table><p>المجموع: '+fmt(o.subtotal)+'<br>الشحن: '+fmt(o.deliveryFee)+(o.codFee?'<br>رسوم الدفع عند الاستلام: '+fmt(o.codFee):'')+(o.coupon?'<br>خصم الكوبون: -'+fmt(o.coupon.discount):'')+'<br><b>الإجمالي: '+fmt(o.total)+'</b></p><script>onload=function(){setTimeout(function(){print()},300)}<\/script></body></html>');
  w.document.close();
}

/* ---------- WhatsApp order: يُسجَّل الطلب للأدمن أولًا ثم يُفتح واتساب بتفاصيله ---------- */
var num=function(n){return (Math.round((+n||0)*100)/100).toString()};
var PAYLBL={cod:'الدفع عند الاستلام',vodafone:'فودافون كاش',instapay:'إنستا باي',bank:'تحويل بنكي',visa:'بطاقة'};
function payLabel(k){
  var e=document.querySelector('#paymentMethodsGrid [data-payment="'+k+'"]');
  var n=e&&e.querySelector('.method-name');
  var t=n&&n.textContent.replace(/\s+/g,' ').trim();
  return t||PAYLBL[k]||k||'';
}
function waOrderText(o){
  var L=['🛒 *طلب جديد — سوق بروفيشنال*','رقم الطلب: #'+String(o.orderId||'').slice(-8),'━━━━━━━━━━'];
  (o.items||[]).forEach(function(i,k){
    var pr=+i.price||0,q=+i.quantity||0;
    L.push((k+1)+') *'+i.name+'*');
    L.push('   الكمية: '+q+' × '+num(pr)+' ج = '+num(pr*q)+' ج');
    if(i.customNote)L.push('   📝 '+i.customNote);
  });
  L.push('━━━━━━━━━━');
  L.push('المجموع: '+num(o.subtotal)+' ج');
  if(o.coupon&&o.coupon.discount>0)L.push('🎟️ خصم الكوبون ('+o.coupon.code+'): -'+num(o.coupon.discount)+' ج');
  else if(o.coupon&&o.coupon.code)L.push('🎟️ كوبون: '+o.coupon.code);
  L.push('🚚 الشحن'+(o.shippingZoneName?' ('+o.shippingZoneName+')':'')+': '+(+o.deliveryFee===0?'مجاني':num(o.deliveryFee)+' ج'));
  if(+o.codFee>0)L.push('رسوم الدفع عند الاستلام: '+num(o.codFee)+' ج');
  L.push('*الإجمالي: '+num(o.total)+' ج*');
  L.push('💳 طريقة الدفع: '+payLabel(o.paymentMethod));
  if(o.requiresDeposit)L.push('⚠️ إثبات الجدية المطلوب: '+num(o.depositAmount)+' ج');
  L.push('━━━━━━━━━━');
  L.push('👤 '+(o.recipientName||''));
  L.push('📞 '+(o.phone||''));
  L.push('📍 '+(o.shippingZoneName?o.shippingZoneName+' — ':'')+(o.address||''));
  return L.join('\n');
}
function waUrl(text){var n=window.__waNum;return n?'https://wa.me/'+n+'?text='+encodeURIComponent(text):''}
window.__mkWaHasCart=function(){return !!(C()&&C().items&&C().items().length)};
function startWaOrder(){
  var C0=C();
  if(!window.__waNum)return note('رقم واتساب غير متاح','warning');
  if(!C0.items().length)return note('السلة فاضية','info');
  window.__mkWaPending=Date.now();
  C0.checkout();
  window.__mkWaPending=Date.now();
  note('اختاري المحافظة وطريقة الدفع وأكملي البيانات، وبعد إرسال الطلب هيتسجل عند المتجر ويفتح واتساب بالتفاصيل','info');
}
window.__mkWaStart=startWaOrder;
function waAfterOrder(o){
  var t=window.__mkWaPending;window.__mkWaPending=0;
  if(!t||Date.now()-t>30*60*1000)return;
  var ov=document.getElementById('checkoutModalOverlay');
  if(ov&&!ov.classList.contains('show')&&Date.now()-(window.__mkWaClosedAt||0)>15000)return;
  var u=waUrl(waOrderText(o));if(!u)return;
  var w=null;try{w=window.open(u,'_blank');if(w)w.opener=null}catch(e){}
  if(!w){
    var x=openOv('<div class="mk-modal" style="text-align:center"><div style="font-size:42px">✅</div><b>تم تسجيل طلبك عند المتجر</b><p style="font-size:13px;color:#777;margin:8px 0 12px">اضغطي الزر لإرسال تفاصيل الطلب على واتساب</p><a class="mk-btn wa" style="text-decoration:none" href="'+u+'" target="_blank" rel="noopener" data-wa-send><span aria-hidden="true">💬</span> إرسال على واتساب</a><button class="mk-btn o" data-x>لاحقًا</button></div>','mid');
    x.addEventListener('click',function(e){if(e.target.closest('[data-x],[data-wa-send]'))setTimeout(closeOv,50)});
  }
}

/* ---------- wiring ---------- */
document.addEventListener('click',function(e){
  var w=e.target.closest('[data-sum-co],[data-sum-wa]');
  if(w){if(w.hasAttribute('data-sum-co')){window.__mkWaPending=0;var ob=document.getElementById('openCheckoutBtn');ob?ob.click():C().checkout()}else startWaOrder();return}
  if(e.target.closest('#openCheckoutBtn,#mkDockBtn,[data-sum-co],[data-co]'))window.__mkWaPending=0;
  var t=e.target.closest('[data-track-order],[data-invoice-order],[data-lb],[data-ld],[data-save-later]');if(!t)return;
  if(t.dataset.trackOrder)openTrack(t.dataset.trackOrder);
  else if(t.dataset.invoiceOrder)invoice(t.dataset.invoiceOrder);
  else if(t.dataset.lb!=null&&t.hasAttribute('data-lb'))moveBack(+t.dataset.lb);
  else if(t.dataset.ld!=null&&t.hasAttribute('data-ld'))dropLater(+t.dataset.ld);
  else if(t.hasAttribute('data-save-later'))saveLater(+t.dataset.saveLater);
});
function decorate(){
  var host=$('#cartPageContent');if(!host)return;
  host.querySelectorAll('.cx-card').forEach(function(c){
    if(c.querySelector('.mk-acts'))return;
    var fav=c.querySelector('.cx-fav'),lat=c.querySelector('[data-save-later]');
    if(!fav&&!lat)return;
    var row=document.createElement('div');row.className='mk-acts';
    if(fav)row.appendChild(fav);
    c.appendChild(row);
  });
  var sum=host.querySelector('.cx-sum');
  if(sum&&!sum.querySelector('.mk-sumcta')){
    var cta=document.createElement('div');cta.className='mk-sumcta';
    var fs=C().freeShip&&C().freeShip(),sub=C().subtotal();
    var bar='';
    if(fs&&fs.enabled&&fs.threshold>0){var left=fs.threshold-sub;bar=left>0?'<div class="mk-fsb"><div>🚚 باقي <b>'+fmt(left)+'</b> للشحن المجاني</div><i><u style="width:'+Math.min(100,sub/fs.threshold*100)+'%"></u></i></div>':'<div class="mk-fsb ok">🎉 طلبك مؤهل للشحن المجاني</div>'}
    cta.innerHTML=bar+'<button type="button" class="mk-btn" data-sum-co>إتمام الطلب</button>'+(window.__waNum?'<button type="button" class="mk-btn wa" data-sum-wa><span aria-hidden="true">💬</span> اطلب عبر واتساب</button>':'');
    sum.appendChild(cta);
  }
  host.querySelectorAll('.cx-card').forEach(function(c,i){
    if(c.querySelector('[data-save-later]'))return;
    var q=c.querySelector('[data-qty-idx]');var idx=q?q.getAttribute('data-qty-idx'):i;
    var b=document.createElement('button');b.type='button';b.className='mk-lnk';b.setAttribute('data-save-later',idx);b.textContent='🔖 احفظ لوقت لاحق';
    var row=c.querySelector('.mk-acts');(row||c).appendChild(b);
  });
  if(!$('#mkLater'))renderLater();
}
var busy=false;
var mo=new MutationObserver(function(){
  if(busy)return;busy=true;
  requestAnimationFrame(function(){try{decorate()}catch(e){}busy=false});
});
mo.observe(document.body,{childList:true,subtree:true});
/* deep link ?order=ID */
try{var q=new URLSearchParams(location.search).get('order');if(q){setTimeout(function(){window.switchPage&&window.switchPage('cart');setTimeout(function(){openTrack(q)},600)},1200)}}catch(e){}
})();
