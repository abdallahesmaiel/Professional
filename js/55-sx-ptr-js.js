/* سحب لأسفل لتحديث الموقع وتحميل آخر التحديثات */
(function(){
  'use strict';
  var el=document.createElement('div');el.id='sxPtr';el.innerHTML='<i class="fa-solid fa-arrows-rotate"></i>';document.body.appendChild(el);
  var y0=0,x0=0,pull=0,on=false,busy=false,MAX=110,GO=75;
  function scrollable(n){while(n&&n!==document.body&&n!==document.documentElement){
      var cs=getComputedStyle(n),oy=cs.overflowY;
      if((oy==='auto'||oy==='scroll')&&n.scrollHeight>n.clientHeight&&n.scrollTop>0)return true;n=n.parentElement;}return false;}
  function blocked(){return document.body.style.overflow==='hidden'||document.documentElement.style.overflow==='hidden';}
  addEventListener('touchstart',function(e){
    if(busy||e.touches.length!==1||window.scrollY>0||blocked()||scrollable(e.target)){on=false;return;}
    y0=e.touches[0].clientY;x0=e.touches[0].clientX;pull=0;on=true;},{passive:true});
  addEventListener('touchmove',function(e){
    if(!on||busy)return;
    var dy=e.touches[0].clientY-y0,dx=e.touches[0].clientX-x0;
    if(dy<=0||Math.abs(dx)>Math.abs(dy)||window.scrollY>0){if(dy<=0)on=false;return;}
    pull=Math.min(dy*0.5,MAX);
    el.style.opacity=Math.min(pull/GO,1);
    el.style.transform='translate(-50%,'+(pull-50)+'px) rotate('+(pull*4)+'deg)';},{passive:true});
  function end(){
    if(!on||busy)return;on=false;
    if(pull>=GO){busy=true;el.classList.add('spin');el.style.transform='translate(-50%,'+(GO-50)+'px)';
      try{if(navigator.serviceWorker&&navigator.serviceWorker.getRegistrations)
        navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){try{r.update();}catch(_){}});});}catch(_){}
      setTimeout(function(){location.reload();},450);
    }else{el.style.opacity=0;el.style.transform='translate(-50%,-70px)';}
    pull=0;}
  addEventListener('touchend',end,{passive:true});addEventListener('touchcancel',end,{passive:true});
})();
