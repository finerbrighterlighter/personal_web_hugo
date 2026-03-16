/*
---------------------------------------------------------
Terminal-style author reveal interaction
---------------------------------------------------------

Sequence when clicking "Htun Teza":

1. Clear name/role but keep their layout space
2. Scroll to the avatar panel
3. Type the command: whoami
4. Brief pause (terminal "thinking")
5. Run scan animation over avatar
6. Type the real name
7. Type the role/tagline

This produces a small terminal narrative:

$ whoami
[ scanning... ]
Htun Teza
Graduate Research Assistant
---------------------------------------------------------
*/


/*
---------------------------------------------------------
Typing function
---------------------------------------------------------
Types text character-by-character into an element.

element  → DOM node to type into
text     → string to type
speed    → milliseconds between characters
callback → optional function to run when typing finishes
---------------------------------------------------------
*/
function typeText(element, text, speed = 40, callback = null) {

  element.textContent = "";
  element.classList.add("terminal-prompt"); // blinking cursor

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


/*
---------------------------------------------------------
Main click interaction
---------------------------------------------------------
Triggered when user clicks the "Htun Teza" link
---------------------------------------------------------
*/
document.querySelector('.author-link').addEventListener('click', function (e) {

  e.preventDefault();

  const avatar = document.getElementById('avatar');
  if (!avatar) return;

  const nameEl = document.getElementById("author-name");
  const roleEl = document.getElementById("tag-line");

  /*
  ---------------------------------------------------------
  Preserve original text so it can be typed repeatedly
  ---------------------------------------------------------
  */
  const nameText = nameEl.dataset.original || nameEl.textContent;
  const roleText = roleEl.dataset.original || roleEl.textContent;

  nameEl.dataset.original = nameText;
  roleEl.dataset.original = roleText;


  /*
  ---------------------------------------------------------
  Clear text but preserve layout space
  (prevents page elements jumping upward)
  ---------------------------------------------------------
  */
  nameEl.innerHTML = "&nbsp;";
  roleEl.innerHTML = "&nbsp;";


  /*
  ---------------------------------------------------------
  Ensure the avatar panel is expanded
  ---------------------------------------------------------
  */
  const panel = avatar.closest('.terminal-window');

  if (panel && panel.classList.contains('collapsed')) {
    panel.classList.remove('collapsed');
  }


  /*
  ---------------------------------------------------------
  Scroll the avatar into view
  ---------------------------------------------------------
  */
  avatar.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });


  const wrapper = avatar.closest('.avatar-wrapper');


  /*
  ---------------------------------------------------------
  STEP 1 — Type "whoami"
  (start slightly after scrolling begins)
  ---------------------------------------------------------
  */
  setTimeout(() => {

    typeText(nameEl, "whoami", 60, () => {

      /*
      ---------------------------------------------------------
      STEP 2 — Small processing delay
      (makes it feel like a command executing)
      ---------------------------------------------------------
      */
      setTimeout(() => {

        nameEl.innerHTML = "&nbsp;";

        /*
        ---------------------------------------------------------
        STEP 3 — Run scan animation
        ---------------------------------------------------------
        */
        wrapper.classList.remove('scan');
        void wrapper.offsetWidth; // restart animation
        wrapper.classList.add('scan');


        /*
        ---------------------------------------------------------
        After scan finishes → type real identity
        ---------------------------------------------------------
        */
        setTimeout(() => {

          wrapper.classList.remove('scan');

          /*
          ---------------------------------------------------------
          STEP 4 — Type real name
          ---------------------------------------------------------
          */
          typeText(nameEl, nameText, 45, () => {

            /*
            ---------------------------------------------------------
            STEP 5 — Type role/tagline
            ---------------------------------------------------------
            */
            setTimeout(() => {
              typeText(roleEl, roleText, 30);
            }, 200);

          });

        }, 3500); // scan duration

      }, 450); // thinking pause

    });

  }, 600); // scroll delay

});