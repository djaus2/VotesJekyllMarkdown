---
---
(function(){
  console.log('[emoji-counter] script loaded');
  var ns = '{{ site.title | default: "djzblog" | slugify }}' || 'djzblog';
  // Set your Azure Function base URL (no trailing slash)
  //var base = 'https://THE_AZURE_FUNCTION_NAME.azurewebsites.net/api/emoji?action=';
  var base = 'http://localhost:7050/api/emoji?action=';
  //var jsBase = 'https://THE_AZURE_FUNCTION_NAME.azurewebsites.net/api/emoji';
  var jsBase = 'http://localhost:7050/api/emoji';

  function setPressed(btn, v){ btn.setAttribute('aria-pressed', v ? 'true':'false'); btn.classList.toggle('is-active', !!v); }
  function setCount(cnt, v){ cnt.textContent = String(v || 0); }

  function getCount(key){
    return fetch(base + 'get&key=' + encodeURIComponent(key) + '&ns=' + encodeURIComponent(ns), { cache: 'no-store' })
      .then(function(r){ if(!r.ok) throw new Error('bad'); return r.json(); });
  }

  // Generate and persist a per-browser client id for server-side dedupe
  function getClientId(){
    try {
      var id = localStorage.getItem('emoji_client_id');
      if (!id) {
        id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '_' + Math.random().toString(36).slice(2));
        localStorage.setItem('emoji_client_id', id);
      }
      return id;
    } catch (e) {
      // Fallback if localStorage is unavailable
      return (Date.now() + '_' + Math.random().toString(36).slice(2));
    }
  }



  function hitCount(key){
    var client = getClientId();
    return fetch(base + 'hit&key=' + encodeURIComponent(key) + '&ns=' + encodeURIComponent(ns) + '&client=' + encodeURIComponent(client))
      .then(function(r){ if(!r.ok) throw new Error('bad'); return r.json(); });
  }

  function sanitizeKey(raw){
    var key = (raw || '').replace(/[^a-z0-9\-_/]/gi,'').replace(/\/+$/,'');
    if(!key) key = 'home';
    return key;
  }

  function init(el){
    var rawKey = el.getAttribute('data-key') || location.pathname;
    var key = sanitizeKey(rawKey);
    var btn = el.querySelector('.emoji-btn');
    var cnt = el.querySelector('.emoji-count');
    if(!btn || !cnt) return;

    var votedKey = 'emoji_voted_' + key;

    getCount(key).then(function(d){ if(d && typeof d.value === 'number') setCount(cnt, d.value); })
                 .catch(function(){ var lc = parseInt(localStorage.getItem('emoji_count_' + key) || '0', 10); setCount(cnt, lc); });

    var voted = localStorage.getItem(votedKey) === '1';
    setPressed(btn, voted);

    btn.addEventListener('click', function(){
      if(voted) return;
      hitCount(key).then(function(d){ if(d && typeof d.value === 'number') setCount(cnt, d.value); })
                   .catch(function(){ var lc = parseInt(localStorage.getItem('emoji_count_' + key) || '0', 10); lc++; localStorage.setItem('emoji_count_' + key, String(lc)); setCount(cnt, lc); });
      voted = true; localStorage.setItem(votedKey, '1'); setPressed(btn, true);
    });
  }

  function ready(fn){ if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', fn); } else { fn(); } }

  ready(function(){
    var nodes = document.querySelectorAll('.emoji-counter');
    for(var i=0;i<nodes.length;i++) init(nodes[i]);
  });
})();
