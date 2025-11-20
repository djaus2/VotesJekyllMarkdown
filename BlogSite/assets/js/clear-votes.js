(function(){
  function init(){
    var btn=document.getElementById('clear-votes-btn');
    if(!btn) return;
    btn.addEventListener('click', function(){
      try{
        var toRemove=[], i, k;
        for(i=0;i<localStorage.length;i++){
          k=localStorage.key(i);
          if(!k) continue;
          if(k.startsWith('emoji_voted_')||k.startsWith('emoji_count_')||k.startsWith('survey_vote_')||k==='emoji_client_id'||k==='survey_client_id'){
            toRemove.push(k);
          }
        }
        toRemove.forEach(function(x){ localStorage.removeItem(x); });
        btn.disabled=true; btn.textContent='Votes cleared';
        setTimeout(function(){
          try { location.reload(); } catch(e){}
        }, 200);
      }catch(e){ btn.textContent='Clear failed'; }
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
