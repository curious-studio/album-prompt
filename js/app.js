import { toBlob } from './vendor/html-to-image.js';

// Browser-native asset loading works both on GitHub Pages and through Vite.
const dataResponse = await fetch(new URL('../assets/prompt-data.json', import.meta.url));
if (!dataResponse.ok) throw new Error(`Unable to load prompt data: ${dataResponse.status}`);
const promptData = await dataResponse.json();
const textureOne = new URL('../assets/album-texure-1.png', import.meta.url).href;
const textureTwo = new URL('../assets/album-texure-2.png', import.meta.url).href;

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

function keepLastWordsTogether(text) {
    return text.replace(/\s+(\S+)$/, '\u00a0$1');
}

function descriptionEnding({ location, locationPhrase, descriptors }) {
    return `, ${locationPhrase} ${location}, has been described as ${descriptors[0]} and ${descriptors[1]}.`;
}

function describe(combination) {
    return `The debut album by ${combination.artist}${descriptionEnding(combination)}`;
}

function setControlVisible(button, visible) {
    button.classList.toggle('is-visible', visible);
    button.inert = !visible;
}

function selectCover(selected) {
    output.querySelectorAll('.album-option').forEach(option => {
        const active = option === selected;
        option.classList.toggle('is-selected', active);
        option.classList.toggle('is-dimmed', Boolean(selected) && !active);
        option.querySelector('.cover-select').setAttribute('aria-pressed', String(active));
        setControlVisible(option.querySelector('.cover-download'), active);
        setControlVisible(option.querySelector('.album-copy'), active && descriptionToggle.checked);
        option.querySelector('.album-description').setAttribute('aria-pressed', String(active));
    });
}

async function downloadCover(pairing, combination, button) {
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    toast.textContent = 'Preparing PNG…';
    clearTimeout(toastTimer);
    try {
        await document.fonts.ready;
        await pairing.querySelector('.cover-texture').decode();
        const blob = await toBlob(pairing, {
            pixelRatio: 4,
            filter: node => !node.classList?.contains('cover-control'),
            style: { animation: 'none', transform: 'none', transition: 'none' },
        });
        if (!blob) throw new Error('PNG export failed');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${combination.album} - ${combination.artist}.png`.replace(/[<>:"/\\|?*]/g, '-');
        link.href = url;
        link.addEventListener('click', event => event.stopPropagation());
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        toast.textContent = 'PNG downloaded';
    } catch (error) {
        console.error('Cover download failed:', error);
        toast.textContent = 'Unable to download the cover. Please try again.';
    } finally {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        toastTimer = setTimeout(() => { toast.textContent = ''; }, 4000);
    }
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
    const locationPhrases = ['based in', 'from their home in', 'rooted in', 'now residing in', 'hailing from'];
    for (let i = locationPhrases.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [locationPhrases[i], locationPhrases[j]] = [locationPhrases[j], locationPhrases[i]];
    }
    combinations = Array.from({ length: 3 }, (_, index) => {
        const firstDescriptor = pick(promptData.descriptors);
        return {
            album: shuffled[index * 2],
            artist: shuffled[index * 2 + 1],
            location: pick(promptData.locations),
            locationPhrase: locationPhrases[index],
            descriptors: [firstDescriptor, pick(promptData.descriptors.filter(value => value !== firstDescriptor))],
        };
    });
    output.replaceChildren(...combinations.map((combination, index) => {
        const { album, artist } = combination;
        const option = document.createElement('article');
        option.className = 'album-option';
        const toggleSelection = () => selectCover(option.classList.contains('is-selected') ? null : option);
        option.addEventListener('click', event => {
            if (!event.target.closest('.cover-download, .album-copy')) toggleSelection();
        });
        const pairing = document.createElement('section');
        pairing.className = 'pairing';
        pairing.style.setProperty('--texture-rotation', `${textureRotations[index]}deg`);

        const title = document.createElement('h2');
        // Keep the tiny filter inside each cover so PNG exports include it.
        const filterDefs = document.getElementById('title-distress-template').content.cloneNode(true);
        const filterId = `title-distress-${index}`;
        const titleFilter = filterDefs.querySelector('filter');
        titleFilter.id = filterId;
        const groupFilter = titleFilter.cloneNode(true);
        groupFilter.querySelectorAll('.title-speckle').forEach(node => node.remove());
        titleFilter.querySelector('feTurbulence.title-speckle').setAttribute('seed', String(Math.floor(Math.random() * 10000)));
        const groupFilterId = `group-distress-${index}`;
        groupFilter.id = groupFilterId;
        titleFilter.parentNode.append(groupFilter);
        titleFilter.querySelector('feGaussianBlur').setAttribute('stdDeviation', '0.18');
        pairing.append(filterDefs);
        title.style.filter = `url(#${filterId})`;
        title.setAttribute('aria-label', album);
        titleLines(album).forEach(text => {
            const line = document.createElement('span');
            line.className = 'album-title-line';
            line.textContent = text;
            title.append(line);
        });
        const subtitle = document.createElement('p');
        subtitle.style.filter = `url(#${groupFilterId})`;
        subtitle.textContent = keepLastWordsTogether(artist);
        const texture = document.createElement('img');
        texture.className = 'cover-texture';
        texture.src = textures[index];
        texture.alt = '';
        texture.draggable = false;
        const select = document.createElement('button');
        select.type = 'button';
        select.className = 'cover-control cover-select';
        select.setAttribute('aria-label', `Select ${album} by ${artist}`);
        select.setAttribute('aria-pressed', 'false');
        const download = document.createElement('button');
        download.type = 'button';
        download.className = 'btn icon cover-control cover-download';
        download.inert = true;
        download.setAttribute('aria-label', `Download ${album} as PNG`);
        download.title = 'Download PNG';
        download.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        download.addEventListener('click', () => downloadCover(pairing, combination, download));
        pairing.append(title, subtitle, texture, select, download);
        option.append(pairing);
        const description = document.createElement('div');
        description.className = 'album-description';
        description.tabIndex = 0;
        description.setAttribute('role', 'button');
        description.setAttribute('aria-label', `Select ${album} by ${artist}: ${describe(combination)}`);
        description.setAttribute('aria-pressed', 'false');
        description.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleSelection();
            }
        });
        description.classList.toggle('is-hidden', !descriptionToggle.checked);
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
        quote.append(opening, 'The latest album by ', artistName, keepLastWordsTogether(descriptionEnding(combination)), closing);
        description.append(eyebrow, quote);
        const copyArea = document.createElement('div');
        copyArea.className = 'album-copy-area';
        const copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'btn icon album-copy';
        copy.inert = true;
        copy.setAttribute('aria-label', `Copy ${album}, artist, and description`);
        copy.title = 'Copy album details';
        copy.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="10" height="10" stroke="currentColor" stroke-width="1.5" rx="2"/><rect x="4" y="4" width="10" height="10" stroke="currentColor" stroke-width="1.5" rx="2"/></svg>';
        copy.addEventListener('click', () => copyAlbum(combination));
        copyArea.append(copy);
        option.append(description, copyArea);
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
        description.classList.toggle('is-hidden', !descriptionToggle.checked);
    });
    selectCover(output.querySelector('.album-option.is-selected'));
    try { localStorage.setItem('albumPrompterShowDescription', String(descriptionToggle.checked)); } catch {}
});

document.getElementById('newPrompt').addEventListener('click', generate);
async function copyAlbum(combination) {
    const text = `${combination.album}\n${combination.artist}\n\n${describe(combination)}`;
    try {
        await navigator.clipboard.writeText(text);
        toast.textContent = 'Copied to clipboard';
    } catch {
        toast.textContent = 'Unable to copy. Select the names to copy them.';
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.textContent = ''; }, 3000);
}

document.addEventListener('click', event => {
    if (!event.target.closest('.album-option, .theme-toggle')) selectCover(null);
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') selectCover(null);
});
generate();
