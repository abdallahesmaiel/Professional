/* يضيف زر واتساب فوق زر إتمام الطلب الثابت في آخر السلة (يستخدم نفس معالج الطلب عبر واتساب الموجود) */
(function(){
  'use strict';
  var busy=false;
  function ensure(){
    try{
      var bar=document.querySelector('.cx-wrap>.cx-bar'),w=window.__waNum;
      var old=bar&&bar.querySelector('.sx-wa');
      if(!bar||!w){if(old&&!w)old.remove();return;}
      if(old)return;
      var b=document.createElement('button');b.type='button';b.className='sx-wa';b.setAttribute('data-sum-wa','');
      b.innerHTML='<span aria-hidden="true">💬</span> اطلب عبر واتساب';
      bar.insertBefore(b,bar.firstChild);
    }catch(e){}
  }
  new MutationObserver(function(){if(busy)return;busy=true;requestAnimationFrame(function(){ensure();busy=false;});}).observe(document.body,{childList:true,subtree:true});
  setTimeout(ensure,800);
})();
