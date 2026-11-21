(function(){
'use strict';
/* تغذية بصرية فورية عند الإضافة للسلة (لا تغيّر منطق السلة) */
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('.price-row .add-btn');
  if(!b||b.disabled||b.__luxBusy)return;
  b.__luxBusy=true;
  var old=b.innerHTML;
  setTimeout(function(){
    if(!b.isConnected){return}
    b.classList.add('lux-done');b.innerHTML='<i class="fa-solid fa-check"></i> تمت الإضافة';
    setTimeout(function(){if(b.isConnected){b.classList.remove('lux-done');b.innerHTML=old}b.__luxBusy=false},1300);
  },0);
},true);
})();
