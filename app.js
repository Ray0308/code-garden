const editor = document.querySelector('#codeEditor');
const dungeon = document.querySelector('#dungeon');
const output = document.querySelector('#output');
const lineNumbers = document.querySelector('#lineNumbers');
const clearCard = document.querySelector('#clearCard');
const GAME = { birdName: 'モフ', storageKey: 'code-dungeon-progress-v1' };
const curriculum = [
  { floor: 1, title: '灯火の回廊', topic: '関数を順番に実行', syntax: 'move() / turnLeft()' },
  { floor: 2, title: '反復の石廊', topic: '同じ処理を繰り返す', syntax: 'for _ in range(3):' },
  { floor: 3, title: '分岐の番人', topic: '状況によって動きを変える', syntax: 'if frontIsClear():' },
  { floor: 4, title: '関数工房', topic: '自分の命令を定義する', syntax: 'def crossRoom():' }
];

const COLS = 8;
const ROWS = 10;
const MAX_STEPS = 20;
const start = { x: 5, y: 8, direction: 1 };
const target = { x: 5, y: 5 };
const obstacles = new Set(['1,1','3,1','0,3','6,3','2,4','3,4','1,6','3,6','6,7']);
const directions = [
  { dx: 0, dy: 1, label: '下', sprite: 'assets/character/main-down.png' },
  { dx: 1, dy: 0, label: '右', sprite: 'assets/character/main-right.png' },
  { dx: 0, dy: -1, label: '上', sprite: 'assets/character/main-up.png' },
  { dx: -1, dy: 0, label: '左', sprite: 'assets/character/main-left.png' }
];

let state;
let parsedCommands = [];
let executionIndex = 0;
let running = false;

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(GAME.storageKey)) || { cleared: [] }; }
  catch { return { cleared: [] }; }
}

function saveProgress(floor) {
  const progress = loadProgress();
  if (!progress.cleared.includes(floor)) progress.cleared.push(floor);
  localStorage.setItem(GAME.storageKey, JSON.stringify(progress));
  renderCurriculum();
}

function renderCurriculum() {
  const progress = loadProgress();
  document.querySelector('#floorList').innerHTML = curriculum.map(item => {
    const cleared = progress.cleared.includes(item.floor);
    const unlocked = item.floor === 1 || progress.cleared.includes(item.floor - 1);
    return `<article class="floor-card ${cleared ? 'cleared' : ''} ${unlocked ? '' : 'locked'}"><span>FLOOR ${String(item.floor).padStart(2, '0')}</span><div><strong>${item.title}</strong><small>${item.topic}</small><code>${item.syntax}</code></div><b>${cleared ? '✓ CLEAR' : unlocked ? '挑戦可能' : '🔒'}</b></article>`;
  }).join('');
}

function resetState(showMessage = true) {
  state = { ...start, collected: 0, steps: 0 };
  parsedCommands = parseCode().commands;
  executionIndex = 0;
  running = false;
  clearCard.classList.remove('show');
  document.querySelector('#goalDot').classList.remove('done');
  document.querySelector('#goalState').textContent = '未達成';
  if (showMessage) setOutput('›', 'スタート地点に戻りました');
  renderDungeon();
}

function parseCode() {
  const valid = new Set(['move()', 'turnLeft()', 'turnRight()', 'collectGet()']);
  const commands = [];
  const errors = [];
  editor.value.split('\n').forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    if (valid.has(line)) commands.push({ command: line, line: index + 1 });
    else errors.push({ line: index + 1, text: line });
  });
  return { commands, errors };
}

function renderDungeon() {
  dungeon.innerHTML = '';
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const tile = document.createElement('div');
      tile.className = 'dungeon-tile';
      tile.style.setProperty('--x', x);
      tile.style.setProperty('--y', y);
      if ((x + y) % 4 === 0) tile.classList.add('moss');
      if (obstacles.has(`${x},${y}`)) tile.classList.add('wall');
      dungeon.append(tile);
    }
  }

  if (!state.collected) {
    const gem = document.createElement('div');
    gem.className = 'dungeon-object gem';
    gem.style.setProperty('--x', target.x);
    gem.style.setProperty('--y', target.y);
    gem.innerHTML = '<i></i>';
    dungeon.append(gem);
  }

  const exit = document.createElement('div');
  exit.className = 'dungeon-object stairs';
  exit.style.setProperty('--x', 6);
  exit.style.setProperty('--y', 0);
  exit.innerHTML = '<i></i><i></i><i></i>';
  dungeon.append(exit);

  const hero = document.createElement('img');
  hero.className = 'dungeon-object dungeon-hero';
  hero.style.setProperty('--x', state.x);
  hero.style.setProperty('--y', state.y);
  hero.src = directions[state.direction].sprite;
  hero.alt = `${directions[state.direction].label}を向くフクロウ`;
  dungeon.append(hero);

  document.querySelector('#directionLabel').textContent = directions[state.direction].label;
  document.querySelector('#stepCount').textContent = state.steps;
  document.querySelector('#gemCount').textContent = state.collected;
}

function setOutput(mark, message, type = '') {
  output.className = type;
  output.innerHTML = `<span class="prompt">${mark}</span> ${message}`;
}

function execute(commandInfo) {
  const { command, line } = commandInfo;
  state.steps++;
  if (state.steps > MAX_STEPS) {
    setOutput('×', `${line}行目: ステップ数が上限を超えました`, 'error');
    return false;
  }

  if (command === 'move()') {
    const direction = directions[state.direction];
    const next = { x: state.x + direction.dx, y: state.y + direction.dy };
    const blocked = next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS || obstacles.has(`${next.x},${next.y}`);
    if (blocked) {
      setOutput('!', `${line}行目: 壁があって進めません`, 'warning');
    } else {
      state.x = next.x;
      state.y = next.y;
      setOutput('›', `${line}行目: move() を実行しました`);
    }
  }
  if (command === 'turnLeft()') {
    state.direction = (state.direction + 1) % 4;
    setOutput('›', `${line}行目: 左を向きました`);
  }
  if (command === 'turnRight()') {
    state.direction = (state.direction + 3) % 4;
    setOutput('›', `${line}行目: 右を向きました`);
  }
  if (command === 'collectGet()') {
    if (state.x === target.x && state.y === target.y) {
      state.collected = 1;
      setOutput('◆', `${line}行目: 灯を回収しました`, 'success');
      document.querySelector('#goalDot').classList.add('done');
      document.querySelector('#goalState').textContent = '達成';
      saveProgress(1);
      setTimeout(() => clearCard.classList.add('show'), 350);
    } else {
      setOutput('!', `${line}行目: ここには拾えるものがありません`, 'warning');
    }
  }
  renderDungeon();
  return true;
}

async function runAll() {
  if (running) return;
  const parsed = parseCode();
  if (parsed.errors.length) {
    const error = parsed.errors[0];
    setOutput('×', `${error.line}行目: 「${error.text}」は使えない命令です`, 'error');
    document.querySelector('#editorState').textContent = 'エラー';
    return;
  }
  resetState(false);
  parsedCommands = parsed.commands;
  running = true;
  document.querySelector('#runBtn').disabled = true;
  document.querySelector('#editorState').textContent = '実行中';
  for (let index = 0; index < parsedCommands.length; index++) {
    if (!execute(parsedCommands[index])) break;
    await new Promise(resolve => setTimeout(resolve, 480));
  }
  running = false;
  document.querySelector('#runBtn').disabled = false;
  document.querySelector('#editorState').textContent = state.collected ? 'クリア' : '実行完了';
  if (!state.collected) setOutput('›', '実行完了。まだ灯を回収できていません');
}

function runStep() {
  if (running) return;
  if (executionIndex === 0) {
    const parsed = parseCode();
    if (parsed.errors.length) {
      const error = parsed.errors[0];
      setOutput('×', `${error.line}行目: 「${error.text}」は使えない命令です`, 'error');
      return;
    }
    resetState(false);
    parsedCommands = parsed.commands;
  }
  if (executionIndex >= parsedCommands.length) {
    executionIndex = 0;
    setOutput('›', 'すべてのコードを実行しました');
    return;
  }
  execute(parsedCommands[executionIndex]);
  executionIndex++;
}

function updateLineNumbers() {
  const count = Math.max(12, editor.value.split('\n').length);
  lineNumbers.innerHTML = Array.from({ length: count }, (_, index) => index + 1).join('<br>');
  document.querySelector('#editorState').textContent = '編集中';
  executionIndex = 0;
}

document.querySelectorAll('[data-insert]').forEach(button => button.addEventListener('click', () => {
  const command = button.dataset.insert;
  const startPosition = editor.selectionStart;
  const before = editor.value.slice(0, startPosition);
  const after = editor.value.slice(editor.selectionEnd);
  const prefix = before && !before.endsWith('\n') ? '\n' : '';
  editor.value = `${before}${prefix}${command}\n${after}`;
  const cursor = startPosition + prefix.length + command.length + 1;
  editor.focus();
  editor.setSelectionRange(cursor, cursor);
  updateLineNumbers();
}));

document.querySelector('#referenceToggle').addEventListener('click', event => {
  const open = event.currentTarget.getAttribute('aria-expanded') === 'true';
  event.currentTarget.setAttribute('aria-expanded', String(!open));
  event.currentTarget.querySelector('b').textContent = open ? '+' : '−';
  document.querySelector('#referenceBody').hidden = open;
});
document.querySelector('#runBtn').addEventListener('click', runAll);
document.querySelector('#stepBtn').addEventListener('click', runStep);
document.querySelector('#resetBtn').addEventListener('click', () => resetState());
document.querySelector('#againBtn').addEventListener('click', () => resetState());
document.querySelector('#clearOutput').addEventListener('click', () => setOutput('›', '出力を消去しました'));
document.querySelector('#birdNameTitle').textContent = GAME.birdName;
document.querySelector('#startAdventure').addEventListener('click', () => document.querySelector('#titleScreen').classList.add('hidden'));
document.querySelector('#openRecords').addEventListener('click', () => { renderCurriculum(); document.querySelector('#recordsModal').classList.add('show'); document.querySelector('#recordsModal').setAttribute('aria-hidden', 'false'); });
document.querySelector('#closeRecords').addEventListener('click', () => { document.querySelector('#recordsModal').classList.remove('show'); document.querySelector('#recordsModal').setAttribute('aria-hidden', 'true'); });
editor.addEventListener('input', updateLineNumbers);
editor.addEventListener('scroll', () => { lineNumbers.scrollTop = editor.scrollTop; });
editor.addEventListener('keydown', event => {
  if (event.key === 'Tab') {
    event.preventDefault();
    const startPosition = editor.selectionStart;
    editor.value = `${editor.value.slice(0, startPosition)}    ${editor.value.slice(editor.selectionEnd)}`;
    editor.setSelectionRange(startPosition + 4, startPosition + 4);
  }
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    runAll();
  }
});

updateLineNumbers();
renderCurriculum();
resetState(false);
