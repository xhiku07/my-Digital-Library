function openModal() {
    document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

async function submitItem() {
    const data = {
    title: document.getElementById('title').value,
    author: document.getElementById('author').value,
    link: document.getElementById('link').value,
    doi: document.getElementById('doi').value,
    type: document.getElementById('type').value,
    category: document.getElementById('category').value,
    tags: document.getElementById('tags').value,
};
    const response = await fetch('/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    if (result.success) {
        closeModal();
        location.reload();
    }
}

async function fetchDOI() {
    let doi = document.getElementById('doi').value.trim();
    doi = doi.replace('https://doi.org/', '').replace('http://doi.org/', '').replace('doi.org/', '');
    if (!doi) return alert('Please enter a DOI first');
    
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
    if (!response.ok) return alert('DOI not found');
    
    const data = await response.json();
    const work = data.message;
    
    document.getElementById('title').value = work.title?.[0] || '';
    document.getElementById('author').value = work.author?.map(a => `${a.given} ${a.family}`).join(', ') || '';
    document.getElementById('type').value = 'Paper';
}


async function loadItems(category = 'all') {
    const response = await fetch('/items');
    const items = await response.json();
    
    const container = document.getElementById('library-container');
    const isKanban = container.className === 'kanban';
    container.innerHTML = '';
    const filtered = category === 'all' ? items : items.filter(item => item.category === category);
    
  if (isKanban) {
    const categories = [...new Set(items.map(item => item.category))];
    categories.forEach(category => {
        const column = document.createElement('div');
        column.className = 'kanban-column';
        column.innerHTML = `<div class="kanban-column-title">${category}</div>`;
        items.filter(item => item.category === category).forEach(item => {
            column.innerHTML += `
                <div class="card" onclick="window.open('${item.link}', '_blank')">
                    <span class="card-type">${item.type}</span>
                    <h2 class="card-title">${item.title}</h2>
                    <p class="card-author">${item.author}</p>
                    <p class="card-summary">${item.summary}</p>
                    <div class="card-tags">
                        ${item.tags.split(' ').filter(tag => tag.trim() !== '').map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>`;
        });
        container.appendChild(column);
    });
} else {
    filtered.forEach(item => {
        container.innerHTML += `
            <div class="card" onclick="window.open('${item.link}', '_blank')">
                <span class="card-type">${item.type}</span>
                <h2 class="card-title">${item.title}</h2>
                <p class="card-author">${item.author}</p>
                <p class="card-summary">${item.summary}</p>
                <div class="card-tags">
                    ${item.tags.split(' ').filter(tag => tag.trim() !== '').map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>`;
    });
}
}
function filterItems(category) {
    loadItems(category);
}
loadItems();


document.getElementById('tile-view').addEventListener('click', () => {
    document.getElementById('library-container').className = 'tile';
    document.getElementById('tile-view').classList.add('active');
    document.getElementById('kanban-view').classList.remove('active');
    loadItems();
    document.getElementById('category-filter').style.display = 'block';
});

document.getElementById('kanban-view').addEventListener('click', () => {
    document.getElementById('library-container').className = 'kanban';
    document.getElementById('tile-view').classList.remove('active');
    document.getElementById('kanban-view').classList.add('active');
    loadItems();
    document.getElementById('category-filter').style.display = 'none';
});
