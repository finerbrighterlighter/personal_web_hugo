/* =========================================================
   RANDOM TERMINAL LINES

   These simulate normal terminal activity so the console
   does not only print slogans.
========================================================= */
const shellLines = [
    "whoami",
    "date",
    "uptime",
    "pwd",
    "ls",
    "history | tail -1",
    "clear"
];

const hpcLines = [
    "sbatch train_model.sh",
    "sbatch --mem=8G --time=12:00:00 analysis.sh",
    "sbatch --cpus-per-task=8 analysis.sh",
    "sbatch --array=1-29 job_array.sh",
    "squeue -u $USER",
    "scancel 961005",
    "sacct -j 961005",
    "sinfo"
];

const containerLines = [
    "singularity exec python.sif python train.py",
    "singularity exec r_env.sif Rscript model.R",
    "singularity exec pytorch.sif python inference.py",
    "singularity inspect python.sif"
];

const devLines = [
    "btop",
    "brew update && brew upgrade -g",
    "sudo pacman -Syu",
    "yay",
    "conda init",
    "conda activate sandbox",
    "lazydocker",
    "docker ps",
    "docker compose up -d"
];

const cliLines = [
    ...shellLines,
    ...hpcLines,
    ...containerLines,
    ...devLines
];


/* =========================================================
    SLOGANS
    These are the slogans that will be typed out in the console.
========================================================= */

const slogans = [
    "Let's donate blood",
    "It's in you to give",
    "Red with life",
    "Life is blood; Blood is life",
    "သွေးသည်အသက်​ အသက်သည်သွေး",
    "Every blood donor is a hero",
    "Give the gift of life",
    "Safe blood for saving mothers",
    "Thank you for saving my life",
    "Blood connects us all",
    "Give Blood. Give Now. Give Often",
    "Be there for someone else",
    "Give blood, share life",
    "Safe Blood For All",
    "Safe Blood Saves Lives",
    "Give blood and keep the world beating",
    "Blood donation is an act of solidarity",
    "Join the effort and save lives",
    "Safe Life Give Blood",
    "Give blood, give plasma, share life, share often.",
    "Give blood, give hope: together we save lives.",
    "Life is Good. Give Blood.",
    "Give Blood Now"
];

/* =========================================================
   COMMANDS

   Terminal-style commands used before the slogan.
   These simulate different CLI tools printing messages.
========================================================= */
const commands = [
    "echo",
    "printf",
    "bloodctl say",
    "bloodctl remind",
    "donate-cli message"
];


/* =========================================================
    PROBABILITY SETTINGS
    Chance of printing a normal terminal command instead
   of a slogan message
========================================================= */
const linuxLineChance = 0.75;


/* =========================================================
   TYPING SPEED CONTROL
========================================================= */

/* Average delay between each typed character (ms).
   ~170 ms ≈ ~65 WPM human typing speed */
const typingSpeed = 170;

/* Speed of backspacing when correcting mistakes.
   Usually faster than typing to mimic real behavior */
const backspaceSpeed = 80;

/* =========================================================
   TERMINAL IDLE TIME

   Random delay before the next command starts typing.
   Simulates a human thinking before entering a command. (ms)
========================================================= */

const idleMin = 500;
const idleMax = 2000;


/* =========================================================
   HUMAN-LIKE MISTAKE BEHAVIOR
========================================================= */

/* Probability that a typing mistake occurs on a line
   (0 = never, 1 = always) */
const errorChance = 0.25;

/* Which type of mistake happens when an error occurs
   0.0 → always early quote mistake
   1.0 → always skip-word mistake
   0.5 → equal chance of both */
const skipWordChance = 0.5;


/* =========================================================
   COMMAND RESET BEHAVIOR
========================================================= */

/* Probability that the entire command is erased with
   backspacing before starting the next command.

   This simulates a human clearing the terminal line
   rather than the program instantly wiping it. */
const eraseChance = 0.35;


/* =========================================================
   DEDICATION

   Typed when the Accessible theme is selected.
   No typos — it should come out clean.
========================================================= */
const DEDICATIONS = [
    "echo 'For Sam — who made me think twice about every color picker since'",
    "echo 'For Sam — who taught me that not everyone sees the world the same way'",
    "echo 'For Sam — without whom I would never have looked at colors the same way'",
    "echo 'For Sam — without whom I would never have realized the importance of colors'",
    "echo 'For Sam'",
    "echo 'Sam see color'",
    "echo 'Hi Sam'",
    "echo 'Sam, this is for you'",
    "echo 'Dedicated to Sam'",
];


/* =========================================================
   Convert slogans into terminal-style commands

   Each slogan becomes something like:
   echo 'Give blood and save lives'

   This makes the typing animation look like a user
   running shell commands rather than printing text.
========================================================= */
function buildLine(slogan) {

    const cmd = commands[Math.floor(Math.random() * commands.length)];

    /* printf requires newline */
    if (cmd === "printf") {
        return `${cmd} '${slogan}\\n'`;
    }

    return `${cmd} '${slogan}'`;
}

/* =========================================================
    Generate random idle time before next command
    This simulates a human pausing to think before typing.
    ========================================================= */
function randomIdle() {
    const base = idleMin + Math.random() * (idleMax - idleMin);
    return base + currentLine.length * idlePerChar;
}


/* =========================================================
    GENERATE RANDOM LINE
    This randomly decides to either generate a normal
    terminal command or a slogan message.
========================================================= */
function generateLine() {

    const r = Math.random();

    if (r < linuxLineChance) {
        return cliLines[Math.floor(Math.random() * cliLines.length)];
    }

    const slogan = slogans[Math.floor(Math.random() * slogans.length)];
    return buildLine(slogan);
}

const target = document.getElementById("typed-command");

let charIndex = 0;
let mistakeMade = false;
let currentLine = "";
let isDedication = false;
let staticMode = false;

/* =========================================================
   CANCELLATION TOKEN

   A shared object reference. All in-flight setTimeout
   callbacks capture the token at the time they were
   scheduled. If the token is replaced (e.g. on dedication
   interrupt), stale callbacks see a mismatch and bail out.
========================================================= */
let token = {};

const minTypingWidth = 120;  // px — hide typed command below this available width

/* ms added per character of current line to idle time */
const idlePerChar = 5;

/* ms to hold the dedication text before resuming normal rotation */
const dedicationHold = 60000;

/* minimum char index before a typo can fire */
const minTypoChar = 6;

/* ms pause after an early-quote mistake before backspacing */
const mistakePause = 300;

/* ms pause after a skip-word mistake before backspacing */
const skipPause = 400;

/* ms pause between line clear and next line starting */
const clearPause = 300;

/* ms initial delay before typing starts on work single pages */
const staticDelay = 800;

/* ms initial delay before typing the dedication */
const dedicationDelay = 600;

/* screen width limit — space remaining after the prompt prefix */
function updateWidthLimit() {
    const available = window.innerWidth - target.getBoundingClientRect().left - 20;
    if (available < minTypingWidth) {
        target.style.display = "none";
        widthLimit = 0;
    } else {
        target.style.display = "";
        widthLimit = available;
    }
}

let widthLimit = 0;
updateWidthLimit();

window.addEventListener("resize", updateWidthLimit);
window.addEventListener("orientationchange", updateWidthLimit);


/* measure line width */
function measureText(text) {

    const span = document.createElement("span");
    span.style.visibility = "hidden";
    span.style.whiteSpace = "nowrap";
    span.style.font = getComputedStyle(target).font;

    span.textContent = text;
    document.body.appendChild(span);

    const width = span.offsetWidth;
    span.remove();

    return width;
}

/* backspace helper */
function backspace(count, t, callback) {

    if (t !== token) return;

    if (count <= 0) {
        callback();
        return;
    }

    target.textContent =
        target.textContent.slice(0, -1);

    setTimeout(() => backspace(count - 1, t, callback), backspaceSpeed);
}

/* choose next line that fits */
function nextLine(t) {

    if (t !== token) return;

    isDedication = false;

    const doErase = Math.random() < eraseChance;

    const continueNext = () => {

        if (t !== token) return;

        target.textContent = "";
        charIndex = 0;
        mistakeMade = false;

        const maxAttempts = (slogans.length + cliLines.length);

        let attempts = 0;

        while (attempts < maxAttempts) {

            const candidate = generateLine();

            if (measureText(candidate) <= widthLimit) {

                currentLine = candidate;

                setTimeout(() => typeLine(t), randomIdle());
                return;
            }

            attempts++;
        }

    };

    if (doErase && target.textContent.length > 0) {

        backspace(target.textContent.length, t, () => {
            setTimeout(continueNext, clearPause);
        });

    } else {

        setTimeout(continueNext, clearPause);

    }
}


/* typing logic */
function typeLine(t) {

    if (t !== token) return;

    if (charIndex >= currentLine.length) {
        if (staticMode) return;
        const pause = isDedication ? dedicationHold : randomIdle();
        setTimeout(() => nextLine(t), pause);
        return;
    }

    /* no typos on the dedication or static commands */
    if (!isDedication && !staticMode && !mistakeMade && Math.random() < errorChance && charIndex > minTypoChar) {

        mistakeMade = true;

        /* SKIP WORD MISTAKE */
        if (Math.random() < skipWordChance) {

            const nextSpace = currentLine.indexOf(" ", charIndex + 1);

            if (nextSpace !== -1) {

                const skipped = currentLine.slice(charIndex, nextSpace);

                target.textContent += skipped;
                charIndex = nextSpace;

                setTimeout(() => {

                    backspace(skipped.length, t, () => {
                        charIndex -= skipped.length;
                        typeLine(t);
                    });

                }, skipPause);

                return;
            }
        }

        /* EARLY QUOTE MISTAKE */

        target.textContent += "'";
        setTimeout(() => {

            backspace(1, t, () => typeLine(t));

        }, mistakePause);

        return;
    }

    target.textContent += currentLine[charIndex];
    charIndex++;

    setTimeout(() => typeLine(t), typingSpeed);
}


/* =========================================================
   ACCESSIBLE THEME — DEDICATION TRIGGER

   Fires when the user switches to the Accessible palette.
   Interrupts whatever is currently typing and types the
   dedication instead. Does not re-fire if they toggle
   dark/light while still on the Accessible palette.
========================================================= */
let accessibleWasActive = false;

document.addEventListener('theme-changed', () => {

    const mode = document.documentElement.dataset.theme || 'light';
    const paletteId = localStorage.getItem('theme-palette-' + mode);
    const isAccessible = paletteId === 'colorblind';

    if (isAccessible && !accessibleWasActive) {

        /* replace token — all in-flight callbacks will bail */
        token = {};
        const t = token;

        isDedication = true;
        target.textContent = '';
        charIndex = 0;
        mistakeMade = false;
        const shuffled = [...DEDICATIONS].sort(() => Math.random() - 0.5);
        currentLine = shuffled.find(d => measureText(d) <= widthLimit) ?? "echo 'Hi Sam!'";

        setTimeout(() => typeLine(t), dedicationDelay);
    }

    accessibleWasActive = isAccessible;
});


/* start */
if (document.querySelector('.work-single')) {
    staticMode = true;
    currentLine = "less paper.pdf";
    setTimeout(() => typeLine(token), staticDelay);
} else if (document.querySelector('.post-single')) {
    staticMode = true;
    currentLine = "cat post.md";
    setTimeout(() => typeLine(token), staticDelay);
} else {
    nextLine(token);
}
