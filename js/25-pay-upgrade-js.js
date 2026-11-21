(function(){
  'use strict';
  var $=function(q,r){return (r||document).querySelector(q)};
  var $$=function(q,r){return Array.prototype.slice.call((r||document).querySelectorAll(q))};
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
  var money=function(n){return (Number(n)||0).toFixed(2).replace(/\.00$/,'')};
  var P=function(){return window.__pay||{wallets:{},methods:{},codFee:function(){return 0}}};
  var WALLET_KEYS=['vodafone','etisalat','orange','we'];
  var toastT;
  function toast(m){var t=$('.pm-toast');if(!t){t=document.createElement('div');t.className='pm-toast';document.body.appendChild(t)}
    t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},1800)}
  function copy(text,btn){
    function ok(){toast('تم النسخ ✓');if(btn){var o=btn.innerHTML;btn.classList.add('done');btn.innerHTML='<i class="fa-solid fa-check"></i> تم';setTimeout(function(){btn.classList.remove('done');btn.innerHTML=o},1400)}}
    function fb(){try{var a=document.createElement('textarea');a.value=text;a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();ok()}catch(e){toast('انسخ الرقم يدوياً')}}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(ok,fb)}else fb();
  }
  function totalNum(){var g=$('#grandTotalAmount');var n=g?parseFloat(g.textContent.replace(/[^\d.]/g,'')):0;return isFinite(n)?n:0}
  function selKey(){var o=$('#paymentMethodsGrid .payment-method-option.selected');return o?o.getAttribute('data-payment'):'cod'}
  function waLink(msg){var n=window.__waNum||'';return n?('https://wa.me/'+n+'?text='+encodeURIComponent(msg)):''}

  function payBody(k,amt,orderRef){
    var p=P(), m=p.methods[k]||{name:k}, num=(p.wallets||{})[k]||'';
    var kind=k==='bank'?'الحساب البنكي':(k==='visa'?'رقم البطاقة':(k==='instapay'?'رقم / عنوان إنستا باي':'رقم المحفظة'));
    var h='<ul class="pm-steps">';
    if(WALLET_KEYS.indexOf(k)>-1) h+='<li>افتح تطبيق <b>'+esc(m.name)+'</b> واختر «تحويل أموال».</li>';
    else if(k==='instapay') h+='<li>افتح تطبيق <b>إنستا باي</b> أو تطبيق بنكك واختر «تحويل».</li>';
    else if(k==='bank') h+='<li>افتح تطبيق بنكك واختر «تحويل إلى حساب».</li>';
    else h+='<li>حوّل المبلغ على بيانات البطاقة أدناه.</li>';
    h+='<li>حوّل مبلغ <b>'+money(amt)+' ج</b> على البيانات التالية.</li><li>صوّر شاشة التحويل وأرسلها لنا على واتساب'+(orderRef?'':' بعد إرسال الطلب')+'.</li></ul>';
    if(num){
      h+='<div class="pm-copy"><div><small>'+kind+'</small><b>'+esc(num)+'</b></div><button type="button" data-copy="'+esc(num)+'"><i class="fa-solid fa-copy"></i> نسخ</button></div>';
    } else h+='<p class="pm-note">سنرسل لك بيانات الدفع على واتساب بعد تأكيد الطلب.</p>';
    h+='<div class="pm-copy"><div><small>المبلغ المطلوب</small><b class="amt">'+money(amt)+' ج</b></div><button type="button" data-copy="'+money(amt)+'"><i class="fa-solid fa-copy"></i> نسخ</button></div>';
    return h;
  }

  function renderGuide(){
    var g=$('#pmGuide'); if(!g) return;
    var k=selKey(), amt=totalNum(), p=P();
    $$('#paymentMethodsGrid .payment-method-option').forEach(function(o){o.setAttribute('aria-checked',o.classList.contains('selected')?'true':'false')});
    var due=$('#payDueAmt'); if(due) due.textContent=money(amt)+' ج';
    var cf=Number(p.codFee())||0;
    $$('#paymentMethodsGrid .payment-method-option:not([data-payment="cod"]) .pm-tag').forEach(function(t){
      var key=t.parentNode.getAttribute('data-payment');
      t.textContent=cf>0?('وفّر '+money(cf)+' ج'):(key==='bank'?'':'فوري'); if(cf>0)t.classList.add('ok');
    });
    if(k==='cod'){
      var dep=$('#depositNotice'), depOn=dep&&dep.style.display!=='none';
      g.className='pm-guide cod';
      g.innerHTML='<h5>💵 الدفع عند الاستلام</h5><p>جهّز المبلغ نقداً وادفعه للمندوب بعد فحص الطلب.'+(cf>0?' تُضاف رسوم خدمة <b>'+money(cf)+' ج</b> — وفّرها بالدفع الإلكتروني.':'')+'</p>'
        +(depOn?'<div class="pm-nudge">💡 طلبك خارج أدفو يتطلب تحويل <b>إثبات جدية بقيمة الشحن</b> مقدماً (يُخصم من فاتورتك). لو دفعت <b>كامل المبلغ بمحفظة</b> مش هتحتاج إيداع منفصل.</div>':'');
      return;
    }
    var m=p.methods[k]||{name:k};
    g.className='pm-guide';
    g.innerHTML='<div class="pm-head">'+logoMark(k)+'<h5>طريقة الدفع عبر '+esc(m.name)+'</h5></div>'+payBody(k,amt,false)+'<p class="pm-note">⚠️ يتم تأكيد طلبك فور وصول الإيصال.</p>';
  }

  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('[data-copy]'); if(b){e.preventDefault();copy(b.getAttribute('data-copy'),b)}
  });
  var grid=$('#paymentMethodsGrid');
  if(grid){
    grid.addEventListener('click',function(){setTimeout(renderGuide,0)});
    grid.addEventListener('keydown',function(e){
      var o=e.target.closest&&e.target.closest('.payment-method-option'); if(!o) return;
      if(e.key==='Enter'||e.key===' '){e.preventDefault();o.click()}
    });
    var mo=new MutationObserver(function(){requestAnimationFrame(renderGuide)});
    ['#grandTotalAmount','#walletNumber','#couponDiscountAmount'].forEach(function(q){var el=$(q);if(el)mo.observe(el,{childList:true,characterData:true,subtree:true})});
    var dn=$('#depositNotice'); if(dn) mo.observe(dn,{attributes:true,attributeFilter:['style']});
    var ov=$('#checkoutModalOverlay'); if(ov) mo.observe(ov,{attributes:true,attributeFilter:['class']});
    renderGuide();
  }
  // افتح خانة الكوبون تلقائياً عندما يُطبَّق كود
  var cs=$('#couponStatus'), pc=$('#pmCoupon');
  if(cs&&pc) new MutationObserver(function(){if(cs.textContent.trim())pc.open=true}).observe(cs,{childList:true,characterData:true,subtree:true});

  // صفحة المراجعة: تذكير بما يجب فعله بعد الإرسال
  var rv=$('#rvPay');
  if(rv) new MutationObserver(function(){
    if(rv.querySelector('.rv-pay-note')) return;
    var k=selKey(), amt=totalNum(), d=document.createElement('div'); d.className='rv-pay-note';
    var dn=$('#depositNotice'), dp=$('#dnPay'), dr=$('#dnRest'); var depOn=k==='cod'&&dn&&dn.style.display!=='none'&&dp;
    d.innerHTML=depOn?'🛡️ حوّل الآن <b>'+esc(dp.textContent)+'</b> إثبات جدية (يُخصم من الفاتورة)، والباقي <b>'+esc(dr?dr.textContent:'')+'</b> عند الاستلام.<br>⚠️ المبلغ المحوَّل لا يُسترد إذا رفضت الاستلام.':(k==='cod'?'💵 ستدفع <b>'+money(amt)+' ج</b> نقداً عند الاستلام.':'📲 بعد الإرسال ستظهر لك بيانات الدفع — حوّل <b>'+money(amt)+' ج</b> وأرسل الإيصال على واتساب.');
    rv.appendChild(d);
  }).observe(rv,{childList:true});

  /* ---- شعارات شركات الدفع: ضع الملفات الرسمية في مجلد pay-logos باسم المفتاح (vodafone.png ...) ---- */
  var LOGOS={}, ICONS={vodafone:'fa-mobile-screen-button',etisalat:'fa-mobile-screen-button',orange:'fa-mobile-screen-button',we:'fa-wallet',instapay:'fa-bolt',bank:'fa-building-columns',visa:'fa-credit-card'};
  var COLORS={vodafone:'#E60000',etisalat:'#0054A6',orange:'#FF6600',we:'#7B3FAF',instapay:'#00BFA5',bank:'#2E7D32',visa:'#1A1F71'};
  var EXTS=['png','svg','webp','jpg'];
  function tryLogo(k,cb){
    if(k in LOGOS){cb(LOGOS[k]);return}
    var i=0;(function next(){
      if(i>=EXTS.length){LOGOS[k]=null;cb(null);return}
      var u='pay-logos/'+k+'.'+EXTS[i++], im=new Image();
      im.onload=function(){LOGOS[k]=u;cb(u)}; im.onerror=next; im.src=u;
    })();
  }
  function logoMark(k){
    var u=LOGOS?LOGOS[k]:null, c=(COLORS&&COLORS[k])||'#4A2C17', ic=(ICONS&&ICONS[k])||'fa-wallet';
    return '<span class="pm-ico sm'+(u?' has-logo':'')+'" style="--c:'+c+'">'+(u?'<img class="pm-logo" src="'+esc(u)+'" alt="">':'<i class="fa-solid '+ic+'"></i>')+'</span>';
  }
  $$('#paymentMethodsGrid .payment-method-option').forEach(function(o){
    var k=o.getAttribute('data-payment'); if(k==='cod') return;
    tryLogo(k,function(u){
      if(!u) return;
      var ico=o.querySelector('.pm-ico'); if(!ico) return;
      ico.classList.add('has-logo'); ico.innerHTML='<img class="pm-logo" src="'+esc(u)+'" alt="">';
      renderGuide();
    });
  });
  // آخر طريقة استخدمها العميل
  function lastKey(){try{return localStorage.getItem('pm_last')||''}catch(e){return ''}}
  function markLast(){
    var k=lastKey();
    $$('#paymentMethodsGrid .payment-method-option').forEach(function(o){
      var t=o.querySelector('.pm-last'); if(t) t.remove();
      if(k&&o.getAttribute('data-payment')===k&&k!=='cod'){var tg=document.createElement('span');tg.className='pm-tag last pm-last';tg.textContent='آخر استخدام';o.insertBefore(tg,o.querySelector('.pm-radio'))}
    });
  }
  markLast();

  /* ---- شاشة نجاح الطلب (قابلة للإغلاق بزر الرجوع وبـ ×) ---- */
  function findOrder(id){
    try{var a=JSON.parse(localStorage.getItem('professional_orders_v4')||'[]');for(var i=0;i<a.length;i++)if(String(a[i].orderId)===String(id))return a[i]}catch(e){}
    return null;
  }
  window.__orderDone=function(o,opts){
    opts=opts||{};
    var old=$('.od-ov'); if(old) old.remove();
    var k=o.paymentMethod||'cod', p=P(), m=p.methods[k]||{name:'الدفع عند الاستلام'};
    var ref=String(o.orderId||'').slice(-8), total=Number(o.total)||0;
    if(!opts.reopen&&k!=='cod'){try{localStorage.setItem('pm_last',k)}catch(e){}}
    var body='', wa='', needPay=false, payAmt=0, payName=m.name;
    if(k!=='cod'){
      needPay=true; payAmt=total;
      body='<div class="od-pay"><div class="pm-head">'+logoMark(k)+'<h5 style="font-weight:900;font-size:14.5px;color:var(--primary-dark)">الخطوة التالية: ادفع عبر '+esc(m.name)+'</h5></div>'+payBody(k,total,true)+'@@AFTER@@</div>';
    } else if(o.requiresDeposit){
      needPay=true; payAmt=Number(o.depositAmount)||0; payName='إثبات جدية';
      var w=p.wallets||{}, rows='';
      ['vodafone','etisalat','orange','we','instapay','bank'].forEach(function(x){ if(w[x]) rows+='<div class="pm-copy">'+logoMark(x)+'<div><small>'+esc((p.methods[x]||{}).name||x)+'</small><b>'+esc(w[x])+'</b></div><button type="button" data-copy="'+esc(w[x])+'"><i class="fa-solid fa-copy"></i> نسخ</button></div>'; });
      body='<div class="od-pay"><h5 style="margin:0 0 8px;font-weight:900;font-size:14.5px;color:var(--primary-dark)">🛡️ إثبات الجدية مطلوب'+(Number(o.deliveryFee)===0?' (الشحن مجاني)':'')+'</h5><p class="pm-note" style="margin:0 0 10px">حوّل <b>'+money(payAmt)+' ج</b> (قيمة الشحن) على أحد الأرقام، وأرسل لقطة الشاشة على واتساب. سيُخصم المبلغ من فاتورتك والباقي <b>'+money(Math.max(0,total-payAmt))+' ج</b> عند الاستلام.<br>⚠️ لا يُسترد المبلغ إذا رفضت استلام الطلب.</p>'
        +'<div class="pm-copy"><div><small>المبلغ المطلوب الآن</small><b class="amt">'+money(payAmt)+' ج</b></div><button type="button" data-copy="'+money(payAmt)+'"><i class="fa-solid fa-copy"></i> نسخ</button></div>'+rows+'@@AFTER@@</div>';
    } else {
      body='<div class="od-pay"><h5 style="margin:0 0 6px;font-weight:900;font-size:14.5px;color:var(--primary-dark)">💵 الدفع عند الاستلام</h5><p class="pm-note" style="margin:0">سنتواصل معك لتأكيد الطلب. جهّز <b>'+money(total)+' ج</b> نقداً وافحص الطلب قبل الدفع.</p></div>';
    }
    var after='';
    if(needPay){
      after=window.__waNum
        ? '<div class="od-after"><label for="odFrom">رقم المحفظة / الحساب الذي حوّلت منه (اختياري — يسرّع التأكيد)</label><input id="odFrom" type="tel" inputmode="numeric" placeholder="01xxxxxxxxx" autocomplete="off">'
          +'<a class="od-wa paid" id="odPaid" href="#" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-whatsapp"></i> تم التحويل — أرسل الإيصال على واتساب</a></div>'
        : '<p class="pm-note">بعد التحويل أرسل لقطة الشاشة على واتساب المتجر مع رقم الطلب <b>#'+esc(ref)+'</b>.</p>';
    }
    body=body.replace('@@AFTER@@',after);
    var el=document.createElement('div'); el.className='od-ov';
    el.innerHTML='<div class="od-sheet" role="dialog" aria-modal="true"><div class="od-top"><b>طلب #'+esc(ref)+'</b><button type="button" class="od-x" data-od="close" aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button></div>'
      +'<div class="od-check"><i class="fa-solid fa-check"></i></div><h3>'+(opts.reopen?'بيانات الدفع لطلبك':'تم إرسال طلبك بنجاح 🎉')+'</h3><div class="od-sub">'+(opts.reopen?'أكمل التحويل وأرسل الإيصال ليتم تأكيد الطلب':'شكراً لثقتك — نجهّز طلبك الآن')+'</div>'
      +'<div class="od-meta"><div><small>رقم الطلب</small><b>#'+esc(ref)+'</b></div><div><small>الإجمالي</small><b>'+money(total)+' ج</b></div><div><small>الدفع</small><b style="font-size:13px">'+esc(m.name)+'</b></div></div>'
      +body
      +'<div class="od-btns" style="margin-top:14px"><button type="button" data-od="home">متابعة التسوق</button><button type="button" class="main" data-od="close"><i class="fa-solid fa-truck-fast"></i> عرض طلباتي</button></div></div>';
    document.body.appendChild(el);
    requestAnimationFrame(function(){el.classList.add('on')});

    var gone=false;
    function remove(){ if(gone) return; gone=true; document.removeEventListener('keydown',onKey); el.classList.remove('on'); setTimeout(function(){el.remove()},260) }
    el.__close=remove;
    function onKey(e){ if(e.key==='Escape') closeBtn(null) }
    document.addEventListener('keydown',onKey);
    function closeBtn(go){
      if(gone) return;
      var st=history.state;
      if(!(st&&st.layer==='orderDone')||!window.__layer){ remove(); if(go&&window.switchPage) window.switchPage(go); return }
      var fired=false;
      function fin(){ if(fired) return; fired=true; remove(); if(go&&window.switchPage) setTimeout(function(){window.switchPage(go)},30) }
      window.addEventListener('popstate',fin,{once:true}); setTimeout(fin,500);
      history.back();
    }
    if(window.__layer) window.__layer.push('orderDone');

    var from=$('#odFrom',el), paid=$('#odPaid',el);
    function upd(){
      if(!paid) return;
      var f=(from&&from.value||'').replace(/\D/g,'').slice(0,11);
      paid.href=waLink('مرحباً، تم تحويل '+money(payAmt)+' ج ('+payName+') لطلب #'+ref+(o.recipientName?' باسم '+o.recipientName:'')+(f?' من الرقم '+f:'')+'. مرفق لقطة شاشة التحويل.');
    }
    if(from) from.addEventListener('input',upd); upd();
    el.addEventListener('click',function(e){
      if(e.target===el) return closeBtn(null);
      var b=e.target.closest('[data-od]'); if(!b) return;
      closeBtn(b.getAttribute('data-od')==='home'?'home':null);
    });
  };
  // فتح بيانات الدفع من كارت الطلب
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('[data-pay-order]'); if(!b) return;
    var o=findOrder(b.getAttribute('data-pay-order')); if(o) window.__orderDone(o,{reopen:true});
  });
})();
