const STORAGE_KEY = 'mmFontMode';
const CLEAR_MODE = 'clear';

const root = document.documentElement;
const button = document.querySelector('[data-mm-font-toggle]');

function isClearMode() {
  return root.dataset.mmFont === CLEAR_MODE;
}

function updateButton() {
  if (!button) return;
  const clear = isClearMode();
  button.textContent = clear ? '[font: messy]' : '[font: neat]';
  button.setAttribute('aria-pressed', String(clear));
  button.setAttribute('aria-label', clear ? 'Use messy Burmese handwriting' : 'Use neat Burmese handwriting');
}

if (button) {
  updateButton();

  button.addEventListener('click', () => {
    const nextMode = isClearMode() ? '' : CLEAR_MODE;

    if (nextMode) {
      root.dataset.mmFont = nextMode;
    } else {
      delete root.dataset.mmFont;
    }

    try {
      if (nextMode) {
        localStorage.setItem(STORAGE_KEY, nextMode);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {}

    updateButton();
  });
}
