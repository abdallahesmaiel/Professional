/* ===== مؤقت مركزي واحد: كل المهام الدورية على نبضة واحدة وبتقف لما التاب يتخبى ===== */
(function(){
  var jobs=[],seq=0,timer=null;
  function run(){
    var n=Date.now();
    for(var i=0;i<jobs.length;i++){var j=jobs[i];
      if(n-j.last>=j.ms-60){j.last=n;try{j.fn()}catch(e){console.warn('[tick]',e)}}}
  }
  function start(){if(!timer&&jobs.length&&!document.hidden)timer=setInterval(run,1000)}
  function stop(){if(timer){clearInterval(timer);timer=null}}
  window.__tick=function(fn,ms){var id=++seq;jobs.push({id:id,fn:fn,ms:Math.max(1000,ms||1000),last:0});start();return id};
  window.__untick=function(id){if(id==null)return;jobs=jobs.filter(function(j){return j.id!==id});if(!jobs.length)stop()};
  document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else{start();run()}});
})();
