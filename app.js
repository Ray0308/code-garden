const initialCommands = ['move()', 'move()', 'turnLeft()', 'move()', 'collectGem()'];
let commands = [...initialCommands];
let executionIndex = 0;
let state = { x: 0, y: 2, direction: 0, gems: 0, steps: 0 };

const codeLines = document.querySelector('#codeLines');
const grid = document.querySelector('#grid');
const consoleText = document.querySelector('#consoleText');
const successCard = document.querySelector('#successCard');
const directions = [[1,0],[0,-1],[-1,0],[0,1]];
const characterSprites = [
  'assets/character/main-right.png',
  'assets/character/main-up.png',
  'assets/character/main-left.png',
  'assets/character/main-down.png'
];
let editorMode = 'blocks';

// Commands are language-neutral; future languages only need another adapter.
const languageAdapters = {
  python: { file: 'main.py', render: command => command }
};

function renderCode() {
  const adapter = languageAdapters.python;
  codeLines.innerHTML = commands.map((command, index) => {
    const name = command.replace('()', '');
    return `<div class="line" data-index="${index}"><span class="line-number">${index + 2}</span><code><span class="fn">${adapter.render(name)}</span><span class="paren">()</span><button class="remove" aria-label="行を削除" data-remove="${index}">×</button></code></div>`;
  }).join('');
  renderBlocks();
  document.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
    commands.splice(Number(btn.dataset.remove), 1); renderCode(); resetWorld(false);
  }));
}

function renderBlocks() {
  const info = {
    'move()': ['↑', 'すすむ', 'move-block'],
    'turnLeft()': ['↰', 'ひだりをむく', 'turn-block'],
    'collectGem()': ['◇', 'しずくをひろう', 'collect-block']
  };
  document.querySelector('#blockStack').innerHTML = commands.map((command, index) => {
    const [symbol, label, className] = info[command];
    return `<div class="program-block ${className}" data-block-index="${index}"><span class="block-symbol">${symbol}</span><span>${label}</span><span class="block-code">${command}</span><button class="block-remove" data-block-remove="${index}" aria-label="ブロックを削除">×</button></div>`;
  }).join('');
  document.querySelectorAll('[data-block-remove]').forEach(btn => btn.addEventListener('click', () => {
    commands.splice(Number(btn.dataset.blockRemove), 1); renderCode(); resetWorld(false);
  }));
}

function setEditorMode(mode) {
  editorMode = mode;
  document.querySelector('#blockArea').classList.toggle('active', mode === 'blocks');
  document.querySelector('#codeArea').classList.toggle('active', mode === 'code');
  document.querySelector('#blockModeBtn').classList.toggle('active', mode === 'blocks');
  document.querySelector('#codeModeBtn').classList.toggle('active', mode === 'code');
  document.querySelector('#blockModeBtn').setAttribute('aria-selected', mode === 'blocks');
  document.querySelector('#codeModeBtn').setAttribute('aria-selected', mode === 'code');
}

function object(className, x, y, content = '') {
  const el = document.createElement('div'); el.className = `tile-object ${className}`;
  el.style.left = `${x * 78 + 5}px`; el.style.top = `${y * 78 + 5}px`; el.innerHTML = content;
  return el;
}

function renderWorld() {
  grid.innerHTML = '';
  grid.append(object('rock', 1, 0, '♣'));
  grid.append(object('rock', 4, 3, '♠'));
  if (!state.gems) grid.append(object('gem', 2, 1, '◆'));
  const hero = object(
    'hero',
    state.x,
    state.y,
    `<img src="${characterSprites[state.direction]}" alt="フクロウのキャラクター">`
  );
  grid.append(hero);
  document.querySelector('#gemCount').textContent = state.gems;
  document.querySelector('#stepCount').textContent = state.steps;
}

function resetWorld(message = true) {
  state = { x: 0, y: 2, direction: 0, gems: 0, steps: 0 }; executionIndex = 0;
  successCard.classList.remove('show');
  document.querySelectorAll('.line').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.program-block').forEach(l => l.classList.remove('running'));
  if (message) consoleText.textContent = '↺ スタート地点にもどりました';
  renderWorld();
}

function execute(command, index) {
  document.querySelectorAll('.line').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.program-block').forEach(l => l.classList.remove('running'));
  document.querySelector(`.line[data-index="${index}"]`)?.classList.add('active');
  document.querySelector(`.program-block[data-block-index="${index}"]`)?.classList.add('running');
  state.steps++;
  if (command === 'move()') {
    const [dx,dy] = directions[state.direction];
    const nx = state.x + dx, ny = state.y + dy;
    if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5) { state.x = nx; state.y = ny; consoleText.textContent = `→ すすんだ！ (${state.x + 1}, ${state.y + 1})`; }
    else consoleText.textContent = '！これ以上はすすめないよ';
  } else if (command === 'turnLeft()') {
    state.direction = (state.direction + 1) % 4; consoleText.textContent = '↰ ひだりをむいた！';
  } else if (command === 'collectGem()') {
    if (state.x === 2 && state.y === 1) { state.gems = 1; consoleText.textContent = '✦ 光るしずくをひろった！'; setTimeout(() => successCard.classList.add('show'), 450); }
    else consoleText.textContent = '…ここにしずくはないみたい';
  }
  renderWorld();
}

async function runAll() {
  resetWorld(false); document.querySelector('#runBtn').disabled = true;
  for (let i = 0; i < commands.length; i++) { execute(commands[i], i); await new Promise(r => setTimeout(r, 620)); }
  document.querySelector('#runBtn').disabled = false;
  if (!state.gems) consoleText.textContent = '△ まだしずくをひろえていないよ。コードを変えてみよう！';
}

document.querySelectorAll('.command').forEach(btn => btn.addEventListener('click', () => { commands.push(btn.dataset.code); renderCode(); }));
document.querySelector('#addLineBtn').addEventListener('click', () => commands.length && document.querySelector('.command').focus());
document.querySelector('#resetBtn').addEventListener('click', () => { commands = [...initialCommands]; renderCode(); resetWorld(); });
document.querySelector('#againBtn').addEventListener('click', () => resetWorld());
document.querySelector('#runBtn').addEventListener('click', runAll);
document.querySelector('#stepBtn').addEventListener('click', () => {
  if (executionIndex >= commands.length) resetWorld(false);
  execute(commands[executionIndex], executionIndex); executionIndex++;
});
document.querySelector('#soundBtn').addEventListener('click', e => { e.currentTarget.textContent = e.currentTarget.textContent === '♪' ? '♩' : '♪'; });
document.querySelector('#blockModeBtn').addEventListener('click', () => setEditorMode('blocks'));
document.querySelector('#codeModeBtn').addEventListener('click', () => setEditorMode('code'));
document.querySelector('#dropZone').addEventListener('click', () => document.querySelector('.command').focus());

renderCode(); renderWorld(); setEditorMode('blocks');
