(function(){
  var ICON={danger:'fa-trash-can',warning:'fa-triangle-exclamation',info:'fa-bell'};
  function clean(m){return String(m==null?'':m).replace(/\\+n/g,'\n').replace(/^[\s\u26A0\uFE0F\u{1F514}\u2757\u2753\u2705]+/u,'').trim();}
  function detect(m){
    if(/حذف|مسح|تفريغ|إلغاء هذا|نهائي/.test(m))return 'danger';
    if(/إشعار/.test(m))return 'info';
    return 'warning';
  }
  var TITLES={danger:'تأكيد الإجراء',warning:'هل أنت متأكد؟',info:'تفعيل الإشعارات'};
  function open(msg,o){
    o=o||{};
    return new Promise(function(res){
      var text=clean(msg),type=o.type||detect(text),prev=document.activeElement;
      var ov=document.createElement('div');ov.className='pro-dlg-overlay';
      ov.setAttribute('role','alertdialog');ov.setAttribute('aria-modal','true');
      var d=document.createElement('div');d.className='pro-dlg '+type;
      var ic=document.createElement('div');ic.className='pro-dlg-icon';ic.innerHTML='<i class="fa-solid '+ICON[type]+'"></i>';
      var t=document.createElement('div');t.className='pro-dlg-title';t.textContent=o.title||TITLES[type];
      var m=document.createElement('div');m.className='pro-dlg-msg';m.textContent=text;
      var a=document.createElement('div');a.className='pro-dlg-actions';
      var ok=document.createElement('button');ok.type='button';ok.className='pro-dlg-ok';ok.textContent=o.okText||(type==='danger'?'نعم، متابعة':type==='info'?'تفعيل':'تأكيد');
      var no=document.createElement('button');no.type='button';no.className='pro-dlg-cancel';no.textContent=o.cancelText||'إلغاء';
      if(o.alertOnly){a.appendChild(ok);ok.textContent=o.okText||'حسناً';}else{a.appendChild(ok);a.appendChild(no);}
      d.append(ic,t,m,a);ov.appendChild(d);document.body.appendChild(ov);
      requestAnimationFrame(function(){ov.classList.add('show');});
      (type==='danger'?no:ok).focus();
      function close(v){
        document.removeEventListener('keydown',key,true);ov.classList.remove('show');
        setTimeout(function(){ov.remove();},250);
        if(prev&&prev.focus)try{prev.focus();}catch(e){}
        res(v);
      }
      function key(e){
        if(e.key==='Escape'){e.preventDefault();close(false);}
        else if(e.key==='Tab'){var b=a.querySelectorAll('button');if(!b.length)return;var f=b[0],l=b[b.length-1];
          if(e.shiftKey&&document.activeElement===f){e.preventDefault();l.focus();}else if(!e.shiftKey&&document.activeElement===l){e.preventDefault();f.focus();}}
      }
      document.addEventListener('keydown',key,true);
      ok.addEventListener('click',function(){close(true);});
      no.addEventListener('click',function(){close(false);});
      ov.addEventListener('click',function(e){if(e.target===ov)close(false);});
    });
  }
  window.proConfirm=function(m,o){return open(m,o);};
  window.proAlert=function(m,o){o=o||{};o.alertOnly=true;return open(m,o);};
  window.alert=function(m){window.proAlert(m,{type:'info',title:'تنبيه'});};
})();
