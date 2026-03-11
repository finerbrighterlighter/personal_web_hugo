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

/* convert slogans → terminal commands */
const lines = slogans.map(s => `echo "${s}"`);

const typingSpeed = 70;
const pauseBetweenLines = 1200;

const target = document.getElementById("typed-command");

/* clear fallback text */
target.textContent = "";

let lineIndex = 0;
let charIndex = 0;

function typeLine() {
    if (charIndex < lines[lineIndex].length) {
    target.textContent += lines[lineIndex][charIndex];
    charIndex++;
    setTimeout(typeLine, typingSpeed);
    } else {
    setTimeout(nextLine, pauseBetweenLines);
    }
}

function nextLine() {
    lineIndex = (lineIndex + 1) % lines.length;
    charIndex = 0;
    target.textContent = "";
    typeLine();
}

setTimeout(typeLine, 500);
