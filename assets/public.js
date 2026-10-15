/* Public visitor experience. No backend, external API or account is required. */
(() => {
  'use strict';
  const app = document.querySelector('#app');
  const topics = window.CompetitionTopics;
  const audienceLabels = { unknown: 'Аудитория уточняется', school: 'Школьники', spo: 'Студенты СПО', mixed: 'Разные категории участников' };
  const statusLabels = { needs_review: 'Сведения уточняются', verified: 'Название и источник проверены', rejected: 'Требуется уточнение', concept: 'Концепт проекта' };
  const route = location.pathname.split('/').pop() || 'index.html';
  let official = [], showcase = [], categories = [], records = [];
  let toastTimer;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const normalize = value => String(value).toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/\s+/g, ' ').trim();
  const urlFor = record => `./competition.html?id=${encodeURIComponent(record.id)}`;
  const collectionUrl = './competitions.html?collection=showcase';
  function read(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
    catch { return fallback; }
  }
  function notify(message) {
    const toast = document.querySelector('#toast');
    toast.textContent = message; toast.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
  }
  function savedIds() { const value = read('savedCompetitions', []); return Array.isArray(value) ? value.filter(id => typeof id === 'string') : []; }
  function setSaved(id) {
    const ids = savedIds();
    const next = ids.includes(id) ? ids.filter(item => item !== id) : [...new Set([...ids, id])];
    try { localStorage.setItem('savedCompetitions', JSON.stringify(next)); }
    catch { notify('Не удалось сохранить мероприятие. Проверьте настройки хранения в браузере.'); return; }
    syncSaved();
    notify(next.includes(id) ? 'Мероприятие сохранено' : 'Мероприятие удалено из сохранённых');
    if (route === 'saved.html') renderCatalog(true);
  }
  function saveButton(record, large = false) {
    const saved = savedIds().includes(record.id);
    return `<button type="button" class="${large ? 'btn btn-secondary' : 'save-button'}" data-save="${escape(record.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Удалить из сохранённых' : 'Сохранить мероприятие'}: ${escape(record.title)}"><svg width="20" height="20" viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4V4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>${large ? `<span>${saved ? 'Сохранено' : 'Сохранить'}</span>` : ''}</button>`;
  }
  function syncSaved() {
    const ids = savedIds();
    const count = document.querySelector('#saved-count');
    if (count) count.textContent = ids.length ? String(ids.length) : '';
    document.querySelectorAll('[data-save]').forEach(button => {
      const saved = ids.includes(button.dataset.save);
      button.setAttribute('aria-pressed', String(saved));
      const record = records.find(item => item.id === button.dataset.save);
      button.setAttribute('aria-label', `${saved ? 'Удалить из сохранённых' : 'Сохранить мероприятие'}: ${record?.title || ''}`);
      button.querySelector('svg')?.setAttribute('fill', saved ? 'currentColor' : 'none');
      const label = button.querySelector('span'); if (label) label.textContent = saved ? 'Сохранено' : 'Сохранить';
    });
  }
  function safeExternal(value) {
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch { return null; }
  }
  function dateLabel(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Информация уточняется';
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? 'Информация уточняется' : new Intl.DateTimeFormat('ru-RU', { day:'numeric', month:'long', year:'numeric' }).format(date);
  }
  function today() {
    // ISO lexical comparisons keep the calendar stable without UTC date shifts.
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Moscow', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date());
    const get = name => parts.find(part => part.type === name).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function description(record) { return record.description || topics.get(record.category).description; }
  function sourceLabel(record) { return record.dataType === 'showcase' ? 'Коллекция «Практика» · концепт' : record.source || 'Источник уточняется'; }
  function eventStatus(record) {
    if (record.competitionStatus === 'completed') return `Завершено · сезон ${record.edition || record.academicYear}`;
    if (record.eventDate && record.eventDate < today()) return `Завершено · ${dateLabel(record.eventDate)}`;
    if (record.eventDate) return dateLabel(record.eventDate);
    return 'Даты уточняются';
  }
  function card(record, heading = 'h3') {
    const topic = topics.get(record.category);
    return `<article class="event-card" data-record-id="${escape(record.id)}" data-type="${escape(record.dataType)}">
      <a class="card-visual" href="${urlFor(record)}" tabindex="-1" aria-hidden="true"><img src="${topic.image}" alt="" width="960" height="640" loading="lazy" decoding="async"></a>
      <div class="card-body"><p class="card-category">${escape(topic.label)}</p><${heading} class="card-title"><a href="${urlFor(record)}">${escape(record.title)}</a></${heading}>
      <p class="card-description">${escape(description(record))}</p><p class="card-date"><span aria-hidden="true">◷</span> ${escape(eventStatus(record))}</p>
      <p class="card-source">${escape(sourceLabel(record))}<br>${escape(record.edition || record.academicYear || 'Сезон уточняется')}${record.sourceNumber ? ` · № ${escape(record.sourceNumber)}` : ''}</p>
      <p class="card-status">${escape(statusLabels[record.verificationStatus] || 'Сведения уточняются')}</p>
      <div class="card-actions"><a class="detail-link" href="${urlFor(record)}">Подробнее <span aria-hidden="true">↗</span></a>${saveButton(record)}</div></div></article>`;
  }
  function sectionHeading(title, text, href, label) {
    return `<div class="section-heading"><div><h2>${title}</h2>${text ? `<p>${text}</p>` : ''}</div>${href ? `<a class="arrow-link" href="${href}">${label} <span aria-hidden="true">↗</span></a>` : ''}</div>`;
  }
  function finalCta() {
    return `<section class="final-cta shell"><div><p class="eyebrow">Следующий шаг — ваш</p><h2>Найдите задачу,<br>которая увлечёт.</h2><p>Выберите направление и откройте для себя новые возможности.</p></div><div class="cta-actions"><a class="btn btn-white" href="./competitions.html">Перейти в каталог ↗</a><a href="./competitions.html#filters">Найти олимпиаду</a></div></section>`;
  }
  function renderHome() {
    const upcoming = official.slice(0,3);
    const selected = [], used = new Set();
    for (const record of official) {
      if (!used.has(record.category)) { selected.push(record); used.add(record.category); }
      if (selected.length === 3) break;
    }
    const counts = Object.fromEntries(categories.map(category => [category, official.filter(record => record.category === category).length]));
    const featuredCategories = ['Информатика, ИТ и программирование', 'Иностранные языки', 'Обществознание, право и экономика', 'Педагогика и социальные проекты', 'Дизайн, компьютерная графика и 3D', 'Исследовательские и проектные конкурсы', 'Изобразительное искусство и рисунок', 'Экология, география и сельское хозяйство'].filter(category => categories.includes(category));
    const orderedCategories = [...featuredCategories, ...categories.filter(category => !featuredCategories.includes(category)).sort((a,b) => counts[b] - counts[a])];
    const directionCard = category => {
      const topic = topics.get(category);
      return `<a class="direction-card" href="./competitions.html?category=${encodeURIComponent(category)}"><img src="${topic.image}" alt="" width="96" height="64" loading="lazy"><div><h3>${escape(topic.label)}</h3><span>${counts[category]} мероприятий</span></div><span class="direction-arrow" aria-hidden="true">↗</span></a>`;
    };
    app.className = 'home-page';
    app.innerHTML = `<section class="landing-hero shell"><div class="hero-copy"><p class="eyebrow"><span class="eyebrow-dot"></span> Возможности для студентов колледжей</p><h1>Ваш интерес.<br>Ваш следующий<br><span>большой шаг.</span></h1><p class="hero-intro">Находите олимпиады и конкурсы, пробуйте новое и превращайте знания в опыт. Всё начинается с подходящей задачи.</p><div class="hero-actions"><a class="btn" href="./competitions.html">Смотреть олимпиады <span aria-hidden="true">↗</span></a><a class="btn btn-secondary" href="./competitions.html#filters">Найти подходящие</a></div><p class="hero-note">Без регистрации · Сохраняйте то, что интересно</p></div><div class="hero-visual"><img src="./assets/hero-success-path.png" alt="Светлая лестница к вершине с кубком, книгами и символами образования" width="1672" height="941" fetchpriority="high"></div></section>
      <div class="catalog-strip shell"><div><strong>${official.length}</strong><span>реальных мероприятий</span></div><div><strong>${categories.length}</strong><span>направлений интересов</span></div><div><strong>Архив</strong><span>прошедшие сезоны</span></div><a href="./sources.html">Источники и сезоны <span aria-hidden="true">↗</span></a></div>
      <section class="section shell" id="upcoming"><p class="eyebrow">Реальные мероприятия</p>${sectionHeading('Прошедшие сезоны', 'Познакомьтесь с конкурсами и их организаторами. Эти сезоны завершены; сроки нового набора проверяйте на официальном сайте.', './competitions.html', 'Смотреть все мероприятия')}<div class="event-grid">${upcoming.length ? upcoming.map(record => card(record)).join('') : '<div class="empty-state"><h3>Новые программы готовятся</h3><p>Посмотрите коллекцию или выберите мероприятие из официального перечня.</p></div>'}</div><a class="section-bottom-link" href="./competitions.html">Смотреть все олимпиады →</a></section>
      <section class="section direction-section" id="directions"><div class="shell">${sectionHeading('Начните с того, что вам близко', 'От технологий и языков до творчества и социальных проектов.', '', '')}<div class="direction-grid">${orderedCategories.slice(0,8).map(directionCard).join('')}</div><details class="all-directions"><summary>Все ${categories.length} направления <span aria-hidden="true">+</span></summary><div class="direction-grid">${orderedCategories.slice(8).map(directionCard).join('')}</div></details></div></section>
      <section class="section shell" id="how-it-works">${sectionHeading('От интереса — к участию', 'Четыре простых шага, чтобы не потеряться в возможностях.', '', '')}<ol class="steps">${[['Выберите направление','Найдите то, что интересно именно вам: от программирования до искусства.'],['Изучите условия','Откройте карточку, проверьте даты и требования к участникам.'],['Узнайте подробности','Перейдите на сайт организатора, если подтверждённая ссылка доступна.'],['Сохраните важное','Вернитесь к понравившемуся мероприятию в удобное время.']].map(([title,text],i)=>`<li><span class="step-number">0${i+1}</span><h3>${title}</h3><p>${text}</p></li>`).join('')}</ol></section>
      <section class="section shell" id="recommended">${sectionHeading('Стоит присмотреться', 'Реальные мероприятия разных направлений. Это знакомство с прошедшими сезонами, а не подтверждение открытой регистрации или допуска.', './competitions.html', 'Весь каталог')}<div class="event-grid">${selected.map(record => card(record)).join('')}</div></section>
      <section class="section about-section" id="about"><div class="shell about-layout"><div><p class="eyebrow">Меньше поисков. Больше возможностей.</p><h2>Все ориентиры<br>в одном месте.</h2><p>Мы помогаем исследовать мир олимпиад и конкурсов. Вы выбираете интересное — мы собираем информацию в понятный каталог.</p></div><div class="benefit-list">${[['01','Официальный источник','Названия и сезоны сверены с сайтами организаторов и официальными публикациями. Ссылки на источники есть в каждой карточке.'],['02','Поиск без лишних шагов','Ищите по названию и направлению, уточняйте аудиторию и статус сведений.'],['03','Своя подборка','Сохраняйте мероприятия, чтобы не искать их заново. Регистрация не требуется.'],['04','Понятный следующий шаг','Подтверждённые ссылки ведут к организаторам. Если сведений пока нет, мы прямо об этом говорим.']].map(([number,title,text])=>`<div><span>${number}</span><div><h3>${title}</h3><p>${text}</p></div></div>`).join('')}</div></div></section>
      ${finalCta()}<section class="project-note shell" id="project"><h2>О проекте</h2><p>«СПО / возможности» — проект информационной системы для студентов колледжей. Каталог содержит проверенную подборку реальных мероприятий прошедших сезонов. Здесь есть конкурсы для СПО и школьные олимпиады: аудитория указана отдельно. Новые сроки и условия участия уточняйте у организатора.</p><p>Проверены названия, сезоны и источники. Неизвестные даты, стоимость и формат не заполняются предположениями. <a href="./sources.html">Открыть все источники</a>.</p></section>`;
  }
  const selectOptions = (values, selected = '') => Object.entries(values).map(([value,label]) => `<option value="${escape(value)}" ${value === selected ? 'selected' : ''}>${escape(label)}</option>`).join('');
  function renderCatalog(saved = false) {
    app.className = 'shell catalog-page';
    const params = new URLSearchParams(location.search);
    let collection = saved ? 'all' : (params.get('collection') === 'showcase' ? 'showcase' : params.get('collection') === 'local' ? 'local' : 'official');
    app.innerHTML = `<div class="page-intro"><p class="eyebrow">${saved ? 'Ваша подборка' : 'Возможности для нового опыта'}</p><h1>${saved ? 'Сохранённые олимпиады' : 'Найдите свою олимпиаду'}</h1><p>${saved ? 'Все мероприятия, к которым вы хотите вернуться.' : `${official.length} реальных мероприятий прошедших сезонов. Регистрация на эти сезоны завершена; условия новых сезонов смотрите у организаторов.`}</p></div>
      ${saved ? '' : `<nav class="collection-tabs" aria-label="Источник мероприятий"><a href="./competitions.html" ${collection === 'official' ? 'aria-current="page"' : ''}>Реальные мероприятия <span>${official.length}</span></a>${records.some(r=>r.dataType==='local') ? `<a href="./competitions.html?collection=local" ${collection === 'local' ? 'aria-current="page"' : ''}>Ваши предложения</a>` : ''}</nav>`}
      ${collection === 'showcase' ? '<p class="collection-note">Авторские концепты мероприятий: программы и сроки придуманы для этой коллекции. Они не относятся к официальному перечню; набор участников не ведётся.</p>' : ''}
      <form id="filters" class="catalog-filters" role="search"><label class="search-field"><span>Название олимпиады</span><input name="q" type="search" placeholder="Что вам интересно?" autocomplete="off"></label><label><span>Направление</span><select name="category">${selectOptions({'':'Все направления', ...Object.fromEntries(categories.map(c=>[c,topics.get(c).label]))})}</select></label><label><span>Аудитория</span><select name="audience">${selectOptions({'':'Любая',...audienceLabels})}</select></label><label><span>Статус сведений</span><select name="verification">${selectOptions({'':'Все статусы',...statusLabels})}</select></label><button type="reset" class="filter-reset">Сбросить фильтры</button></form>
      <div class="result-toolbar"><p id="count" role="status" aria-live="polite"></p><span>24 записи на странице</span></div><div id="results" class="event-grid"></div><nav class="pager" aria-label="Страницы каталога"><button id="prev" class="btn btn-secondary" type="button">← Назад</button><span id="pagination"></span><button id="next" class="btn btn-secondary" type="button">Далее →</button></nav>`;
    const form = document.querySelector('#filters');
    let current = 1;
    function draw(fromUrl = false) {
      if (fromUrl) {
        const p = new URLSearchParams(location.search);
        ['q','category','audience','verification'].forEach(name => { form.elements[name].value = p.get(name) || ''; });
        const requested = Number(p.get('page')); current = Number.isFinite(requested) ? Math.max(1,Math.floor(requested)) : 1;
      }
      const filter = Object.fromEntries(new FormData(form)), query = normalize(filter.q), ids = savedIds();
      const result = records.filter(record => (saved ? ids.includes(record.id) : record.dataType === collection)
        && normalize(record.title).includes(query) && (!filter.category || record.category === filter.category)
        && (!filter.audience || record.audience === filter.audience) && (!filter.verification || record.verificationStatus === filter.verification));
      const pages = Math.max(1,Math.ceil(result.length/24)); current = Math.min(current,pages);
      document.querySelector('#results').innerHTML = result.slice((current-1)*24,current*24).map(record=>card(record,'h2')).join('') || `<div class="empty-state"><h2>${saved && !ids.length ? 'Здесь будет ваша подборка' : 'Ничего не нашлось'}</h2><p>${saved && !ids.length ? 'Нажмите на значок закладки у понравившейся олимпиады.' : 'Попробуйте другое название или измените фильтры.'}</p><a class="btn btn-secondary" href="./competitions.html">Открыть каталог</a></div>`;
      document.querySelector('#count').textContent = `Найдено: ${result.length}`;
      document.querySelector('#pagination').textContent = `${current} / ${pages}`;
      document.querySelector('#prev').disabled = current === 1;
      document.querySelector('#next').disabled = current === pages;
      const next = new URLSearchParams(); if (!saved && collection !== 'official') next.set('collection',collection);
      Object.entries(filter).forEach(([key,value]) => { if(value) next.set(key,value); }); next.set('page',current);
      history.replaceState(null,'',`${location.pathname}?${next}${location.hash}`);
      syncSaved();
    }
    form.addEventListener('submit', event=>event.preventDefault());
    form.addEventListener('input',()=>{ current=1;draw(); });
    form.addEventListener('reset',()=>setTimeout(()=>{current=1;draw();},0));
    [['prev',-1],['next',1]].forEach(([id,step])=>document.getElementById(id).onclick=()=>{current+=step;draw();document.querySelector('#count').scrollIntoView({block:'start'});});
    window.onpopstate=()=>draw(true); draw(true);
  }
  function organizerAction(record) {
    if (record.dataType === 'showcase') return `<a class="btn" href="./organizer-demo.html?id=${encodeURIComponent(record.id)}">Перейти на сайт организатора ↗</a><p class="action-note">Программа концепта из коллекции «Практика».</p>`;
    const external = safeExternal(record.officialUrl);
    if (external) return `<a class="btn" href="${escape(external)}" target="_blank" rel="noopener noreferrer">Открыть официальный сайт ↗</a>${record.competitionStatus !== 'completed' && safeExternal(record.registrationUrl) ? `<a class="btn btn-secondary" href="${escape(safeExternal(record.registrationUrl))}" target="_blank" rel="noopener noreferrer">Регистрация у организатора ↗</a>` : ''}`;
    return '<button class="btn" type="button" disabled aria-describedby="organizer-missing">Перейти на сайт организатора ↗</button><p class="action-note" id="organizer-missing">Подтверждённая ссылка пока не указана.</p>';
  }
  function fact(label,value) { return `<div><dt>${label}</dt><dd>${escape(value ?? 'Информация уточняется') || 'Информация уточняется'}</dd></div>`; }
  function renderDetail() {
    const id = new URLSearchParams(location.search).get('id');
    const record = records.find(item=>item.id===id);
    if (!record) { notFound(); return; }
    const topic = topics.get(record.category), isConcept = record.dataType === 'showcase';
    document.title = `${record.title} · СПО / возможности`;
    app.className = 'shell detail-page';
    const related = records.filter(item=>item.id!==record.id && item.dataType===record.dataType && item.category===record.category).slice(0,3);
    app.innerHTML = `<nav class="breadcrumbs" aria-label="Хлебные крошки"><a href="./index.html">Главная</a><span>/</span><a href="${isConcept ? collectionUrl : './competitions.html'}">${isConcept ? 'Коллекция «Практика»' : 'Олимпиады'}</a></nav>
      <section class="detail-hero"><div class="detail-heading"><p class="eyebrow">${escape(topic.label)}</p><h1>${escape(record.title)}</h1><p class="detail-lead">${escape(description(record))}</p><p class="source-line">${escape(sourceLabel(record))} · ${escape(record.edition || record.academicYear)}</p></div><div class="detail-visual"><img src="${topic.image}" alt="" width="960" height="640" fetchpriority="high"></div></section>
      ${isConcept ? '<p class="collection-note">Авторский концепт мероприятия. Программа и сроки — часть коллекции «Практика», не официальные условия реального конкурса.</p>' : ''}
      ${record.competitionStatus === 'completed' ? `<p class="collection-note"><strong>${escape(eventStatus(record))}.</strong> Эта карточка описывает прошедший сезон. Приём заявок на него завершён. На сайте организатора могут быть опубликованы сведения о новом сезоне.</p>` : ''}
      <div class="detail-columns"><div><section class="detail-section"><h2>Об олимпиаде</h2><p>${escape(record.about || record.description || topic.description)}</p>${!isConcept ? `<p class="muted">${escape(record.verificationScope || 'Подробная программа уточняется у организатора.')}</p>` : `<p><strong>Результат работы:</strong> ${escape(record.outcome)}</p>`}</section><section class="detail-section"><h2>Кому может быть интересно</h2><p>${escape(record.interested || topic.interested)}</p><p class="muted">${isConcept ? escape(audienceLabels[record.audience]) : escape(record.audienceNote || 'Интерес к направлению не подтверждает допуск. Условия участия необходимо уточнить.')}</p></section><section class="detail-section"><h2>Что известно</h2><dl class="facts">${fact('Направление',record.category)}${record.sourceNumber ? fact('Номер в источнике',record.sourceNumber) : ''}${fact('Источник',sourceLabel(record))}${fact('Сезон',record.edition || record.academicYear)}${fact('Состояние сезона',eventStatus(record))}${fact('Статус',statusLabels[record.verificationStatus])}${fact('Аудитория',audienceLabels[record.audience])}${record.eventDate ? fact('Дата проведения',dateLabel(record.eventDate)) : ''}${record.registrationDeadline ? fact('Приём заявок до',dateLabel(record.registrationDeadline)) : ''}${record.format ? fact('Формат',record.format) : ''}${record.cost ? fact('Стоимость',record.cost) : ''}</dl>${safeExternal(record.sourceUrl) ? `<p><a href="${escape(safeExternal(record.sourceUrl))}" target="_blank" rel="noopener noreferrer">Источник сведений о сезоне ↗</a></p>` : ''}</section></div>
      <aside class="detail-aside"><p class="eyebrow">Ваш следующий шаг</p><h2>${isConcept ? 'Познакомьтесь с программой' : 'Изучите условия участия'}</h2><p>Сохраните мероприятие и вернитесь к нему, когда будет удобно.</p><div class="action-stack">${organizerAction(record)}${saveButton(record,true)}</div><p class="aside-source">${escape(sourceLabel(record))}</p></aside></div>
      ${related.length ? `<section class="section related-section">${sectionHeading('В том же направлении','Продолжите знакомство с интересующей темой.','','')}<div class="event-grid">${related.map(item=>card(item)).join('')}</div>` : ''}`;
  }
  function renderSources() {
    app.className='shell detail-page';
    app.innerHTML=`<div class="page-intro"><p class="eyebrow">Проверенные первоисточники</p><h1>Источники и сезоны</h1><p>Проверка названий и ссылок: 15 октября 2026 года. Все ${official.length} карточек описывают завершённые сезоны. Страницы организаторов могут обновляться к новому набору.</p><p>Ссылки ведут на сайты организаторов, операторов и официальные публикации. Неизвестные условия не заполнены предположениями.</p></div><ol class="source-list">${official.map(record=>`<li><h2><a href="${urlFor(record)}">${escape(record.title)}</a></h2><p>Сезон ${escape(record.edition)} · Завершено</p><p>${escape(record.source)}</p><a href="${escape(safeExternal(record.sourceUrl))}" target="_blank" rel="noopener noreferrer">Публикация о сезоне ↗</a></li>`).join('')}</ol>`;
  }
  function notFound() { app.className='shell';app.innerHTML='<div class="empty-state"><h1>Мероприятие не найдено</h1><p>Возможно, ссылка неполная. Найдите мероприятие в каталоге.</p><a class="btn" href="./competitions.html">Открыть каталог</a></div>'; }
  function renderOrganizer() {
    const record = showcase.find(item=>item.id===new URLSearchParams(location.search).get('id'));
    if (!record) { notFound(); return; }
    const topic = topics.get(record.category);
    document.title=`${record.title} · ${record.organizer}`;
    app.className='organizer-program';
    app.innerHTML=`<div class="shell organizer-brand"><a href="${urlFor(record)}">← Карточка мероприятия</a><span><b class="organizer-symbol" aria-hidden="true">П</b>${escape(record.organizer)}</span></div>
      <section class="shell organizer-hero"><div><p class="eyebrow">Коллекция «Практика» · авторский концепт</p><h1>${escape(record.title)}</h1><p class="detail-lead">${escape(record.description)}</p><div class="hero-actions"><button class="btn" type="button" id="apply-button">Подать заявку ↗</button><a class="btn btn-secondary" href="#program">Программа</a></div><p class="action-note">Концепт образовательного события. Набор участников не ведётся.</p></div><img src="${topic.image}" alt="" width="960" height="640" fetchpriority="high"></section>
      <div class="shell program-facts"><div><span>Программа</span><strong>${dateLabel(record.eventDate)}</strong></div><div><span>Заявка в концепте</span><strong>до ${dateLabel(record.registrationDeadline)}</strong></div><div><span>Формат</span><strong>${escape(record.format)}</strong></div><div><span>Участие</span><strong>${escape(record.cost)}</strong></div></div>
      <section class="section shell program-overview"><div><p class="eyebrow">Идея программы</p><h2>Попробуйте себя<br>в новой задаче.</h2></div><div><p>${escape(record.about)}</p><h3>Кому адресовано</h3><p>${escape(record.interested)}</p><h3>Что получится</h3><p>${escape(record.outcome)}</p></div></section>
      <section class="section program-stages" id="program"><div class="shell">${sectionHeading('От идеи до результата','Этапы предлагаемой программы.','','')}<ol class="steps three-steps">${record.stages.map((stage,index)=>`<li><span class="step-number">0${index+1}</span><p class="stage-date">${stage.date?dateLabel(stage.date):'После завершения работы'}</p><h3>${escape(stage.title)}</h3><p>${escape(stage.description)}</p></li>`).join('')}</ol></div></section>
      <section class="section shell faq-section"><div><p class="eyebrow">Перед первым шагом</p><h2>Частые вопросы</h2></div><div>${record.faq.map(item=>`<details class="faq"><summary>${escape(item.question)} <span aria-hidden="true">+</span></summary><p>${escape(item.answer)}</p></details>`).join('')}</div></section>
      <section class="shell organizer-contact"><div><h2>${escape(record.organizer)}</h2><p>Концепт программы подготовлен проектом «СПО / возможности». Реальный оргкомитет и контакты не назначены.</p></div><button class="btn" type="button" data-open-application>Посмотреть заявку ↗</button></section>
      <dialog id="application-dialog" aria-labelledby="application-title"><button type="button" class="dialog-close" aria-label="Закрыть">×</button><p class="eyebrow">Коллекция «Практика»</p><h2 id="application-title">Заявка на участие</h2><p>${escape(record.title)}</p><p>Это пример шага подачи заявки для авторского концепта. Регистрация не проводится, персональные данные не запрашиваются и ничего не отправляется организатору.</p><button type="button" class="btn" id="application-save">Сохранить мероприятие</button><p id="application-status" role="status"></p></dialog>`;
    const dialog=document.querySelector('#application-dialog');
    const open=()=>dialog.showModal();document.querySelector('#apply-button').onclick=open;
    document.querySelector('[data-open-application]').onclick=open;
    document.querySelector('.dialog-close').onclick=()=>dialog.close();
    document.querySelector('#application-save').onclick=()=>{if(!savedIds().includes(record.id))setSaved(record.id);document.querySelector('#application-status').textContent=savedIds().includes(record.id)?'Сохранено. Вы найдёте мероприятие в своей подборке.':'Не удалось сохранить мероприятие.';};
  }
  function initNavigation() {
    const toggle=document.querySelector('#menu-toggle'), menu=document.querySelector('#main-menu');
    const close=()=>{toggle.setAttribute('aria-expanded','false');menu.classList.remove('is-open');};
    toggle.onclick=()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));menu.classList.toggle('is-open',open);};
    menu.addEventListener('click',event=>{if(event.target.closest('a'))close();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape' && toggle.getAttribute('aria-expanded')==='true'){close();toggle.focus();}});
    document.addEventListener('click',event=>{if(!event.target.closest('.public-header'))close();});
    const media=matchMedia('(min-width: 1101px)');media.addEventListener('change',close);
    const link=[...menu.querySelectorAll('a')].find(link=>link.getAttribute('href')===`./${route}`);if(link)link.setAttribute('aria-current','page');
    document.querySelector('#copyright-year').textContent=new Date().getFullYear();
  }
  function overlayRecords(base) {
    const overrides=read('competitionOverrides',{});
    const editable=['title','category','audience','verificationStatus','registrationDeadline','eventDate','officialUrl','registrationUrl','format','cost'];
    return base.map(record=>{const patch=overrides && typeof overrides==='object'?overrides[record.id]:null;const result={...record};if(patch && typeof patch==='object')for(const key of editable)if(typeof patch[key]==='string'||patch[key]===null)result[key]=patch[key];if(!result.title)result.title=record.title;return result;});
  }
  async function start() {
    initNavigation();syncSaved();
    document.addEventListener('click',event=>{const button=event.target.closest('[data-save]');if(button)setSaved(button.dataset.save);});
    window.addEventListener('storage',event=>{if(event.key==='savedCompetitions'){syncSaved();if(route==='saved.html')renderCatalog(true);}});
    try {
      const load=async name=>{const response=await fetch(`./data/${name}.json`);if(!response.ok)throw Error(`Cannot load ${name}: ${response.status}`);return response.json();};
      const result=await Promise.all(['competitions','categories','showcase-competitions'].map(load));
      [official,categories,showcase]=result;
      if(!result.every(Array.isArray))throw Error('Invalid catalogue format');
      official=official.map(record=>({...record,dataType:'official'}));
      records=[...official,...showcase];
      const proposals=read('spoDemoSubmissions',[]);
      if(Array.isArray(proposals))for(const item of proposals)if(item.status==='approved' && typeof item.title==='string')records.push({...item,dataType:'local',source:'Предложение пользователя',verificationStatus:'needs_review',audience:'unknown'});
      app.removeAttribute('role');
      if(route==='competitions.html')renderCatalog();else if(route==='saved.html')renderCatalog(true);else if(route==='competition.html')renderDetail();else if(route==='organizer-demo.html')renderOrganizer();else if(route==='sources.html')renderSources();else renderHome();
      syncSaved();
      if(location.hash){const target=document.getElementById(location.hash.slice(1));if(target)requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}
    } catch(error) {
      console.error(error);app.className='shell';app.innerHTML='<div class="empty-state"><h1>Каталог пока недоступен</h1><p>Не удалось загрузить мероприятия. Проверьте соединение и попробуйте ещё раз.</p><button class="btn" id="retry">Попробовать снова</button></div>';document.querySelector('#retry').onclick=()=>location.reload();
    }
  }
  start();
})();
