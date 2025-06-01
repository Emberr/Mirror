const USERKEY = 'ideologyMirrorUser';

export function loadUser() {
  const raw = localStorage.getItem(USERKEY);
  return raw
    ? JSON.parse(raw)
    : {
        uid: Date.now().toString(10),
        version: 'random',
        ideologyVec: {util:0.0, deon:0.0, virtue:0.0, prog:0.0, cons:0.0, relig:0.0},
        history: [],
        emotionHistory: [],
    };
    
}

export function saveUser(user) {
  localStorage.setItem(USERKEY, JSON.stringify(user));
}