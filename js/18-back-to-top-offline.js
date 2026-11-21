(function(){
  var b=document.getElementById('backToTop'),o=document.getElementById('offlineBanner'),t=false;
  addEventListener('scroll',function(){if(t)return;t=true;requestAnimationFrame(function(){b.classList.toggle('show',scrollY>600);t=false;});},{passive:true});
  b.addEventListener('click',function(){scrollTo({top:0,behavior:'smooth'});});
  var nt;
  function net(){
    clearTimeout(nt);
    if(navigator.onLine){o.classList.remove('show');return;}
    o.classList.add('show');
    nt=setTimeout(function(){o.classList.remove('show');},3000);
  }
  addEventListener('online',net);addEventListener('offline',net);net();
  var sk=document.createElement('a');sk.className='skip-link';sk.href='#main-content';sk.textContent='تخطي إلى المحتوى';
  document.body.insertBefore(sk,document.body.firstChild);
  var m=document.querySelector('main')||document.querySelector('.container');
  if(m&&!m.id)m.id='main-content';
  document.querySelectorAll('button:not([aria-label]):not([title])').forEach(function(x){
    if(!x.textContent.trim()){var i=x.querySelector('i');if(i)x.setAttribute('aria-label',(i.className.match(/fa-([a-z-]+)$/)||[,'زر'])[1]);}
  });
})();
