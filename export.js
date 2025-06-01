export function exportDataToCSV(user) {
    const lines = [];

    lines.push([
        'uid','version','type','dilemmaId','optionId','principle','rt_ms','ts','ideologyFinal'
    ].join(','));

    user.history.forEach((evt) => {
        const ideologyStr = Object.values(user.ideologyVec).join(';');
        lines.push([
            user.uid,
            user.version,
            'dilemma',
            evt.dilemmaId,
            evt.optionId,
            evt.principle,
            evt.rt_ms,
            evt.ts,
            ideologyStr
        ].join(','));
    });

    lines.push('');
    lines.push(['uid','version','type','stage','emotion', 'intensity', 'ts'].join(','));

    user.emotionHistory.forEach((evt) => {
        lines.push([
            user.uid,
            user.version,
            'emotion',
            evt.stage,
            evt.emotion,
            evt.intensity,
            evt.ts
        ].join(','));
    });

    const csvString = lines.join('\n');
    const blob = new Blob([csvString], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ideology_mirror_data.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Exported data to CSV');
}