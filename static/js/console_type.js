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
    "sbatch --mem=16G --time=12:00:00 analysis.sh",
    "sbatch --cpus-per-task=8 simulation.sh",
    "sbatch --array=1-100 job_array.sh",
    "squeue -u $USER",
    "scancel 961005",
    "sacct -j 961005",
    "sinfo"
];

const containerLines = [
    "singularity exec python.sif python train.py",
    "singularity run analysis.sif",
    "singularity shell ubuntu.sif",
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
    "Give blood. Share life",
    "Safe Blood For All",
    "Safe Blood Saves Lives",
    "Give blood and keep the world beating",
    "Blood donation is an act of solidarity",
    "Join the effort and save lives",
    "Safe Life Give Blood",
    "Give blood, give plasma, share life, share often."
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
    return base + currentLine.length * 5;
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

let lineIndex = 0;
let charIndex = 0;
let mistakeMade = false;
let currentLine = "";

/* screen width limit */
let widthLimit = window.innerWidth * 0.5;

function updateWidthLimit() {
    widthLimit = window.innerWidth * 0.5;
}

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
function backspace(count, callback) {

    if (count <= 0) {
        callback();
        return;
    }

    target.textContent =
        target.textContent.slice(0, -1);

    setTimeout(() => backspace(count - 1, callback), backspaceSpeed);
}

/* choose next slogan that fits */
function nextLine() {

    const doErase = Math.random() < eraseChance;

    const continueNext = () => {

        target.textContent = "";
        charIndex = 0;
        mistakeMade = false;

        const maxAttempts = (slogans.length + cliLines.length);

        let attempts = 0;

        while (attempts < maxAttempts) {

            const candidate = generateLine();

            if (measureText(candidate) <= widthLimit) {

                currentLine = candidate;

                setTimeout(typeLine, randomIdle());
                return;
            }

            attempts++;
        }

    };

    if (doErase && target.textContent.length > 0) {

        backspace(target.textContent.length, () => {
            setTimeout(continueNext, 300);
        });

    } else {

        setTimeout(continueNext, 300);

    }
}


/* typing logic */
function typeLine() {

    if (charIndex >= currentLine.length) {
        setTimeout(nextLine, randomIdle());
        return;
    }

    /* possible safe mistake */
    if (!mistakeMade && Math.random() < errorChance && charIndex > 6) {

        mistakeMade = true;

        /* SKIP WORD MISTAKE */
        if (Math.random() < skipWordChance) {

            const nextSpace = currentLine.indexOf(" ", charIndex + 1);

            if (nextSpace !== -1) {

                const skipped = currentLine.slice(charIndex, nextSpace);

                target.textContent += skipped;
                charIndex = nextSpace;

                setTimeout(() => {

                    backspace(skipped.length, () => {
                        charIndex -= skipped.length;
                        typeLine();
                    });

                }, 400);

                return;
            }
        }

        /* EARLY QUOTE MISTAKE */

        target.textContent += "'";
        setTimeout(() => {

            backspace(1, typeLine);

        }, 300);

        return;
    }

    target.textContent += currentLine[charIndex];
    charIndex++;

    setTimeout(typeLine, typingSpeed);
}


/* start */
nextLine();
