const editor = document.querySelector('#codeEditor');
const dungeon = document.querySelector('#dungeon');
const output = document.querySelector('#output');
const lineNumbers = document.querySelector('#lineNumbers');
const clearCard = document.querySelector('#clearCard');
const GAME = { birdName: 'フォっくん', storageKey: 'code-dungeon-progress-v1' };
const curriculum = [
  { floor: 1, title: '灯火の回廊', topic: '基本命令とaction', syntax: 'move() / action()' },
  { floor: 2, title: '反復の石廊', topic: '同じ処理を繰り返す', syntax: 'for _ in range(3):' },
  { floor: 3, title: '言霊の扉', topic: '文字列を扉へ出力する', syntax: 'print("合言葉")' },
  { floor: 4, title: '問いかけの門', topic: '入力を変数に保存する', syntax: 'answer = input("質問")' },
  { floor: 5, title: '魔物の回廊', topic: '敵と同族で行動を変える', syntax: 'if isEnemy():' }
];

const testAnswers = [
  { floor: 1, label: '灯火の回廊・完全回答', ready: true, code: `move()
move()
turnLeft()
move()
move()
turnLeft()
move()
move()
turnRight()
move()
action()
move()
move()
move()
move()
move()
turnRight()
move()
action()` },
  { floor: 2, label: '反復の石廊・完全回答', ready: true, code: `for _ in range(4):
    move()
turnRight()
for _ in range(3):
    move()
action()
turnLeft()
for _ in range(2):
    move()
action()` },
  { floor: 3, label: '言霊の扉・完全回答', ready: true, code: `for _ in range(3):
    move()
print("小さな羽根")
for _ in range(3):
    move()
action()` },
  { floor: 4, label: '問いかけの門・完全回答', ready: true, code: `for _ in range(3):
    move()
password = input("合言葉：")
turnRight()
for _ in range(3):
    move()
print(password)
turnLeft()
for _ in range(3):
    move()
action()` },
  { floor: 5, label: '魔物の回廊・完全回答', ready: true, code: `for _ in range(3):
    move()
    if isEnemy():
        attack()
    else:
        greet()
move()
action()` }
];

const COLS = 8;
const ROWS = 10;
const levels = {
  1: { title: '灯火の回廊', mission: '迷宮の灯を回収せよ', description: '基本命令とaction()を使い、灯を拾って階段を降りよう。', start: { x: 5, y: 8, direction: 1 }, target: { x: 5, y: 5 }, exit: { x: 6, y: 0 }, maxSteps: 20, obstacles: ['1,1','3,1','0,3','6,3','2,4','3,4','1,6','3,6','6,7'], starter: '# 灯を回収して階段を降りよう\nmove()\nmove()', goal: '灯を回収して階段を降りる' },
  2: { title: '反復の石廊', mission: '反復で石廊を抜けよ', description: 'move()の連打をforに置き換え、長い通路を攻略しよう。', start: { x: 1, y: 8, direction: 2 }, target: { x: 4, y: 4 }, exit: { x: 4, y: 2 }, maxSteps: 20, obstacles: ['0,2','2,2','6,2','6,3','2,5','6,5','2,6','4,7','6,8'], starter: '# 同じ命令は for で繰り返そう\nfor _ in range(4):\n    move()', goal: 'forを使って灯を回収する' },
  3: { title: '言霊の扉', mission: '言霊を扉へ出力せよ', description: '扉の前で正しい文字列をprint()し、封印を解こう。', start: { x: 3, y: 8, direction: 2 }, exit: { x: 3, y: 2 }, door: { x: 3, y: 5, password: '小さな羽根' }, maxSteps: 20, obstacles: ['1,2','5,2','1,4','5,4','1,6','5,6','1,8','5,8'], starter: '# 扉の前で合言葉を出力しよう\nfor _ in range(3):\n    move()', goal: 'print()で言霊の扉を開く' },
  4: { title: '問いかけの門', mission: '門番の言葉を届けよ', description: 'input()で受け取った言葉を変数へ保存し、扉へprint()しよう。', start: { x: 1, y: 8, direction: 2 }, exit: { x: 4, y: 2 }, npc: { x: 1, y: 5, answer: '月影' }, door: { x: 4, y: 5, password: '月影' }, maxSteps: 25, obstacles: ['0,3','2,3','6,3','0,7','6,7'], starter: '# 門番の問いに答え、変数へ保存しよう\nfor _ in range(3):\n    move()', goal: 'input()の答えを扉へ出力する' },
  5: { title: '魔物の回廊', mission: '敵と同族を見極めよ', description: 'isEnemy()で判定し、敵には攻撃、同族には挨拶しよう。', start: { x: 3, y: 8, direction: 2 }, exit: { x: 3, y: 4 }, mobs: [{ x: 3, y: 7, type: 'enemy' },{ x: 3, y: 6, type: 'ally' },{ x: 3, y: 5, type: 'enemy' }], maxSteps: 30, obstacles: ['1,4','5,4','1,6','5,6','1,8','5,8'], starter: '# 敵なら攻撃、同族なら挨拶しよう\nfor _ in range(3):\n    move()', goal: 'ifで3体のMOBに対応する' }
};
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
let currentFloor = 1;
let enemySprites = {};

function level() { return levels[currentFloor]; }

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
    const playable = Boolean(levels[item.floor]);
    return `<article data-floor="${item.floor}" class="floor-card ${cleared ? 'cleared' : ''} ${unlocked && playable ? 'selectable' : 'locked'}"><span>FLOOR ${String(item.floor).padStart(2, '0')}</span><div><strong>${item.title}</strong><small>${item.topic}</small><code>${item.syntax}</code></div><b>${cleared ? '✓ CLEAR' : unlocked && playable ? '挑戦可能' : '🔒'}</b></article>`;
  }).join('');
  document.querySelectorAll('.floor-card.selectable').forEach(card => card.addEventListener('click', () => selectFloor(Number(card.dataset.floor))));
}

function selectFloor(floor) {
  if (!levels[floor]) return;
  const progress = loadProgress();
  if (floor > 1 && !progress.cleared.includes(floor - 1)) return;
  currentFloor = floor;
  document.querySelector('.chapter small').textContent = `CHAPTER ${String(floor).padStart(2, '0')}`;
  document.querySelector('.chapter strong').textContent = level().title;
  document.querySelector('#loopReference').hidden = floor < 2;
  document.querySelector('#printReference').hidden = floor < 3;
  document.querySelector('#inputReference').hidden = floor < 4;
  document.querySelector('#ifReference').hidden = floor < 5;
  document.querySelector('#missionTitle').textContent = level().mission;
  document.querySelector('#missionDescription').textContent = level().description;
  document.querySelector('#goalState').previousElementSibling.textContent = level().goal;
  editor.value = level().starter;
  document.querySelector('#recordsModal').classList.remove('show');
  document.querySelector('#recordsModal').setAttribute('aria-hidden', 'true');
  document.querySelector('#titleScreen').classList.add('hidden');
  updateLineNumbers();
  resetState();
}

function renderTestAnswers() {
  const answerList = document.querySelector('#answerList');
  answerList.innerHTML = testAnswers.map((answer, index) => `
    <article class="answer-card">
      <div><strong>FLOOR ${String(answer.floor).padStart(2, '0')}　${answer.label}</strong><small>${answer.ready ? '現在のゲームで動作確認済み' : '階層実装後の確認用'}</small></div>
      <pre><code>${answer.code}</code></pre>
      <button type="button" data-answer-index="${index}">コピー</button>
    </article>`).join('');
  answerList.querySelectorAll('[data-answer-index]').forEach(button => {
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(testAnswers[Number(button.dataset.answerIndex)].code);
      button.textContent = 'コピーしました';
      setTimeout(() => { button.textContent = 'コピー'; }, 1200);
    });
  });
}

function resetState(showMessage = true) {
  state = { ...level().start, collected: 0, cleared: false, doorOpen: false, steps: 0, variables: {}, resolvedMobs: [] };
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
  const valid = new Set(['move()', 'turnLeft()', 'turnRight()', 'collectGet()', 'goDown()', 'action()', 'attack()', 'greet()']);
  const errors = [];
  const lines = editor.value.split('\n').map(raw => raw.replace(/\t/g, '    '));

  function parseBlock(startIndex, indent) {
    const commands = [];
    let index = startIndex;
    while (index < lines.length) {
      const raw = lines[index];
      const text = raw.trim();
      if (!text || text.startsWith('#')) { index++; continue; }
      const spaces = raw.length - raw.trimStart().length;
      if (spaces < indent || (indent > 0 && spaces === indent - 4 && text === 'else:')) break;
      if (spaces > indent) { errors.push({ line: index + 1, text: 'インデントが多すぎます' }); index++; continue; }

      const loop = text.match(/^for\s+_\s+in\s+range\((\d+)\):$/);
      if (loop) {
        if (currentFloor < 2) errors.push({ line: index + 1, text: 'for は第2階層で解放されます' });
        const parsed = parseBlock(index + 1, indent + 4);
        const repeat = Number(loop[1]);
        if (!parsed.commands.length) errors.push({ line: index + 1, text: 'for の中にインデントした命令が必要です' });
        if (repeat < 1 || repeat > 10) errors.push({ line: index + 1, text: 'range() は1〜10にしてください' });
        else for (let count = 0; count < repeat; count++) commands.push(...parsed.commands);
        index = parsed.index;
        continue;
      }

      if (text === 'if isEnemy():') {
        if (currentFloor < 5) errors.push({ line: index + 1, text: 'if は第5階層で解放されます' });
        const thenBlock = parseBlock(index + 1, indent + 4);
        index = thenBlock.index;
        let elseCommands = [];
        if (index < lines.length && lines[index].trim() === 'else:' && lines[index].length - lines[index].trimStart().length === indent) {
          const elseBlock = parseBlock(index + 1, indent + 4);
          elseCommands = elseBlock.commands;
          index = elseBlock.index;
        } else errors.push({ line: index + 1, text: 'if に対応する else: が必要です' });
        commands.push({ command: 'conditional', line: startIndex + 1, thenCommands: thenBlock.commands, elseCommands });
        continue;
      }

      const input = text.match(/^([A-Za-z_]\w*)\s*=\s*input\((['"])(.*?)\2\)$/);
      if (input && currentFloor < 4) errors.push({ line: index + 1, text: 'input は第4階層で解放されます' });
      if (input) { commands.push({ command: 'input', variable: input[1], prompt: input[3], line: index + 1 }); index++; continue; }
      const print = text.match(/^print\((.+)\)$/);
      if (print && currentFloor < 3) errors.push({ line: index + 1, text: 'print は第3階層で解放されます' });
      if (print) { commands.push({ command: 'print', value: print[1].trim(), line: index + 1 }); index++; continue; }
      if (valid.has(text)) commands.push({ command: text, line: index + 1 });
      else errors.push({ line: index + 1, text });
      index++;
    }
    return { commands, index };
  }
  return { commands: parseBlock(0, 0).commands, errors };
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
      if (level().obstacles.includes(`${x},${y}`)) tile.classList.add('wall');
      dungeon.append(tile);
    }
  }

  if (level().target && !state.collected) {
    const gem = document.createElement('div');
    gem.className = 'dungeon-object gem';
    gem.style.setProperty('--x', level().target.x);
    gem.style.setProperty('--y', level().target.y);
    gem.innerHTML = '<i></i>';
    dungeon.append(gem);
  }

  const stairs = document.createElement('div');
  stairs.className = 'dungeon-object stairs';
  stairs.style.setProperty('--x', level().exit.x);
  stairs.style.setProperty('--y', level().exit.y);
  stairs.innerHTML = '<i></i><i></i><i></i>';
  dungeon.append(stairs);

  if (level().door && !state.doorOpen) {
    const door = document.createElement('div');
    door.className = 'dungeon-object password-door';
    door.style.setProperty('--x', level().door.x);
    door.style.setProperty('--y', level().door.y);
    door.textContent = '⌨';
    dungeon.append(door);
  }

  if (level().npc) {
    const npc = document.createElement('img');
    npc.className = 'dungeon-object dungeon-mob';
    npc.style.setProperty('--x', level().npc.x);
    npc.style.setProperty('--y', level().npc.y);
    npc.src = 'assets/mob/ally/down.png';
    npc.alt = '門番のフクロウ';
    dungeon.append(npc);
  }

  (level().mobs || []).forEach((mob, index) => {
    if (state.resolvedMobs.includes(index)) return;
    const image = document.createElement('img');
    image.className = `dungeon-object dungeon-mob ${mob.type}`;
    image.style.setProperty('--x', mob.x);
    image.style.setProperty('--y', mob.y);
    image.src = mob.type === 'ally' ? 'assets/mob/ally/down.png' : (enemySprites.down || 'assets/mob/enemy/sheet-chroma.png');
    image.alt = mob.type === 'ally' ? '同族のフクロウ' : '敵のフクロウ';
    dungeon.append(image);
  });

  const hero = document.createElement('img');
  hero.className = 'dungeon-object dungeon-hero';
  hero.style.setProperty('--x', state.x);
  hero.style.setProperty('--y', state.y);
  hero.src = directions[state.direction].sprite;
  hero.alt = `${directions[state.direction].label}を向くフクロウ`;
  dungeon.append(hero);

  document.querySelector('#directionLabel').textContent = directions[state.direction].label;
  document.querySelector('#stepCount').textContent = state.steps;
  document.querySelector('#maxStepCount').textContent = level().maxSteps;
  if (level().target) {
    document.querySelector('#statLabel').textContent = '回収した灯';
    document.querySelector('#statValue').textContent = `◆ ${state.collected} / 1`;
  } else if (level().mobs) {
    document.querySelector('#statLabel').textContent = '対応したMOB';
    document.querySelector('#statValue').textContent = `${state.resolvedMobs.length} / ${level().mobs.length}`;
  } else {
    document.querySelector('#statLabel').textContent = '言霊の扉';
    document.querySelector('#statValue').textContent = state.doorOpen ? 'OPEN' : 'LOCKED';
  }
}

function setOutput(mark, message, type = '') {
  output.className = type;
  output.innerHTML = `<span class="prompt">${mark}</span> ${message}`;
}

async function execute(commandInfo) {
  const { command, line } = commandInfo;
  if (command === 'conditional') {
    const mobIndex = (level().mobs || []).findIndex(mob => mob.x === state.x && mob.y === state.y);
    const isEnemy = mobIndex >= 0 && level().mobs[mobIndex].type === 'enemy';
    const branch = isEnemy ? commandInfo.thenCommands : commandInfo.elseCommands;
    for (const nested of branch) if (!await execute(nested)) return false;
    return true;
  }
  state.steps++;
  if (state.steps > level().maxSteps) {
    setOutput('×', `${line}行目: ステップ数が上限を超えました`, 'error');
    return false;
  }

  if (command === 'move()') {
    const standingMob = (level().mobs || []).findIndex((mob, index) => mob.x === state.x && mob.y === state.y && !state.resolvedMobs.includes(index));
    if (standingMob >= 0) {
      setOutput('!', `${line}行目: 目の前のMOBに対応しないと進めません`, 'warning');
      renderDungeon();
      return false;
    }
    const direction = directions[state.direction];
    const next = { x: state.x + direction.dx, y: state.y + direction.dy };
    const blocked = next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS || level().obstacles.includes(`${next.x},${next.y}`);
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
    if (level().target && state.x === level().target.x && state.y === level().target.y) {
      state.collected = 1;
      setOutput('◆', `${line}行目: 灯を回収しました`, 'success');
      document.querySelector('#goalDot').classList.add('done');
      document.querySelector('#goalState').textContent = '階段へ';
    } else {
      setOutput('!', `${line}行目: ここには拾えるものがありません`, 'warning');
    }
  }
  if (command === 'action()') {
    if (level().target && state.x === level().target.x && state.y === level().target.y && !state.collected) {
      state.collected = 1;
      setOutput('◆', `${line}行目: 灯を回収しました`, 'success');
      document.querySelector('#goalDot').classList.add('done');
      document.querySelector('#goalState').textContent = '階段へ';
    } else if (state.x === level().exit.x && state.y === level().exit.y && (!level().target || state.collected) && (!level().door || state.doorOpen) && (!level().mobs || state.resolvedMobs.length === level().mobs.length)) {
      state.cleared = true;
      setOutput('✓', `${line}行目: 階段を降りました`, 'success');
      document.querySelector('#goalState').textContent = '達成';
      saveProgress(currentFloor);
      document.querySelector('#againBtn').textContent = currentFloor < Object.keys(levels).length ? '次の階層へ' : 'もう一度挑戦';
      setTimeout(() => clearCard.classList.add('show'), 350);
    } else if (level().npc && state.x === level().npc.x && state.y === level().npc.y) {
      setOutput('›', `門番「合言葉を入力して、扉へ出力してみろ」`);
    } else {
      setOutput('!', `${line}行目: ここには操作できるものがありません`, 'warning');
    }
  }
  if (command === 'input') {
    if (!level().npc || state.x !== level().npc.x || state.y !== level().npc.y) {
      setOutput('!', `${line}行目: 今は入力を求めているMOBがいません`, 'warning');
    } else {
      state.variables[commandInfo.variable] = await requestInput(commandInfo.prompt, level().npc.answer);
      setOutput('›', `${commandInfo.variable} に入力した文字列を保存しました`);
    }
  }
  if (command === 'print') {
    let value = commandInfo.value;
    const quoted = value.match(/^(['"])(.*)\1$/);
    if (quoted) value = quoted[2];
    else if (Object.hasOwn(state.variables, value)) value = state.variables[value];
    else { setOutput('×', `${line}行目: ${value} という変数が見つかりません`, 'error'); renderDungeon(); return false; }
    setOutput('›', String(value));
    if (level().door && state.x === level().door.x && state.y === level().door.y) {
      if (String(value) === level().door.password) {
        state.doorOpen = true;
        document.querySelector('#goalDot').classList.add('done');
        document.querySelector('#goalState').textContent = '階段へ';
        setOutput('✓', `${value} ― 言霊の扉が開きました`, 'success');
      } else setOutput('!', `${value} ― 扉は反応しません`, 'warning');
    }
  }
  if (command === 'attack()' || command === 'greet()') {
    const mobIndex = (level().mobs || []).findIndex(mob => mob.x === state.x && mob.y === state.y);
    if (mobIndex < 0 || state.resolvedMobs.includes(mobIndex)) {
      setOutput('!', `${line}行目: ここには対応するMOBがいません`, 'warning');
    } else {
      const mob = level().mobs[mobIndex];
      const correct = (mob.type === 'enemy' && command === 'attack()') || (mob.type === 'ally' && command === 'greet()');
      if (!correct) {
        setOutput('×', mob.type === 'enemy' ? '敵に挨拶して攻撃されました' : '同族を攻撃してしまいました', 'error');
        renderDungeon();
        return false;
      }
      state.resolvedMobs.push(mobIndex);
      setOutput('✓', mob.type === 'enemy' ? '敵を倒しました' : '同族に挨拶しました', 'success');
    }
  }
  if (command === 'goDown()') {
    if (state.x !== level().exit.x || state.y !== level().exit.y) {
      setOutput('!', `${line}行目: ここには下り階段がありません`, 'warning');
    } else if (!state.collected) {
      setOutput('!', `${line}行目: 灯を回収してから階段を降りよう`, 'warning');
    } else {
      state.cleared = true;
      setOutput('✓', `${line}行目: 階段を降りました`, 'success');
      document.querySelector('#goalState').textContent = '達成';
      saveProgress(currentFloor);
      document.querySelector('#againBtn').textContent = currentFloor === 1 ? '次の階層へ' : 'もう一度挑戦';
      setTimeout(() => clearCard.classList.add('show'), 350);
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
    if (!await execute(parsedCommands[index])) break;
    await new Promise(resolve => setTimeout(resolve, 480));
  }
  running = false;
  document.querySelector('#runBtn').disabled = false;
  document.querySelector('#editorState').textContent = state.cleared ? 'クリア' : '実行完了';
  if (!state.cleared) setOutput('›', state.collected ? '灯を回収しました。階段へ進んで goDown() を実行しよう' : '実行完了。まだ灯を回収できていません');
}

async function runStep() {
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
  await execute(parsedCommands[executionIndex]);
  executionIndex++;
}

function updateLineNumbers() {
  const count = Math.max(12, editor.value.split('\n').length);
  lineNumbers.innerHTML = Array.from({ length: count }, (_, index) => index + 1).join('<br>');
  document.querySelector('#editorState').textContent = '編集中';
  executionIndex = 0;
}

function requestInput(prompt, hint) {
  return new Promise(resolve => {
    const panel = document.querySelector('#inputPanel');
    const field = document.querySelector('#gameInput');
    document.querySelector('#inputPrompt').textContent = `門番「合言葉は ${hint} だ」`;
    document.querySelector('#inputLabel').textContent = prompt;
    field.value = '';
    panel.classList.add('show');
    field.focus();
    const submit = () => {
      panel.classList.remove('show');
      document.querySelector('#inputSubmit').removeEventListener('click', submit);
      field.removeEventListener('keydown', onKey);
      resolve(field.value);
    };
    const onKey = event => { if (event.key === 'Enter') submit(); };
    document.querySelector('#inputSubmit').addEventListener('click', submit);
    field.addEventListener('keydown', onKey);
  });
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
document.querySelector('#againBtn').addEventListener('click', () => currentFloor < Object.keys(levels).length && loadProgress().cleared.includes(currentFloor) ? selectFloor(currentFloor + 1) : resetState());
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

function prepareEnemySprites() {
  const source = new Image();
  source.onload = () => {
    const size = Math.floor(source.width / 2);
    const views = { down: [0, 0], up: [1, 0], left: [0, 1], right: [1, 1] };
    Object.entries(views).forEach(([name, [column, row]]) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(source, column * size, row * size, size, size, 0, 0, size, size);
      const pixels = context.getImageData(0, 0, size, size);
      for (let index = 0; index < pixels.data.length; index += 4) {
        const red = pixels.data[index];
        const green = pixels.data[index + 1];
        const blue = pixels.data[index + 2];
        if (green > 150 && green > red * 1.7 && green > blue * 1.7) pixels.data[index + 3] = 0;
      }
      context.putImageData(pixels, 0, 0);
      enemySprites[name] = canvas.toDataURL('image/png');
    });
    renderDungeon();
  };
  source.src = 'assets/mob/enemy/sheet-chroma.png';
}

updateLineNumbers();
renderCurriculum();
renderTestAnswers();
resetState(false);
prepareEnemySprites();
