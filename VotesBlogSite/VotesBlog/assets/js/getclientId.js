
//This one is used to get a persistent client ID stored in localStorage
function getPersistentClientId(key = 'client_id'){
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = (crypto && crypto.randomUUID) ? crypto.randomUUID()
          : (Date.now() + '_' + Math.random().toString(36).slice(2));
      localStorage.setItem(key, id);
    }
    return id;
  } catch (e) {
    return (Date.now() + '_' + Math.random().toString(36).slice(2));
  }
}

//Not used
function getSessionClientId(key = 'client_session_id'){
  try {
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = (crypto && crypto.randomUUID) ? crypto.randomUUID()
          : (Date.now() + '_' + Math.random().toString(36).slice(2));
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch (e) {
    return (Date.now() + '_' + Math.random().toString(36).slice(2));
  }
}