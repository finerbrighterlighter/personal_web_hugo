/*
=================================================================
Terminal-style author reveal + seamless about page transition
=================================================================

WHAT THIS FILE DOES
-------------------
Handles the [Me] footer link. Clicking it runs a terminal-style
animation in the sidebar, then loads the about page content into
the current page without a full browser reload.

ANIMATION SEQUENCE
------------------
1.  Clear the author name and job title (keep layout space)
2.  Scroll the avatar panel into view
3.  Type "whoami" into the name slot
4.  Pause (simulates a command executing)
5.  Run the scan animation over the avatar
6.  Type the real name back
7.  Type the real job title back
8.  Fetch /about/ in the background
9.  Fade out the main content area
10. Swap in the about page content
11. Update the browser URL to /about/ (no reload)

WHY NO PAGE RELOAD
------------------
Normally, navigating to /about/ triggers a full browser reload:
the sidebar disappears, the typing animation stops, all panel
state is lost. Instead, we:

  fetch()             Download /about/ HTML as a string
  DOMParser           Parse that string into a queryable document
  innerHTML swap      Replace only the <main> content area
  history.pushState   Update the URL bar to /about/ silently

The result: the user arrives at /about/ with the sidebar still
alive, the typing still running, and no jarring flash.

BACK BUTTON
-----------
history.pushState adds /about/ to the browser history stack.
When the user presses back, the browser fires a "popstate"
event. We reload the page at that point to restore the correct
content for the previous URL.
=================================================================
*/


/* ---------------------------------------------------------------
   typeText
   ---------------------------------------------------------------
   Types a string character-by-character into a DOM element.

   element   DOM node to type into (its existing content is cleared)
   text      The string to type
   speed     Milliseconds between each character (default 40ms)
   callback  Optional function called when typing is complete
--------------------------------------------------------------- */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function typeText(element, text, speed = 40, callback = null) {

  element.textContent = "";
  element.classList.add("terminal-prompt"); // shows blinking cursor

  let i = 0;

  function type() {
    if (i < text.length) {
      element.textContent += text[i++];
      setTimeout(type, speed);
    } else {
      element.classList.remove("terminal-prompt");
      if (callback) callback();
    }
  }

  type();
}


/* ---------------------------------------------------------------
   delay
   ---------------------------------------------------------------
   Returns a Promise that resolves after `ms` milliseconds.

   This lets us write pauses as:
     await delay(400);
   instead of nesting setTimeout callbacks. It only works inside
   an async function (one declared with the `async` keyword).
--------------------------------------------------------------- */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/* ---------------------------------------------------------------
   transitionToAbout
   ---------------------------------------------------------------
   Fetches /about/ and injects its content into the current page.
   Called at the end of the animation sequence.

   Declared `async` so we can use `await` to pause at each step
   without nested callbacks.

   If anything fails (network error, unexpected page structure),
   it falls back to a normal navigation — the user always reaches
   /about/ one way or another.
--------------------------------------------------------------- */
/* Language-aware about URL: /mm/about/ on the Burmese site, /about/ otherwise */
const _langPrefix = window.location.pathname.startsWith('/mm/') ? '/mm' : '';
const _aboutURL   = _langPrefix + '/about/';

async function transitionToAbout() {

  const currentMain = document.querySelector('main.main-content');
  if (!currentMain) return;

  try {

    /* ----------------------------------------------------------
       Step 1: Download the about page HTML (language-aware)
       ---------------------------------------------------------- */
    const response = await fetch(_aboutURL);

    if (!response.ok) throw new Error(`fetch failed: ${response.status}`);

    /* response.text() reads the response body as a plain string */
    const html = await response.text();


    /* ----------------------------------------------------------
       Step 2: Parse the HTML into a queryable document
       ----------------------------------------------------------
       DOMParser converts a raw HTML string into a document object
       we can query with querySelector, just like the live page.
       The parsed document is separate from the current page —
       nothing visible changes yet.
       ---------------------------------------------------------- */
    const parser  = new DOMParser();
    const fetched = parser.parseFromString(html, 'text/html');


    /* ----------------------------------------------------------
       Step 3: Extract only the main content area
       ----------------------------------------------------------
       We don't want the sidebar, panels, or scripts from the
       fetched page — those are already running. We only need
       what sits inside <main class="main-content">.
       ---------------------------------------------------------- */
    const newMain = fetched.querySelector('main.main-content');
    if (!newMain) throw new Error('main.main-content not found in fetched page');


    /* ----------------------------------------------------------
       Step 4: Fade out the current main content
       ----------------------------------------------------------
       Setting opacity to 0 via a CSS transition makes the
       current content disappear smoothly over 350ms.
       We await the delay so the fade completes before swapping.
       ---------------------------------------------------------- */
    currentMain.style.transition = 'opacity 0.35s ease';
    currentMain.style.opacity    = '0';
    await delay(350);


    /* ----------------------------------------------------------
       Step 5: Swap the content
       ----------------------------------------------------------
       innerHTML replaces everything inside the current <main>
       with the about page content. At this point opacity is
       still 0 so the user sees nothing yet.
       ---------------------------------------------------------- */
    currentMain.innerHTML = newMain.innerHTML;


    /* ----------------------------------------------------------
       Step 5b: Move focus into the new content
       ----------------------------------------------------------
       After swapping innerHTML, the previously focused element
       (the [Me] footer link) is gone. Move focus to #main-content
       so screen readers and keyboard users land in the new page.
       ---------------------------------------------------------- */
    currentMain.setAttribute('tabindex', '-1');
    currentMain.focus({ preventScroll: true });


    /* ----------------------------------------------------------
       Step 6: Update the browser URL
       ----------------------------------------------------------
       history.pushState updates the URL bar to /about/ and adds
       an entry to the browser's history stack (so the back button
       works). It does NOT trigger any navigation or page load.

       Three arguments are required by the browser API:
         {} → state object (we don't use it, but it's required)
         '' → title hint (ignored by almost all browsers)
         '/about/' → the URL to display
       ---------------------------------------------------------- */
    history.pushState({}, '', _aboutURL);


    /* ----------------------------------------------------------
       Step 7: Update the page title
       ----------------------------------------------------------
       The browser tab still shows the old page title. Replacing
       it with the fetched page's title keeps things consistent.
       ---------------------------------------------------------- */
    document.title = fetched.title;


    /* ----------------------------------------------------------
       Step 8: Scroll and fade in
       ----------------------------------------------------------
       Scroll to the top of the main area, then restore opacity
       so the about content fades in smoothly.
       ---------------------------------------------------------- */
    currentMain.scrollIntoView({ block: 'start', behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
    currentMain.style.opacity = '1';


  } catch (err) {

    /* ----------------------------------------------------------
       Fallback: normal navigation
       ----------------------------------------------------------
       If fetch failed (offline, server error, unexpected HTML),
       fall back to a hard navigation. The user still reaches
       /about/ — just without the smooth transition.
       ---------------------------------------------------------- */
    console.warn('footer_roll: smooth transition failed, falling back.', err);
    window.location.href = _aboutURL;

  }
}


/* ---------------------------------------------------------------
   Back button support
   ---------------------------------------------------------------
   history.pushState adds /about/ to the browser history stack.
   When the user presses back, the URL reverts to the previous
   page but the DOM still contains the about page content we
   injected. A reload restores the correct content for that URL.

   Guard: ignore hash-only navigation (anchor links / TOC clicks).
   Those also fire popstate on pages where pushState was previously
   called, but they don't need a reload — the browser handles
   scrolling itself.
--------------------------------------------------------------- */
window.addEventListener('popstate', (e) => {
  if (window.location.hash) return;   // hash anchor nav — let browser scroll
  window.location.reload();
});


/* ---------------------------------------------------------------
   Main click handler
   ---------------------------------------------------------------
   Attached to the [Me] footer link (.author-link).
   Runs the full animation sequence, then calls transitionToAbout.
--------------------------------------------------------------- */
document.querySelector('.author-link').addEventListener('click', function (e) {

  e.preventDefault();

  const avatar = document.getElementById('avatar');
  if (!avatar) return;

  const nameEl = document.getElementById('author-name');
  const roleEl = document.getElementById('job-title');

  /* Preserve original text so the animation can run more than once */
  const nameText = nameEl.dataset.original || nameEl.textContent.trim();
  const roleText = roleEl.dataset.original || roleEl.textContent.trim();

  nameEl.dataset.original = nameText;
  roleEl.dataset.original = roleText;

  /* Clear text while keeping layout space (prevents elements jumping) */
  nameEl.innerHTML = '&nbsp;';
  roleEl.innerHTML = '&nbsp;';

  /* Expand the sidebar panel if it is collapsed */
  const panel = avatar.closest('.terminal-window');
  if (panel && panel.classList.contains('collapsed')) {
    panel.classList.remove('collapsed');
  }

  /* Scroll avatar into view */
  avatar.scrollIntoView({ block: 'center', behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });

  const wrapper = avatar.closest('.avatar-wrapper');


  /* STEP 1 — Type "whoami" (delayed to let scrolling begin first) */
  setTimeout(() => {

    typeText(nameEl, 'whoami', 60, () => {

      /* STEP 2 — Processing pause */
      setTimeout(() => {

        nameEl.innerHTML = '&nbsp;';

        /* STEP 3 — Scan animation (skipped under reduced motion) */
        if (!prefersReducedMotion.matches) {
          wrapper.classList.remove('scan');
          void wrapper.offsetWidth; // forces browser to restart the CSS animation
          wrapper.classList.add('scan');
        }

        /* STEP 4 — After scan, type real name and role */
        const afterScan = () => {
          if (!prefersReducedMotion.matches) {
            wrapper.classList.remove('scan');
          }

          typeText(nameEl, nameText, 45, () => {

            setTimeout(() => {

              typeText(roleEl, roleText, 30, async () => {

                /* Already on about page — skip transition */
                if (window.location.pathname.startsWith(_langPrefix + '/about')) return;

                /* STEP 5 — Brief pause, then load about page content */
                await delay(600);
                transitionToAbout();

              });

            }, 200);

          });
        };

        if (prefersReducedMotion.matches) {
          afterScan();
        } else {
          setTimeout(afterScan, 3500); // scan duration in ms
        }

      }, 450); // thinking pause in ms

    });

  }, 600); // initial scroll delay in ms

});
