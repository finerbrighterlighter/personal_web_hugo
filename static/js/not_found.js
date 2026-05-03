const hist    = document.getElementById('nf-history');
const active  = document.getElementById('nf-active');
const inputEl = document.getElementById('nf-input');

const rawPath = window.location.pathname;
const slug    = rawPath.replace(/\/+$/, '').split('/').filter(Boolean).pop() || '404';
const dPath   = rawPath.length > 36 ? rawPath.slice(0, 33) + '...' : rawPath;

const SEQ = [
  { t: 'cmd',   text: `ls .${dPath}` },
  { t: 'pause', ms: 380 },
  { t: 'out',   text: `ls: cannot access '.${dPath}': No such file or directory`, cls: 'err' },
  { t: 'blank' },
  { t: 'cmd',   text: `git log --oneline --grep="${slug}"` },
  { t: 'pause', ms: 560 },
  { t: 'out',   text: '(no commits)' },
  { t: 'blank' },
  { t: 'cmd',   text: 'duck --locate-page --verbose' },
  { t: 'pause', ms: 400 },
  { t: 'out',   text: '🦆  checking cache...' },
  { t: 'pause', ms: 680 },
  { t: 'out',   text: '🦆  checking archives...' },
  { t: 'pause', ms: 820 },
  { t: 'out',   text: '🦆  asking nicely...' },
  { t: 'pause', ms: 960 },
  { t: 'out',   text: '🦆  ......' },
  { t: 'pause', ms: 720 },
  { t: 'out',   text: '🦆  quack.' },
  { t: 'pause', ms: 460 },
  { t: 'out',   text: '[ERR]  exit 404: page not found.', cls: 'err' },
  { t: 'done' },
];

let idx = 0;

function addLine(text, cls) {
  const el = document.createElement('span');
  el.className = `nf-line nf-line-${cls || 'out'}`;
  el.textContent = text;
  hist.appendChild(el);
}

function addBlank() {
  const el = document.createElement('span');
  el.className = 'nf-blank';
  hist.appendChild(el);
}

function typeCmd(text, done) {
  inputEl.textContent = '';
  let j = 0;
  function tick() {
    if (j < text.length) {
      inputEl.textContent += text[j++];
      setTimeout(tick, 28 + Math.random() * 22);
    } else {
      done();
    }
  }
  tick();
}

function next() {
  if (idx >= SEQ.length) return;
  const s = SEQ[idx++];

  if (s.t === 'cmd') {
    typeCmd(s.text, () => {
      setTimeout(() => {
        addLine(s.text, 'cmd');
        inputEl.textContent = '';
        next();
      }, 100);
    });
  } else if (s.t === 'out') {
    addLine(s.text, s.cls || 'out');
    setTimeout(next, 75);
  } else if (s.t === 'blank') {
    addBlank();
    setTimeout(next, 30);
  } else if (s.t === 'pause') {
    setTimeout(next, s.ms);
  } else if (s.t === 'done') {
    active.style.display = 'none';
  }
}

setTimeout(next, 650);
