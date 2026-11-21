(function(){
  'use strict';
  var $=function(q,r){return (r||document).querySelector(q)};
  var $$=function(q,r){return Array.prototype.slice.call((r||document).querySelectorAll(q))};
  var safe=function(f){try{f()}catch(e){console.warn('[v3]',e)}};
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};

  /* ---------- 1) Bottom nav: always mirrors the visible page ---------- */
  var MAP={dealsPage:'deals',homePage:'home',wishlistPage:'wishlist',cartPage:'cart',returnsPage:'returns'};
  function syncNav(){
    var pg=document.querySelector('.page.active-page'); var key=pg?MAP[pg.id]:null;
    $$('.bottom-nav .nav-item').forEach(function(b){
      b.classList.toggle('active',b.getAttribute('data-page')===key);
      if(document.activeElement===b) b.blur();
    });
  }
  safe(function(){
    var t; var q=function(){clearTimeout(t);t=setTimeout(syncNav,0)};
    $$('.page').forEach(function(p){new MutationObserver(q).observe(p,{attributes:true,attributeFilter:['class']})});
    window.addEventListener('popstate',function(){setTimeout(syncNav,60)});
    window.addEventListener('pageshow',syncNav);
    document.addEventListener('visibilitychange',syncNav);
    document.addEventListener('pointerup',function(e){var b=e.target.closest&&e.target.closest('.nav-item');if(b)setTimeout(function(){b.blur()},0)},true);
    syncNav();
    var nav=$('#bottomNav'); var setH=function(){if(nav)document.documentElement.style.setProperty('--nav-h',nav.offsetHeight+'px')};
    setH();window.addEventListener('resize',setH);setTimeout(setH,500);
  });

  /* ---------- 2) Heartbeat on cart / wishlist ---------- */
  safe(function(){
    function num(id){var el=document.getElementById(id);return el?(parseInt(el.textContent,10)||0):0}
    var last={cart:-1,wish:-1};
    function bump(els){els.forEach(function(el){if(!el)return;el.classList.remove('cx-bump');void el.offsetWidth;el.classList.add('cx-bump');setTimeout(function(){el.classList.remove('cx-bump')},700)});if(navigator.vibrate)navigator.vibrate([12,40,12])}
    function upd(){
      var c=num('cartCountTop'), w=num('wishlistBadge');
      var wb=$('#wishlistBtn'), cw=$('#cartWidgetTop'), nw=$('.nav-item[data-page="wishlist"]'), nc=$('.nav-item[data-page="cart"]');
      var hasW=w>0&&!(($('#wishlistBadge')||{}).classList||{contains:function(){return false}}).contains('hidden');
      [wb,nw].forEach(function(e){if(e)e.classList.toggle('has-items',w>0)});
      [cw,nc].forEach(function(e){if(e)e.classList.toggle('has-items',c>0)});
      var cb=$('#cartCountTop'); if(cb) cb.classList.toggle('cx-live',c>0);
      var wi=wb&&wb.querySelector('i'); if(wi){wi.classList.toggle('fa-solid',w>0);wi.classList.toggle('fa-regular',w===0)}
      var ni=nw&&nw.querySelector('i'); /* bottom heart is already solid */
      if(last.cart>=0&&c>last.cart) bump([cw,nc]);
      if(last.wish>=0&&w>last.wish) bump([wb,nw]);
      last.cart=c;last.wish=w;
    }
    ['cartCountTop','bottomCartBadge','wishlistBadge'].forEach(function(id){var el=document.getElementById(id);if(el)new MutationObserver(upd).observe(el,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']})});
    setTimeout(upd,300);setTimeout(upd,1500);
  });

  /* ---------- 3) Checkout wizard ---------- */
  safe(function(){
    var ov=$('#checkoutModalOverlay'), form=$('#checkoutForm'); if(!ov||!form) return;
    var step=1;
    var fb=function(msg){var f=$('#checkoutFeedback');if(!f)return;if(!msg){f.style.display='none';f.textContent='';return}
      f.style.display='block';f.style.background='var(--danger-light)';f.style.color='var(--danger)';f.textContent=msg};
    function validate1(){
      var n=($('#custName').value||'').trim(), z=($('#custZone').value||''), a=($('#custAddress').value||'').trim(), p=($('#custPhone').value||'').trim();
      if(n.length<2) return ['⚠️ اكتب اسم المستلم','#custName'];
      if(!z) return ['⚠️ اختر منطقة التوصيل','#custZone'];
      if(a.length<5) return ['⚠️ اكتب العنوان بالتفصيل','#custAddress'];
      if(!/^01[0-9]{9}$/.test(p)) return ['⚠️ رقم الهاتف غير صحيح (11 رقم يبدأ بـ 01)','#custPhone'];
      return null;
    }
    function fmt(n){return (Number(n)||0).toFixed(2)+' ج'}
    function review(){
      var z=$('#custZone'), zt=z&&z.selectedIndex>=0?z.options[z.selectedIndex].text:'';
      var pm=$('.payment-method-option.selected .method-name');
      $('#rvShip').innerHTML='<p>👤 '+esc($('#custName').value)+'<br>📍 '+esc(zt)+' — '+esc($('#custAddress').value)+'<br>📞 <span dir="ltr">'+esc($('#custPhone').value)+'</span></p>';
      $('#rvPay').innerHTML='<p>💳 '+esc(pm?pm.textContent:'الدفع عند الاستلام')+'</p>';
      var cart=(window.__getCart&&window.__getCart())||[];
      $('#rvItems').innerHTML=cart.map(function(i){var pr=(i.finalPrice||i.price||0)*(i.quantity||0);return '<div class="ck-it"><span>'+esc(i.name)+' × '+(i.quantity||0)+(i.note?'<br><small style="color:var(--accent-dark)">✍️ '+esc(i.note)+'</small>':'')+'</span><b>'+fmt(pr)+'</b></div>'}).join('');
    }
    function mirrorTotal(){var g=$('#grandTotalAmount'),m=$('#ckMiniTotal');if(g&&m)m.textContent=g.textContent}
    function go(n){
      step=n; form.setAttribute('data-step',n);
      $$('.ck-pane',form).forEach(function(p){p.classList.toggle('on',p.getAttribute('data-pane')==n)});
      $$('.ck-steps .s',form).forEach(function(s,i){var k=i+1;s.className='s'+(k<n?' ok':(k===n?' on':''));s.querySelector('i').textContent=k<n?'✓':k});
      $$('.ck-steps .l',form).forEach(function(l,i){l.className='l'+(i+1<n?' ok':'')});
      var t=$('#ckTitle'); if(t) t.textContent=['','بيانات التوصيل','طريقة الدفع','مراجعة وإرسال الطلب'][n];
      if(window.updateTotalSummary) window.updateTotalSummary();
      if(n===3) review();
      mirrorTotal(); fb('');
      var b=$('.ck-body',form); if(b) b.scrollTop=0;
    }
    $('#ckNext').addEventListener('click',function(){
      if(step===1){var e=validate1();if(e){fb(e[0]);var el=$(e[1]);if(el&&el.tagName!=='SELECT')el.focus();if(navigator.vibrate)navigator.vibrate(30);return}}
      if(step<3) go(step+1);
    });
    $('#ckBack').addEventListener('click',function(){ if(step>1) go(step-1); else $('#cancelCheckout').click(); });
    $('#ckClose').addEventListener('click',function(){$('#cancelCheckout').click()});
    $$('[data-goto]',form).forEach(function(b){b.addEventListener('click',function(){go(parseInt(b.getAttribute('data-goto'),10))})});
    var g=$('#grandTotalAmount'); if(g) new MutationObserver(mirrorTotal).observe(g,{childList:true,characterData:true,subtree:true});
    window.__ckBack=function(){ if(ov.classList.contains('show')&&step>1){go(step-1);return true} return false };
    window.__ckReset=function(){ go(1) };
    go(1);
  });
})();
