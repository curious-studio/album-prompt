const names = [
    'Open & Shut',
    'Buyer’s Remorse',
    'Birdsong',
    'Mortals and Machines',
    'October Falling',
    'Learning Machine',
    'Jump Two Times',
    'Sideshow',
    'Patches of the Universe',
    'Wireless',
    'The Missing',
    'Form Follows Function',
    'Dismissed',
    'Less, but Better',
    'Lodestone',
    'Unmatched Form',
    'Steal the Moon',
    'Future Shock',
    'Jamestown',
    'King Fisher',
    'Borrowed Time',
    'Steel the Moon',
    'The Stolen Moon',
    'The Wild Hunt',
    'Riddle',
    'Seven Ravens',
    'Glass Slipper',
];

const output = document.getElementById('promptOutput');
const copyButton = document.getElementById('copyBtn');
const toast = document.getElementById('copyToast');
const themeToggle = document.getElementById('themeToggle');
let combinations = [];
let toastTimer;

function generate() {
    const shuffled = [...names];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    combinations = Array.from({ length: 3 }, (_, index) => ({
        album: shuffled[index * 2],
        artist: shuffled[index * 2 + 1],
    }));
    output.replaceChildren(...combinations.map(({ album, artist }) => {
        const pairing = document.createElement('section');
        pairing.className = 'pairing';
        const title = document.createElement('h2');
        title.textContent = album;
        const subtitle = document.createElement('p');
        const by = document.createElement('em');
        by.textContent = 'by ';
        subtitle.append(by, document.createTextNode(artist));
        pairing.append(title, subtitle);
        return pairing;
    }));
    clearTimeout(toastTimer);
    toast.textContent = '';
}

function applyTheme(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    themeToggle.checked = dark;
}

let initialTheme = 'dark';
try { initialTheme = localStorage.getItem('prompterTheme') || 'dark'; } catch {}
applyTheme(initialTheme === 'dark');
themeToggle.addEventListener('change', () => {
    applyTheme(themeToggle.checked);
    try { localStorage.setItem('prompterTheme', themeToggle.checked ? 'dark' : 'light'); } catch {}
});

document.getElementById('newPrompt').addEventListener('click', generate);
copyButton.addEventListener('click', async () => {
    const text = combinations.map(({ album, artist }) => `${album}\nby ${artist}`).join('\n\n');
    try {
        await navigator.clipboard.writeText(text);
        toast.textContent = 'Copied to clipboard';
    } catch {
        toast.textContent = 'Unable to copy. Select the names to copy them.';
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.textContent = ''; }, 3000);
});
generate();
