(function(){
  console.log('[survey] script loaded');

  function getClientId(){
    try {
      var id = localStorage.getItem('survey_client_id');
      if (!id) {
        id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '_' + Math.random().toString(36).slice(2));
        localStorage.setItem('survey_client_id', id);
      }
      return id;
    } catch (e) {
      return (Date.now() + '_' + Math.random().toString(36).slice(2));
    }
  }

  function ready(fn){ if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', fn); } else { fn(); } }

  function initSurvey(root){
    var ns = root.getAttribute('data-ns') || 'site';
    var id = root.getAttribute('data-id') || 'survey';
    var api = root.getAttribute('data-api') || '';
    var pageKey = root.getAttribute('data-key') || location.pathname;
    var fnCode = root.getAttribute('data-code') || '';
    var status = root.querySelector('.survey-status');
    var buttons = root.querySelectorAll('.survey-opt');
    try { console.log('[survey] init-1', { ns: ns, id: id, api: api || '(none)', key: pageKey}); } catch(e){}
    try { console.log('[survey] init-2', { code: fnCode, buttons: buttons.length }); } catch(e){}

    var storeKey = 'survey_vote_' + ns + ':' + id;
     //localStorage.clear(); // DEBUGGING ONLY - remove in production
      //return;
    var voted = localStorage.getItem(storeKey);

    function renderSelected(opt){
      for (var i=0;i<buttons.length;i++){
        var b = buttons[i];
        var sel = b.getAttribute('data-opt') === opt;
        b.classList.toggle('is-selected', sel);
        b.disabled = true; // lock all after a vote
      }
      if (status) status.textContent = 'Thanks for your response.';
    }

    function setCount(button, count){
      var span = button.querySelector('.survey-count');
      if (!span) return;
      if (typeof count === 'number' && count > 0){
        span.textContent = ' (' + count + ')';
        span.classList.add('is-visible');
      } else {
        span.textContent = '';
        span.classList.remove('is-visible');
      }
    }

    function fetchCount(opt){
      if (!api) return Promise.resolve(0);
      var base = api;
      var sep = (base.indexOf('?')>=0 ? '&' : '?');
      var url = base + sep + (fnCode ? ('code=' + encodeURIComponent(fnCode) + '&') : '') + 'action=get' +
                '&ns=' + encodeURIComponent(opt) +
                '&key=' + encodeURIComponent(pageKey);
      try { console.log('[survey] fetch count', url); } catch(e){}
      return fetch(url, { cache: 'no-store' })
        .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json().catch(function(){return {};}); })
        .then(function(d){ return (d && typeof d.value === 'number') ? d.value : 0; })
        .catch(function(){ return 0; });
    }

    // Load counts for each option (best-effort)
    (function loadAllCounts(){
      for (var i=0;i<buttons.length;i++){
        (function(b){ var opt = b.getAttribute('data-opt') || ''; if(!opt) return; fetchCount(opt).then(function(c){ setCount(b, c); }); })(buttons[i]);
      }
    })();

    if (voted){
      renderSelected(voted);
    }

    function sendToApi(opt){
      if (!api) return Promise.reject(new Error('no_api'));
      // emoji API format: action=Hit|Get, ns=<option>, client=<cid>, key=<pageKey>
      var cid;
      try { cid = (typeof getPersistentClientId === 'function') ? getPersistentClientId('survey_client_id') : null; } catch(e){ cid = null; }
      if (!cid) { cid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '_' + Math.random().toString(36).slice(2)); }
      var base = api;
      var sep = (base.indexOf('?')>=0 ? '&' : '?');
      var url = base + sep + (fnCode ? ('code=' + encodeURIComponent(fnCode) + '&') : '') + 'action=hit' +
                '&ns=' + encodeURIComponent(opt) +
                '&client=' + encodeURIComponent(cid) +
                '&key=' + encodeURIComponent(pageKey);
      try { console.log('[survey] fetch', url); } catch(e){}
      return fetch(url, { cache: 'no-store' }).then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json().catch(function(){return {};}); });
    }

    // Attach click handlers to options when not already voted
    if (!voted && buttons && buttons.length){
      for (var j=0;j<buttons.length;j++){
        (function(b){
          b.addEventListener('click', function(){
            if (voted) return;
            var opt = b.getAttribute('data-opt') || '';
            if (!opt) return;
            try { console.log('[survey] option click', opt); } catch(e){}
            for (var k=0;k<buttons.length;k++){ buttons[k].disabled = true; }
            if (status) status.textContent = 'Submitting...';
            sendToApi(opt).then(function(){
              try { console.log('[survey] submit ok', opt); } catch(e){}
              try { localStorage.setItem(storeKey, opt); } catch(e){}
              voted = opt;
              renderSelected(opt);
              // refresh the page shortly after thanking the user
              setTimeout(function(){
                try { location.reload(); } catch(e){}
              }, 300);
            }).catch(function(err){
              try { console.error('[survey] submit failed', err); } catch(e){}
              if (status) status.textContent = 'Submission failed. ' + (err && err.message ? err.message : 'Please try again.');
              for (var k=0;k<buttons.length;k++){ buttons[k].disabled = false; }
            });
          });
        })(buttons[j]);
      }
    }
  }



  ready(function(){
    var nodes = document.querySelectorAll('.survey');
    for (var i=0;i<nodes.length;i++) initSurvey(nodes[i]);
  });
})();
