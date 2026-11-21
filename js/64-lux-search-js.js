(function(){
'use strict';
var $=function(s,r){return(r||document).querySelector(s)};
/* 1) تمييز كلمة البحث داخل الاقتراحات */
var sg=$('#searchSuggestions'),inp=$('#searchInput'),busy=false;
function hl(){
  if(busy||!sg||!inp)return;
  var q=(inp.value||'').trim();if(q.length<1)return;
  var words=q.split(/\s+/).filter(Boolean).map(function(w){return w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')});
  if(!words.length)return;
  var re=new RegExp('('+words.join('|')+')','gi');
  busy=true;
  try{
    sg.querySelectorAll('.suggestion-info strong').forEach(function(el){
      if(el.querySelector('mark'))return;
      var t=el.textContent;if(!re.test(t)){re.lastIndex=0;return}
      re.lastIndex=0;
      el.innerHTML=t.replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]}).replace(re,'<mark>$1</mark>');
    });
  }catch(e){}
  busy=false;
}
if(sg){new MutationObserver(hl).observe(sg,{childList:true,subtree:true})}
/* 2) زر الإضاءة (Torch) داخل قارئ الباركود إن دعمه الجهاز */
var modal=$('#storeBarcodeReaderModal'),card=modal&&$('.barcode-reader-card',modal),wrap=modal&&$('.barcode-reader-video-wrap',modal),vid=$('#storeBarcodeVideo');
function torchTrack(){
  try{var tr=vid&&vid.srcObject&&vid.srcObject.getVideoTracks()[0];
    var c=tr&&tr.getCapabilities&&tr.getCapabilities();return(c&&c.torch)?tr:null}catch(e){return null}
}
function ensureTorch(){
  if(!wrap)return;var b=$('#luxTorchBtn',wrap),tr=torchTrack();
  if(!tr){if(b)b.remove();return}
  if(b)return;
  b=document.createElement('button');b.id='luxTorchBtn';b.type='button';b.setAttribute('aria-label','تشغيل الفلاش');
  b.innerHTML='<i class="fa-solid fa-bolt"></i>';
  b.onclick=function(){
    var t=torchTrack();if(!t)return;var on=!b.classList.contains('on');
    t.applyConstraints({advanced:[{torch:on}]}).then(function(){b.classList.toggle('on',on)}).catch(function(){});
  };
  wrap.appendChild(b);
}
if(vid){
  vid.addEventListener('playing',function(){setTimeout(ensureTorch,300)});
  vid.addEventListener('loadedmetadata',function(){setTimeout(ensureTorch,500)});
}
/* 3) سحب وإفلات صورة الباركود داخل النافذة + لصقها من الحافظة */
function feed(f){
  if(f&&/^image\//.test(f.type)&&typeof handleStoreBarcodeImage==='function'){handleStoreBarcodeImage(f)}
}
if(card){
  ['dragenter','dragover'].forEach(function(ev){card.addEventListener(ev,function(e){e.preventDefault();card.classList.add('lux-drag')})});
  ['dragleave','drop'].forEach(function(ev){card.addEventListener(ev,function(e){e.preventDefault();card.classList.remove('lux-drag')})});
  card.addEventListener('drop',function(e){feed(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0])});
}
document.addEventListener('paste',function(e){
  if(!modal||!modal.classList.contains('show'))return;
  var it=[].slice.call((e.clipboardData&&e.clipboardData.items)||[]).filter(function(i){return/^image\//.test(i.type)})[0];
  if(it)feed(it.getAsFile());
});
/* 4) اهتزاز خفيف عند نجاح قراءة الباركود */
var st=$('#barcodeSearchStatus');
if(st){new MutationObserver(function(){
  if(/success/.test(st.style.color||'')||/نجاح|تم العثور/.test(st.textContent)&&!/لم يتم/.test(st.textContent)){
    if(navigator.vibrate){try{navigator.vibrate([25,40,25])}catch(e){}}
    if(card){card.classList.remove('lux-hit');void card.offsetWidth;card.classList.add('lux-hit')}
  }
}).observe(st,{childList:true,characterData:true,subtree:true})}
/* 5) اختصار: "/" للتركيز على البحث، Esc لإغلاق الاقتراحات */
document.addEventListener('keydown',function(e){
  var tag=(e.target.tagName||'').toLowerCase();
  if(e.key==='/'&&inp&&tag!=='input'&&tag!=='textarea'&&tag!=='select'){e.preventDefault();inp.focus()}
});
})();
