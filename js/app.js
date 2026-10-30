import promptData from '../assets/prompt-data.json';
import textureOne from '../assets/album-texure-1.png';
import textureTwo from '../assets/album-texure-2.png';

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
    'Future Shock',
    'Jamestown',
    'King Fisher',
    'Borrowed Time',
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
const descriptionToggle = document.getElementById('descriptionToggle');
let combinations = [];
let toastTimer;

function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function titleLines(title) {
    const words = title.split(/\s+/);
    if (words.length === 1) return [title];
    if (words.length <= 3) return [words[0], words.slice(1).join(' ')];

    const splits = words.slice(1).map((_, index) => [
        words.slice(0, index + 1).join(' '),
        words.slice(index + 1).join(' '),
    ]);
    const bottomHeavy = splits.filter(([top, bottom]) => bottom.length > top.length);
    return (bottomHeavy.length ? bottomHeavy : splits).sort((a, b) =>
        Math.abs(a[1].length - a[0].length) - Math.abs(b[1].length - b[0].length)
    )[0];
}

function descriptionEnding({ location, descriptors }) {
    return `, based in ${location}, has been described as ${descriptors[0]} and ${descriptors[1]}.`;
}

function describe(combination) {
    return `The latest album by ${combination.artist}${descriptionEnding(combination)}`;
}

function generate() {
    // Choose distinct rotations for every batch, including the initial page load.
    const textureRotations = [0, 90, 180, 270];
    for (let i = textureRotations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [textureRotations[i], textureRotations[j]] = [textureRotations[j], textureRotations[i]];
    }
    const textures = [textureOne, textureTwo, textureTwo];
    for (let i = textures.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [textures[i], textures[j]] = [textures[j], textures[i]];
    }
    const previousNames = new Set(combinations.flatMap(({ album, artist }) => [album, artist]));
    const shuffled = names.filter(name => !previousNames.has(name));
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    combinations = Array.from({ length: 3 }, (_, index) => {
        const firstDescriptor = pick(promptData.descriptors);
        return {
            album: shuffled[index * 2],
            artist: shuffled[index * 2 + 1],
            location: pick(promptData.locations),
            descriptors: [firstDescriptor, pick(promptData.descriptors.filter(value => value !== firstDescriptor))],
        };
    });
    output.replaceChildren(...combinations.map((combination, index) => {
        const { album, artist } = combination;
        const option = document.createElement('article');
        option.className = 'album-option';
        const pairing = document.createElement('section');
        pairing.className = 'pairing';
        pairing.style.setProperty('--texture-rotation', `${textureRotations[index]}deg`);
        pairing.style.setProperty('--album-texture', `url("${textures[index]}")`);
        const title = document.createElement('h2');
        title.setAttribute('aria-label', album);
        titleLines(album).forEach(text => {
            const line = document.createElement('span');
            line.className = 'album-title-line';
            line.textContent = text;
            title.append(line);
        });
        const subtitle = document.createElement('p');
        const by = document.createElement('em');
        by.textContent = 'by ';
        subtitle.append(by, document.createTextNode(artist));
        pairing.append(title, subtitle);
        option.append(pairing);
        const description = document.createElement('div');
        description.className = 'album-description';
        description.hidden = !descriptionToggle.checked;
        const artistName = document.createElement('em');
        artistName.textContent = artist;
        const eyebrow = document.createElement('p');
        eyebrow.className = 'eyebrow critics-eyebrow';
        eyebrow.textContent = 'WHAT CRITICS ARE SAYING:';
        const quote = document.createElement('p');
        quote.className = 'critics-quote';
        const opening = document.createElement('span');
        opening.className = 'quote-mark';
        opening.setAttribute('aria-hidden', 'true');
        opening.textContent = '“';
        const closing = opening.cloneNode();
        closing.textContent = '”';
        quote.append(opening, 'The latest album by ', artistName, descriptionEnding(combination), closing);
        description.append(eyebrow, quote);
        option.append(description);
        return option;
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

try {
    const saved = localStorage.getItem('albumPrompterShowDescription')
        ?? localStorage.getItem('albumPrompterShowArtist');
    if (saved === 'true' || saved === 'false') descriptionToggle.checked = saved === 'true';
} catch {}
descriptionToggle.addEventListener('change', () => {
    output.querySelectorAll('.album-description').forEach(description => {
        description.hidden = !descriptionToggle.checked;
    });
    try { localStorage.setItem('albumPrompterShowDescription', String(descriptionToggle.checked)); } catch {}
});

document.getElementById('newPrompt').addEventListener('click', generate);
copyButton.addEventListener('click', async () => {
    const text = combinations.map(combination => `${combination.album}\nby ${combination.artist}\n\n${describe(combination)}`).join('\n\n');
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
