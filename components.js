export function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i>0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function cosine(a,b) {
    const dot = Object.keys(a).reduce((sum, k) => sum + a[k] * b[k], 0);
    const magA = Math.sqrt(Object.values(a).reduce((s,v) => s + v * v, 0));
    const magB = Math.sqrt(Object.values(b).reduce((s,v) => s + v * v, 0));
    return magA && magB ? dot / (magA * magB) : 0;
}

export function average(vectorsArray) {
    if (!vectorsArray.length) return {};
    const keys = Object.keys(vectorsArray[0]);
    const avg = {};
    keys.forEach(k=> {
        avg[k] = vectorsArray.reduce((sum, v) => sum + (v[k] || 0), 0) / vectorsArray.length;
    }
    );
    return avg;
}