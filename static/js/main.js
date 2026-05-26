function openModal() {
    document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('category-toggle').addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('category-options').classList.toggle('hidden');
    });
});

function updateCategoryToggle() {
    const checked = Array.from(document.querySelectorAll('#category-options input:checked')).map(cb => cb.value);
    const toggle = document.getElementById('category-toggle');
    toggle.textContent = checked.length > 0 ? checked.join(', ') : 'Select Categories ▾';
}

function openEdit(id) {
    fetch('/items')
        .then(r => r.json())
        .then(items => {
            const item = items.find(i => i.id === id);
            document.getElementById('title').value = item.title;
            document.getElementById('author').value = item.author;
            document.getElementById('link').value = item.link;
            document.getElementById('doi-or-link').value = item.doi;
            document.getElementById('type').value = item.type;
            document.getElementById('tags').value = item.tags;
            document.getElementById('summary').value = item.summary;
            document.querySelectorAll('#category-options input').forEach(cb => cb.checked = false);
            item.category.split(', ').forEach(cat => {
            const cb = document.querySelector(`#category-options input[value="${cat.trim()}"]`);
            if (cb) cb.checked = true;
            });
            updateCategoryToggle();
            document.getElementById('modal').dataset.editId = id;
            document.getElementById('modal').classList.remove('hidden');
        });
}

async function submitItem() {
    if (!document.getElementById('title').value) return alert('Please enter a title');
    
    const editId = document.getElementById('modal').dataset.editId;
    const data = {
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        link: document.getElementById('link').value,
        doi: document.getElementById('doi-or-link').value,
        type: document.getElementById('type').value,
        category: Array.from(document.querySelectorAll('#category-options input:checked')).map(cb => cb.value).join(', '),
        tags: document.getElementById('tags').value,
        summary: document.getElementById('summary').value,
    };

    const url = editId ? `/update/${editId}` : '/add';
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    if (result.success) {
        document.getElementById('modal').dataset.editId = '';
        closeModal();d
        loadItems();
    }
}

async function smartFetch(value) {
    value = value.trim();
    if (!value) return;
    
    // Clean DOI if full URL pasted
    let doi = value.replace('https://doi.org/', '').replace('http://doi.org/', '').replace('doi.org/', '');
    
    // Only fetch if it looks like a DOI
    if (!doi.startsWith('10.')) return;
    
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
    if (!response.ok) return;
    
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
    const filtered = category === 'all' ? items : items.filter(item => item.category.includes(category));
    
  if (isKanban) {
    const categories = [...new Set(items.map(item => item.type))];
    categories.forEach(category => {
    const column = document.createElement('div');
    column.className = 'kanban-column';
    column.innerHTML = `<div class="kanban-column-title">${category}</div>`;
    items.filter(item => item.type === category).forEach(item => {
            column.innerHTML += `
                <div class="card" onclick="window.open('${item.link}', '_blank')">
                    <span class="card-type">${item.type}</span>
                    <h2 class="card-title">${item.title}</h2>
                    <p class="card-author">${item.author}</p>
                    <p class="card-summary">${item.summary}</p>
                    <div class="card-tags">
                        ${item.tags.split(' ').filter(tag => tag.trim() !== '').map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="card-footer"> 
                        <button class="edit-btn" onclick="event.stopPropagation(); openEdit(${item.id})">Edit</button>
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
                <div class="card-footer">
                    <button class="edit-btn" onclick="event.stopPropagation(); openEdit(${item.id})">Edit</button>
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

document.addEventListener('click', function(e) {
    const options = document.getElementById('category-options');
    const toggle = document.getElementById('category-toggle');
    if (!options.contains(e.target) && !toggle.contains(e.target)) {
        options.classList.add('hidden');
    }
});
