(function(){
'use strict';
var $=function(q,r){return (r||document).querySelector(q)};
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var F=function(){return window.__facets};
var SORTS=[['newest','الأحدث أولاً'],['price-asc','الأقل سعراً'],['price-desc','الأعلى سعراً'],['discount','الأكثر خصماً'],['rating','الأعلى تقييماً'],['name-asc','الاسم: أ - ي']];
var draft=null,drawer=null,bounds=[0,1000];

function clone(o){return JSON.parse(JSON.stringify(o))}
function build(){
 if(drawer)return drawer;
 drawer=document.createElement('div');drawer.id='mkFacets';drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-label','تصفية المنتجات');drawer.hidden=true;
 drawer.innerHTML='<div class="fc-ov" data-close></div><aside class="fc-panel"><header><h3>تصفية وترتيب</h3><button type="button" class="fc-x" data-close aria-label="إغلاق">✕</button></header><div class="fc-body" id="fcBody"></div><footer><button type="button" class="fc-clear" id="fcClear">مسح الكل</button><button type="button" class="fc-apply" id="fcApply">عرض النتائج</button></footer></aside>';
 document.body.appendChild(drawer);
 drawer.addEventListener('click',function(e){if(e.target.closest('[data-close]'))close()});
 drawer.addEventListener('keydown',function(e){
  if(e.key==='Escape'){close();return}
  if(e.key==='Tab'){var f=[].slice.call(drawer.querySelectorAll('button,input,[tabindex]')).filter(function(x){return !x.disabled&&x.offsetParent!==null});
   if(!f.length)return;var a=f[0],z=f[f.length-1];
   if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
 });
 $('#fcApply',drawer).addEventListener('click',function(){F().apply(draft);close();syncUrl();refreshBadge()});
 $('#fcClear',drawer).addEventListener('click',function(){draft={cats:[],rating:0,inStock:false,discount:0,min:null,max:null,sort:draft.sort};paint();});
 return drawer;
}
function section(t,inner){return '<section class="fc-sec"><h4>'+t+'</h4>'+inner+'</section>'}
function paint(){
 var b=bounds,mn=draft.min==null?b[0]:draft.min,mx=draft.max==null?b[1]:draft.max;
 var cats=F().categories();
 var html='';
 html+=section('السعر (ج)','<div class="fc-price"><input type="number" inputmode="numeric" id="fcMin" min="'+b[0]+'" max="'+b[1]+'" value="'+(draft.min==null?'':draft.min)+'" placeholder="من '+b[0]+'" aria-label="أقل سعر"><span>—</span><input type="number" inputmode="numeric" id="fcMax" min="'+b[0]+'" max="'+b[1]+'" value="'+(draft.max==null?'':draft.max)+'" placeholder="إلى '+b[1]+'" aria-label="أعلى سعر"></div>'+
  '<div class="fc-range"><input type="range" id="fcRMin" min="'+b[0]+'" max="'+b[1]+'" value="'+mn+'" aria-label="الحد الأدنى للسعر"><input type="range" id="fcRMax" min="'+b[0]+'" max="'+b[1]+'" value="'+mx+'" aria-label="الحد الأعلى للسعر"></div>');
 html+=section('القسم',cats.map(function(c){var on=draft.cats.indexOf(c.key)>-1;return '<label class="fc-chk"><input type="checkbox" data-cat="'+esc(c.key)+'"'+(on?' checked':'')+'><span>'+esc(c.label)+'</span><em>'+c.count+'</em></label>'}).join(''));
 html+=section('التقييم','<div class="fc-chips"><button type="button" data-rate="0" class="'+(!draft.rating?'on':'')+'">الكل</button><button type="button" data-rate="4" class="'+(draft.rating===4?'on':'')+'">★ 4 وأكثر</button><button type="button" data-rate="3" class="'+(draft.rating===3?'on':'')+'">★ 3 وأكثر</button></div>');
 html+=section('نسبة الخصم','<div class="fc-chips">'+[0,10,25,50].map(function(d){return '<button type="button" data-disc="'+d+'" class="'+(draft.discount===d?'on':'')+'">'+(d?d+'% فأكثر':'الكل')+'</button>'}).join('')+'</div>');
 html+=section('التوفر','<label class="fc-switch"><input type="checkbox" id="fcStock"'+(draft.inStock?' checked':'')+'><span>المتوفر فقط</span></label>');
 html+=section('الترتيب','<div class="fc-sorts">'+SORTS.map(function(x){return '<label><input type="radio" name="fcSort" value="'+x[0]+'"'+(draft.sort===x[0]?' checked':'')+'><span>'+x[1]+'</span></label>'}).join('')+'</div>');
 $('#fcBody',drawer).innerHTML=html;
 bind();count();
}
function count(){var n=F().preview(draft);var b=$('#fcApply',drawer);b.textContent=n?'عرض '+n+' نتيجة':'لا توجد نتائج';b.disabled=!n}
function bind(){
 var d=drawer;
 function setMin(v){draft.min=v===''||v==null?null:Math.max(bounds[0],Number(v))}
 function setMax(v){draft.max=v===''||v==null?null:Math.min(bounds[1],Number(v))}
 $('#fcMin',d).addEventListener('input',function(){setMin(this.value);var r=$('#fcRMin',d);if(r&&this.value!=='')r.value=this.value;count()});
 $('#fcMax',d).addEventListener('input',function(){setMax(this.value);var r=$('#fcRMax',d);if(r&&this.value!=='')r.value=this.value;count()});
 $('#fcRMin',d).addEventListener('input',function(){var v=Math.min(Number(this.value),Number($('#fcRMax',d).value));this.value=v;draft.min=v<=bounds[0]?null:v;$('#fcMin',d).value=draft.min==null?'':v;count()});
 $('#fcRMax',d).addEventListener('input',function(){var v=Math.max(Number(this.value),Number($('#fcRMin',d).value));this.value=v;draft.max=v>=bounds[1]?null:v;$('#fcMax',d).value=draft.max==null?'':v;count()});
 d.querySelectorAll('[data-cat]').forEach(function(c){c.addEventListener('change',function(){var k=this.dataset.cat,i=draft.cats.indexOf(k);if(this.checked&&i<0)draft.cats.push(k);if(!this.checked&&i>-1)draft.cats.splice(i,1);count()})});
 d.querySelectorAll('[data-rate]').forEach(function(b){b.addEventListener('click',function(){draft.rating=Number(this.dataset.rate);paint()})});
 d.querySelectorAll('[data-disc]').forEach(function(b){b.addEventListener('click',function(){draft.discount=Number(this.dataset.disc);paint()})});
 $('#fcStock',d).addEventListener('change',function(){draft.inStock=this.checked;count()});
 d.querySelectorAll('[name=fcSort]').forEach(function(r){r.addEventListener('change',function(){draft.sort=this.value;count()})});
}
var lastFocus=null;
function open(){
 if(!F())return;build();lastFocus=document.activeElement;
 bounds=F().priceBounds();draft=clone(F().state());
 paint();drawer.hidden=false;document.documentElement.classList.add('fc-lock');
 setTimeout(function(){var x=$('.fc-x',drawer);x&&x.focus()},30);
}
function close(){if(!drawer)return;drawer.hidden=true;document.documentElement.classList.remove('fc-lock');if(lastFocus&&lastFocus.focus)lastFocus.focus()}

/* ---- روابط قابلة للمشاركة ---- */
function syncUrl(){
 try{var s=F().state(),u=new URL(location.href),q=u.searchParams;
  ['cat','min','max','rating','stock','disc','sort'].forEach(function(k){q.delete(k)});
  if(s.cats.length)q.set('cat',s.cats.join('|'));if(s.min!=null)q.set('min',s.min);if(s.max!=null)q.set('max',s.max);
  if(s.rating)q.set('rating',s.rating);if(s.inStock)q.set('stock','1');if(s.discount)q.set('disc',s.discount);if(s.sort&&s.sort!=='newest')q.set('sort',s.sort);
  history.replaceState(history.state,'',u.pathname+(q.toString()?'?'+q.toString():'')+u.hash);}catch(e){}
}
var urlDone=false;
function fromUrl(){
 if(urlDone)return;var st=window.__store;if(!F()||!st||!st.products.length)return;urlDone=true;
 var q=new URLSearchParams(location.search);
 if(!['cat','min','max','rating','stock','disc','sort'].some(function(k){return q.has(k)}))return;
 var cur=F().state(),t={cats:q.get('cat')?q.get('cat').split('|'):[],rating:Number(q.get('rating'))||0,inStock:q.get('stock')==='1',discount:Number(q.get('disc'))||0,
  min:q.has('min')?Number(q.get('min')):null,max:q.has('max')?Number(q.get('max')):null,sort:q.get('sort')||cur.sort};
 setTimeout(function(){F().apply(t);refreshBadge()},300);
}

/* ---- أزرار الفتح + شارة العدد ---- */
function btnHtml(){return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg><span>تصفية</span><b class="fc-badge" hidden></b>'}
function inject(){
 if(!$('#mkFacetBtn')){var h=$('.mk-grid-h .mk-chips');if(h){var b=document.createElement('button');b.id='mkFacetBtn';b.type='button';b.className='fc-open';b.innerHTML=btnHtml();b.addEventListener('click',open);h.insertBefore(b,h.firstChild)}}
 if(!$('#mkFacetBtn2')){var f=$('#searchPageFilterBar');if(f){var c=document.createElement('button');c.id='mkFacetBtn2';c.type='button';c.className='fc-open fc-open-sp';c.innerHTML=btnHtml();c.addEventListener('click',open);f.insertBefore(c,f.firstChild)}}
}
function refreshBadge(){
 if(!F())return;var n=F().activeCount();
 document.querySelectorAll('.fc-badge').forEach(function(b){b.hidden=!n;b.textContent=n});
 document.querySelectorAll('.fc-open').forEach(function(b){b.classList.toggle('on',n>0)});
 document.body.classList.toggle('mk-facets-on',n>0);
}

/* ---- مفاتيح الأسهم داخل قائمة الاقتراحات ---- */
function items(box){return [].slice.call(box.querySelectorAll('.search-suggestion-item,.search-suggestion-category,.search-suggestion-all,.sh-chip,.sh-item'))}
function kbd(e){
 var box=e.target.id==='searchPageInput'?$('#searchPageSuggestions'):$('#searchSuggestions');
 if(!box||box.hidden)return;
 var list=items(box);if(!list.length)return;
 var cur=list.findIndex(function(x){return x.classList.contains('kbd-active')});
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){
  e.preventDefault();
  var n=e.key==='ArrowDown'?(cur+1)%list.length:(cur<=0?list.length-1:cur-1);
  list.forEach(function(x){x.classList.remove('kbd-active')});list[n].classList.add('kbd-active');list[n].scrollIntoView({block:'nearest'});
 }else if(e.key==='Enter'&&cur>-1){
  e.preventDefault();e.stopImmediatePropagation();list[cur].click();
 }
}
function wireKbd(){['searchInput','searchPageInput'].forEach(function(id){var i=document.getElementById(id);if(i&&!i.__kbd){i.__kbd=1;i.addEventListener('keydown',kbd,true);
 i.addEventListener('input',function(){var b=id==='searchPageInput'?$('#searchPageSuggestions'):$('#searchSuggestions');b&&b.querySelectorAll('.kbd-active').forEach(function(x){x.classList.remove('kbd-active')})})}})}

function tick(){try{inject();wireKbd();fromUrl();refreshBadge()}catch(e){}}
tick();(window.__tick||setInterval)(tick,1000);
})();
