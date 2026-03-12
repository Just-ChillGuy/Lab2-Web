'use strict';

const DB_KEY = 'todo_store';

let items = [];
let asc = true;
let viewFilter = 'all';
let q = '';

document.addEventListener('DOMContentLoaded', init);

function init() {
  buildUI();
  loadFromStorage();
  renderList();
  attachHandlers();
}

/* ---------- UI build ---------- */
let refs = {};

function buildUI() {
  // root wrapper
  const app = document.createElement('main');
  app.className = 'wrap';
  document.body.appendChild(app);

  // header
  const hdr = document.createElement('header');
  hdr.className = 'hdr';
  const h = document.createElement('h1');
  h.textContent = 'Список задач';
  hdr.appendChild(h);
  app.appendChild(hdr);

  // form area
  const form = document.createElement('form');
  form.className = 'f';
  form.setAttribute('aria-label', 'Добавить задачу');

  const txt = document.createElement('input');
  txt.type = 'text';
  txt.placeholder = 'Название задачи';
  txt.className = 'iText';
  txt.required = true;

  const date = document.createElement('input');
  date.type = 'date';
  date.className = 'iDate';

  const add = document.createElement('button');
  add.type = 'submit';
  add.className = 'btnAdd';
  add.textContent = 'Добавить';

  form.append(txt, date, add);
  app.appendChild(form);

  // controls
  const ctrl = document.createElement('section');
  ctrl.className = 'ctrl';

  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Поиск по названию';
  search.className = 's';

  const sel = document.createElement('select');
  sel.className = 'flt';
  [['all','Все'], ['done','Выполненные'], ['todo','Невыполненные']].forEach(([v,t])=>{
    const o = document.createElement('option');
    o.value = v;
    o.textContent = t;
    sel.appendChild(o);
  });

  const sort = document.createElement('button');
  sort.type = 'button';
  sort.className = 'btnSort';
  sort.textContent = 'Сортировать по дате';

  ctrl.append(search, sel, sort);
  app.appendChild(ctrl);

  // list
  const ul = document.createElement('ul');
  ul.className = 'lst';
  ul.id = 'todoList';
  app.appendChild(ul);

  // store refs
  refs = {
    form, txt, date, add, search, sel, sort, ul
  };
}

/* ---------- Events ---------- */
function attachHandlers() {
  refs.form.addEventListener('submit', (e) => {
    e.preventDefault();
    createItem();
  });

  refs.search.addEventListener('input', () => {
    q = refs.search.value.trim().toLowerCase();
    renderList();
  });

  refs.sel.addEventListener('change', () => {
    viewFilter = refs.sel.value;
    renderList();
  });

  refs.sort.addEventListener('click', () => {
    sortItems();
  });

  // Allow dropping between items on the list container
  refs.ul.addEventListener('dragover', (e) => e.preventDefault());
}

/* ---------- CRUD + storage ---------- */
function createItem() {
  const text = refs.txt.value.trim();
  const dateVal = refs.date.value || '';
  if (!text) {
    alert('Введите название задачи!');
    return;
  }
  const task = {
    id: Date.now(),
    t: text,
    d: dateVal,
    done: false
  };
  items.push(task);
  saveToStorage();
  renderList();
  refs.form.reset();
}

function removeItem(id) {
  items = items.filter(x => x.id !== id);
  saveToStorage();
  renderList();
}

function toggleDone(id) {
  const it = items.find(x => x.id === id);
  if (it) {
    it.done = !it.done;
    saveToStorage();
    renderList();
  }
}

function editItem(id) {
  const it = items.find(x => x.id === id);
  if (!it) return;
  const newText = prompt('Новое название:', it.t);
  if (newText === null) return;
  const newDate = prompt('Новая дата (YYYY-MM-DD):', it.d || '');
  if (newDate === null) return;
  it.t = newText.trim() || it.t;
  it.d = newDate;
  saveToStorage();
  renderList();
}

function saveToStorage() {
  localStorage.setItem(DB_KEY, JSON.stringify(items));
}

function loadFromStorage() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) items = parsed;
  } catch (e) {
    console.error('Не удалось прочитать хранилище', e);
  }
}

/* ---------- Sort / filter / search ---------- */
function sortItems() {
  items.sort((a,b) => {
    const ta = a.d ? new Date(a.d).getTime() : Infinity;
    const tb = b.d ? new Date(b.d).getTime() : Infinity;
    return ta - tb;
  });
  if (!asc) items.reverse();
  asc = !asc;
  saveToStorage();
  renderList();
}

function applyFilters(list) {
  return list.filter(it => {
    if (viewFilter === 'done' && !it.done) return false;
    if (viewFilter === 'todo' && it.done) return false;
    if (q && !it.t.toLowerCase().includes(q)) return false;
    return true;
  });
}

/* ---------- Render ---------- */
function renderList() {
  // clear
  while (refs.ul.firstChild) refs.ul.removeChild(refs.ul.firstChild);

  const visible = applyFilters(items);

  visible.forEach((it) => {
    refs.ul.appendChild(makeItemNode(it));
  });
}

/* ---------- Item node + drag handlers ---------- */
function makeItemNode(it) {
  const li = document.createElement('li');
  li.className = 'item';
  if (it.done) li.classList.add('done');
  li.draggable = true;
  li.dataset.id = String(it.id);

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = it.done;
  cb.className = 'cb';
  cb.addEventListener('change', () => toggleDone(it.id));

  const span = document.createElement('span');
  span.className = 'text';
  span.textContent = it.t;

  const tm = document.createElement('time');
  tm.className = 'date';
  tm.dateTime = it.d || '';
  tm.textContent = it.d || '';

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'btn small';
  edit.textContent = 'Изменить';
  edit.addEventListener('click', () => editItem(it.id));

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'btn small danger';
  del.textContent = 'Удалить';
  del.addEventListener('click', () => {
    if (confirm('Удалить задачу?')) removeItem(it.id);
  });

  li.append(cb, span, tm, edit, del);

  // drag handlers
  li.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', String(it.id));
    li.classList.add('dragging');
  });

  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
  });

  li.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  li.addEventListener('drop', (e) => {
    e.preventDefault();
    const dragId = e.dataTransfer.getData('text/plain');
    const dropId = li.dataset.id;
    if (!dragId || dragId === dropId) return;

    const a = items.findIndex(x => String(x.id) === dragId);
    const b = items.findIndex(x => String(x.id) === dropId);
    if (a < 0 || b < 0) return;

    const [m] = items.splice(a, 1);
    items.splice(b, 0, m);
    saveToStorage();
    renderList();
  });

  return li;
}
