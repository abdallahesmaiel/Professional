(function(){
'use strict';
/* نبضة بصرية عند تغيّر أي إجمالي (لا تغيّر أي حساب) */
var ids=['ckMiniTotal','grandTotalAmount','payDueAmt','deliveryAmount','subtotalAmount'],last={};
setInterval(function(){
  ids.forEach(function(id){
    var el=document.getElementById(id);if(!el)return;
    var v=el.textContent;
    if(last[id]!==undefined&&last[id]!==v){el.classList.remove('lux-flash');void el.offsetWidth;el.classList.add('lux-flash')}
    last[id]=v;
  });
},500);
/* خطوة الشحن: اعرض رسوم المنطقة المختارة فور الاختيار (قراءة فقط من الواجهة) */
document.addEventListener('change',function(e){
  if(e.target&&e.target.id==='custZone'){
    var d=document.getElementById('deliveryAmount');
    if(d){d.classList.remove('lux-flash');void d.offsetWidth;d.classList.add('lux-flash')}
  }
});
/* ضغط مطوّل لا يلزم: اجعل الحقل الأول يأخذ التركيز عند فتح الدفع */
})();
