(function(){
'use strict';
var LAB={1:'سيئ 😞',2:'مقبول 😐',3:'جيد 🙂',4:'جيد جداً 😊',5:'ممتاز 🤩'};
function init(){
  var sp=document.getElementById('starPicker');
  if(sp&&!document.getElementById('luxStarLabel')){
    var l=document.createElement('div');l.id='luxStarLabel';l.setAttribute('aria-live','polite');sp.insertAdjacentElement('afterend',l);
    sp.addEventListener('click',function(e){var b=e.target.closest('button[data-rating]');if(b)l.textContent=LAB[b.dataset.rating]||''});
  }
  var t=document.getElementById('reviewText');
  if(t&&!document.getElementById('luxRevCount')){
    var c=document.createElement('div');c.id='luxRevCount';c.textContent='0 / '+(t.maxLength>0?t.maxLength:500);t.insertAdjacentElement('afterend',c);
    t.addEventListener('input',function(){c.textContent=t.value.length+' / '+(t.maxLength>0?t.maxLength:500)});
  }
}
/* الضغط على صف المنتج في المرتجعات يحدد/يلغي التحديد (يستخدم نفس مربع الاختيار الموجود) */
document.addEventListener('click',function(e){
  var row=e.target.closest&&e.target.closest('.return-item-row');
  if(!row||row.classList.contains('disabled'))return;
  if(e.target.closest('input,select,textarea,button,label,a'))return;
  var cb=row.querySelector('.return-item-checkbox');
  if(cb&&!cb.disabled)cb.click();
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
