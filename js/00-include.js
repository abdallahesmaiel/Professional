/* محمّل الأجزاء: بيجيب ملف HTML ويكتبه في نفس المكان بالظبط (متزامن) عشان ترتيب التحميل يفضل زي الأصل. */
window.__inc=function(path){
  var x=new XMLHttpRequest();
  try{ x.open('GET',path,false); x.send(null); }catch(e){ console.error('include failed:',path,e); return; }
  if((x.status>=200&&x.status<300)||(x.status===0&&x.responseText)){ document.write(x.responseText); }
  else console.error('include failed:',path,x.status);
};
