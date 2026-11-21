(function(){
  'use strict';
  var $=function(q,r){return (r||document).querySelector(q)};
  var $$=function(q,r){return Array.prototype.slice.call((r||document).querySelectorAll(q))};
  var safe=function(f){try{f()}catch(e){console.warn('[app-layer]',e)}};

  /* ---- 1) إخفاء البار السفلي أثناء ظهور الكيبورد ---- */
  safe(function(){
    var vv=window.visualViewport; if(!vv) return;
    var base=window.innerHeight;
    var chk=function(){
      var typing=/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'');
      document.body.classList.toggle('kb-open', typing && (base-vv.height)>140);
    };
    vv.addEventListener('resize',chk);
    window.addEventListener('orientationchange',function(){setTimeout(function(){base=window.innerHeight},400)});
    document.addEventListener('focusout',function(){setTimeout(chk,120)});
  });

  /* ---- 2) اهتزاز خفيف + نبضة للعدّاد ---- */
  safe(function(){
    document.addEventListener('click',function(e){
      if(e.target.closest&&e.target.closest('.nav-item,.menu-item')&&navigator.vibrate) navigator.vibrate(8);
    },true);
    ['bottomCartBadge','cartCountTop','wishlistBadge','menuCartBadge'].forEach(function(id){
      var el=document.getElementById(id); if(!el) return;
      var last=el.textContent;
      new MutationObserver(function(){
        if(el.textContent!==last){last=el.textContent;el.classList.remove('app-pop');void el.offsetWidth;el.classList.add('app-pop')}
      }).observe(el,{childList:true,characterData:true,subtree:true});
    });
  });

  /* ---- 3) القائمة الجانبية: سحب للإغلاق + زر Esc ---- */
  safe(function(){
    var menu=$('#sideMenu'); if(!menu) return;
    var x0=null,y0=null;
    menu.addEventListener('touchstart',function(e){var t=e.touches[0];x0=t.clientX;y0=t.clientY},{passive:true});
    menu.addEventListener('touchend',function(e){
      if(x0===null) return; var t=e.changedTouches[0];
      var dx=t.clientX-x0, dy=Math.abs(t.clientY-y0);
      if(dx>60&&dy<50){var b=$('#closeMenu'); if(b) b.click();}
      x0=null;
    },{passive:true});
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&menu.classList.contains('open')){var b=$('#closeMenu'); if(b) b.click();}
    });
  });

  /* ---- 4) شريط الاتصال بالإنترنت ---- */
  safe(function(){
    var bar=document.createElement('div'); bar.id='appNetBar'; document.body.appendChild(bar);
    var t;
    function show(msg,back){bar.textContent=msg;bar.classList.toggle('back',!!back);bar.classList.add('on');clearTimeout(t);if(back)t=setTimeout(function(){bar.classList.remove('on')},2200)}
    window.addEventListener('offline',function(){show('⚠️ لا يوجد اتصال بالإنترنت — بعض الميزات قد لا تعمل',false)});
    window.addEventListener('online',function(){show('✅ عاد الاتصال بالإنترنت',true)});
    if(!navigator.onLine) show('⚠️ لا يوجد اتصال بالإنترنت — بعض الميزات قد لا تعمل',false);
  });

  /* ---- 5) اختيار المحافظة: نافذة سفلية مع بحث وسعر الشحن ---- */
  safe(function(){
    var sel=$('#custZone'); if(!sel) return;
    var wrap=sel.closest('.zone-select-wrap')||sel.parentNode;
    var norm=function(t){return String(t||'').replace(/[\u064B-\u065F\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').trim().toLowerCase()};
    function build(){
      var groups=[];
      $$('optgroup',sel).forEach(function(g){
        groups.push({label:g.label,items:$$('option',g).filter(function(o){return o.value}).map(function(o){
          var parts=o.textContent.split(' — ');return {v:o.value,name:o.dataset.zoneName||parts[0],fee:parts[1]||''};
        })});
      });
      return groups;
    }
    function open(){
      if(document.querySelector('.zone-sheet-ov')) return;
      var ov=document.createElement('div'); ov.className='zone-sheet-ov';
      ov.innerHTML='<div class="zone-sheet" role="dialog" aria-label="اختر المحافظة"><h4>🚚 اختر منطقة التوصيل</h4><input type="search" placeholder="ابحث عن محافظتك…" autocomplete="off"><div class="zone-list"></div></div>';
      document.body.appendChild(ov);
      var vv=window.visualViewport;
      function sync(){
        if(!vv) return;
        ov.style.height=vv.height+'px'; ov.style.top=vv.offsetTop+'px'; ov.style.bottom='auto';
        ov.style.setProperty('--vvh',vv.height+'px');
        ov.classList.toggle('kb',(window.innerHeight-vv.height)>120);
      }
      if(vv){vv.addEventListener('resize',sync);vv.addEventListener('scroll',sync);sync();}
      var list=$('.zone-list',ov), inp=$('input',ov), groups=build();
      inp.setAttribute('enterkeyhint','search');
      inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();inp.blur();}});
      function render(q){
        var n=norm(q),html='',any=false;
        groups.forEach(function(g){
          var its=g.items.filter(function(i){return !n||norm(i.name).indexOf(n)>-1});
          if(!its.length) return; any=true;
          html+='<div class="zone-grp">'+g.label+'</div>';
          its.forEach(function(i){
            html+='<button type="button" class="zone-row'+(sel.value===i.v?' sel':'')+'" data-v="'+i.v+'"><span>'+i.name+'</span><small>'+i.fee+'</small></button>';
          });
        });
        list.innerHTML=any?html:'<div class="zone-empty">لا توجد نتائج مطابقة</div>';
      }
      render('');
      requestAnimationFrame(function(){ov.classList.add('on')});
      function close(){
        if(vv){vv.removeEventListener('resize',sync);vv.removeEventListener('scroll',sync);}
        inp.blur();ov.classList.remove('on');setTimeout(function(){ov.remove()},220)}
      inp.addEventListener('input',function(){render(inp.value)});
      ov.addEventListener('click',function(e){
        if(e.target===ov) return close();
        var b=e.target.closest('.zone-row'); if(!b) return;
        sel.value=b.getAttribute('data-v');
        sel.dispatchEvent(new Event('input',{bubbles:true}));
        sel.dispatchEvent(new Event('change',{bubbles:true}));
        close();
      });
      document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',esc)}});
    }
    wrap.style.cursor='pointer';
    wrap.addEventListener('click',function(e){e.preventDefault();open()});
    var lb=document.querySelector('label[for="custZone"]'); if(lb) lb.addEventListener('click',function(e){e.preventDefault();open()});
  });

  /* ---- 6) تحقق رقم الهاتف المصري أثناء الكتابة ---- */
  safe(function(){
    var ph=$('#custPhone'); if(!ph) return;
    ph.setAttribute('inputmode','numeric'); ph.setAttribute('maxlength','11'); ph.setAttribute('pattern','01[0125][0-9]{8}');
    var hint=document.createElement('div'); hint.className='phone-hint'; ph.parentNode.appendChild(hint);
    var ar='٠١٢٣٤٥٦٧٨٩';
    function check(){
      var v=ph.value.replace(/[٠-٩]/g,function(d){return ar.indexOf(d)}).replace(/\D/g,'').slice(0,11);
      if(v!==ph.value) ph.value=v;
      ph.classList.remove('ok','bad'); hint.className='phone-hint'; hint.textContent='';
      if(!v) return;
      if(/^01[0125]\d{8}$/.test(v)){ph.classList.add('ok');hint.classList.add('ok');hint.textContent='✓ رقم صحيح'}
      else if(v.length>=11||(v.length>=2&&!/^01[0125]/.test(v.slice(0,3)))){ph.classList.add('bad');hint.classList.add('bad');hint.textContent='اكتب رقم مصري صحيح: 11 رقماً يبدأ بـ 010 / 011 / 012 / 015'}
      else hint.textContent='';
    }
    ph.addEventListener('input',check); ph.addEventListener('blur',check);
    setTimeout(check,600);
  });

  /* ---- 7) خطوات الشراء تعكس تقدّم العميل فعلاً ---- */
  safe(function(){
    var form=$('#checkoutForm'); if(!form) return;
    var steps=$$('.buy-progress .step',form); if(steps.length<3) return;
    function upd(){
      var name=($('#custName')||{}).value||'', addr=($('#custAddress')||{}).value||'', ph=($('#custPhone')||{}).value||'', zone=($('#custZone')||{}).value||'';
      var s1=name.trim().length>1&&zone&&addr.trim().length>4&&/^01[0125]\d{8}$/.test(ph);
      var pay=$('.payment-method-option.selected',form);
      var s2=s1&&!!pay;
      steps[0].className='step '+(s1?'done':'active');
      steps[1].className='step '+(s2?'done':(s1?'active':''));
      steps[2].className='step '+(s2?'active':'');
    }
    ['input','change','click'].forEach(function(ev){form.addEventListener(ev,function(){setTimeout(upd,30)})});
    new MutationObserver(upd).observe($('#checkoutModalOverlay')||form,{attributes:true,attributeFilter:['class']});
    upd();
  });

  /* ---- 8) منع إرسال الطلب مرتين بالخطأ ---- */
  safe(function(){
    var last=0;
    document.addEventListener('click',function(e){
      var b=e.target.closest&&e.target.closest('#confirmOrder'); if(!b) return;
      var now=Date.now();
      if(b.disabled||now-last<2500){e.stopImmediatePropagation();e.preventDefault();return}
      last=now;
    },true);
  });

  /* ---- 9) شبكة أمان للأخطاء غير المتوقعة (لا تخفي الخطأ، تسجله فقط) ---- */
  window.addEventListener('unhandledrejection',function(e){console.warn('[unhandled]',e.reason)});
})();
