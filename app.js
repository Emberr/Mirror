import {loadUser, saveUser} from './store.js';
import {shuffle, cosine, average} from './components.js';
import { exportDataToCSV } from './export.js';

let user;
let version = 'random';

let dilemmas = [];
let quotes = [];
let orderedDilemmas = [];
let currentIndex = 0;
let startTime = 0;

let selectedOptionData = null;
let dilemmaLoadTs = 0;

let selectedEmotion = null;

const versionToggle              = document.getElementById('versionToggle');
const startButton                = document.getElementById('startButton');
const cardContainer              = document.getElementById('dilemmaContainer');
const emptyState                 = document.getElementById('initialState');
const dilemmaPrompt              = document.getElementById('dilemmaPrompt');
const optionButtons              = document.getElementById('optionsButton');
const quoteMirrorButtonContainer = document.getElementById('quoteMirrorButtonContainer');
const seeMirrorButton            = document.getElementById('seeMirrorButton');
const quoteMirrorSection         = document.getElementById('quoteMirrorSection');
const quoteList                  = document.getElementById('quoteList');
const radarCanvas                = document.getElementById('ideologyRadar');
const downloadCsvBtn             = document.getElementById('downloadCsvBtn');

const principleModal     = document.getElementById('principle');
const principleForm      = document.getElementById('principleForm');
const confirmPrincipleBtn = document.getElementById('principleSubmit');

const emotionModal        = document.getElementById('emotionModal');
const plutchikWheel       = document.getElementById('plutchikWheel');
const confirmEmotionBtn   = document.getElementById('confirmEmotionBtn');

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

async function init() {
    user = loadUser();
    user.emotionHistory = user.emotionHistory || [];
    user.history = user.history || [];

    const [dRes, qRes] = await Promise.all([
        fetch('dilemmas.json'), fetch('quotes.json')
    ]);
    dilemmas = await dRes.json();
    quotes = await qRes.json();

    versionToggle.addEventListener('change', (e) => {
        version = e.target.value;
        user.version = version;
        saveUser(user);
    });

    startButton.addEventListener('click', startSession);
    confirmPrincipleBtn.addEventListener('click', onConfirmPrinciple);
    confirmEmotionBtn.addEventListener('click', onConfirmEmotion);
    seeMirrorButton.addEventListener('click', showQuoteMirror);
    downloadCsvBtn.addEventListener('click', () => exportDataToCSV(user));

    const observer = new MutationObserver(() => {
        if (!cardContainer.classList.contains('hidden')) {
            dilemmaLoadTs = performance.now();
        }
    });
    observer.observe(cardContainer, { attributes: true, attributeFilter: ['class'] });
}

function startSession() {
    currentIndex = 0;
    startTime = performance.now();
    user.version = version;
    saveUser(user);

    hide(emptyState);
    hide(quoteMirrorButtonContainer);
    hide(quoteMirrorSection);

    orderedDilemmas = rankDilemmas(dilemmas, user.ideologyVec, version);
    renderCurrentDilemma();
}

function renderCurrentDilemma() {

    if (currentIndex >= 8 || currentIndex >= orderedDilemmas.length) {
        hide(cardContainer);
        show(quoteMirrorButtonContainer);
        return;
    }

    const D = orderedDilemmas[currentIndex];
    dilemmaPrompt.textContent = D.prompt;
    optionButtons.innerHTML = '';

    D.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.textContent = opt.txt;
        btn.className = 'w-full text-left px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded';
        btn.addEventListener('click', () => onOptionSelected(D.id, opt, `opt${idx}`));
        optionButtons.appendChild(btn);
    });

    show(cardContainer);
    hide(principleModal);
    hide(emotionModal);
}

function onOptionSelected(dilemmaId, opt, optionId) {
    const rt_ms = performance.now() - dilemmaLoadTs;
    selectedOptionData = { dilemmaId, optionVec: opt.vec, optionId, rt_ms };
    // Debug: log choice
    console.debug('Choice made:', { dilemmaId, optionId, optionText: opt.txt, rt_ms });
    show(principleModal);
}

function onConfirmPrinciple() {

    const formData = new FormData(principleForm);
    const principleTag = formData.get('principle') || 'Unknown';
    principleForm.reset();
    hide(principleModal);


    const η = 0.2;
    for (const k in user.ideologyVec) {
        user.ideologyVec[k] += η * (selectedOptionData.optionVec[k] - user.ideologyVec[k]);
    }

    user.history.push({
        dilemmaId: selectedOptionData.dilemmaId,
        optionId: selectedOptionData.optionId,
        principle: principleTag,
        rt_ms: selectedOptionData.rt_ms,
        ts: new Date().toISOString()
    });
    saveUser(user);

    // Debug: log updated user ideology vector
    console.debug('Updated ideologyVec:', {...user.ideologyVec});

    selectedOptionData = null;
    currentIndex++;


    if ([3, 6].includes(currentIndex)) {
        showEmotionModal(currentIndex);
    } else {
        renderCurrentDilemma();
    }
}

function showEmotionModal(stage) {
    plutchikWheel.innerHTML = '';
    selectedEmotion = null;
    confirmEmotionBtn.disabled = true;


    const emotions = [
        'Joy', 'Trust', 'Fear', 'Surprise',
        'Sadness', 'Disgust', 'Anger', 'Anticipation'
    ];
    const wheelGrid = document.createElement('div');
    wheelGrid.className = 'grid grid-cols-4 gap-2';
    emotions.forEach((eName) => {
        const btn = document.createElement('button');
        btn.textContent = eName;
        btn.className = 'px-2 py-1 bg-yellow-200 rounded hover:bg-yellow-300 focus:outline-none';
        btn.dataset.emotion = eName;
        btn.dataset.level = 1;
        btn.addEventListener('click', () => {
            let lvl = parseInt(btn.dataset.level, 10);
            lvl = lvl < 3 ? lvl + 1 : 1;
            btn.dataset.level = lvl;
            btn.style.backgroundColor = ['#FFEDA0','#FED976','#FEB24C'][lvl - 1];
            selectedEmotion = { name: eName, intensity: lvl };
            confirmEmotionBtn.disabled = false;
        });
        wheelGrid.appendChild(btn);
    });
    plutchikWheel.appendChild(wheelGrid);

    show(emotionModal);
}

function onConfirmEmotion() {
    if (!selectedEmotion) return;
    if (emotionModal.querySelector('h2').textContent.includes('overall experience')) {
        finalEmotionGiven = true;
        downloadCsvBtn.disabled = false;
    }
    user.emotionHistory.push({
        stage: currentIndex,
        emotion: selectedEmotion.name,
        intensity: selectedEmotion.intensity,
        ts: new Date().toISOString()
    });
    saveUser(user);
    hide(emotionModal);
    if (finalEmotionGiven) return;
    renderCurrentDilemma();
}

let finalEmotionGiven = false;

function showFinalEmotionModal() {
    plutchikWheel.innerHTML = '';
    selectedEmotion = null;
    confirmEmotionBtn.disabled = true;
    emotionModal.querySelector('h2').textContent = 'Finally, which emotion best describes your overall experience?';
    show(emotionModal);
}

function showQuoteMirror() {
    hide(cardContainer);
    hide(quoteMirrorButtonContainer);

    const topQuotes = rankQuotes(quotes, user.ideologyVec, version);
    quoteList.innerHTML = '';
    topQuotes.forEach((q) => {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-lg shadow p-4';
        div.innerHTML = `
            <p class="italic mb-1">"${q.text}"</p>
            <p class="text-right font-medium">— ${q.author}</p>
        `;
        quoteList.appendChild(div);
    });

    renderRadarChart(radarCanvas.getContext('2d'), user.ideologyVec);
    show(quoteMirrorSection);
    showFinalEmotionModal();
    downloadCsvBtn.disabled = true;
}

function rankDilemmas(list, userVec, version) {
    if (version === 'random') {
        return shuffle(list);
    }
    return [...list].sort((d1, d2) => {
        const avg1 = average(d1.options.map(o => o.vec));
        const avg2 = average(d2.options.map(o => o.vec));
        const sim1 = cosine(userVec, avg1);
        const sim2 = cosine(userVec, avg2);
        return sim1 - sim2;
    });
}

function rankQuotes(list, userVec, version) {
    if (version === 'random') {
        return shuffle(list).slice(0, 5);
    }
    return [...list]
        .sort((q1, q2) => cosine(userVec, q2.vec) - cosine(userVec, q1.vec))
        .slice(0, 5);
}

function renderRadarChart(ctx, dataVec) {
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: Object.keys(dataVec),
            datasets: [{
                label: 'Your Ideology Profile',
                data: Object.values(dataVec),
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                pointBackgroundColor: 'rgba(59, 130, 246, 1)'
            }]
        },
        options: {
            scales: {
                r: {
                    beginAtZero: true,
                    max: 1
                }
            }
        }
    });
}

window.addEventListener('DOMContentLoaded', init);