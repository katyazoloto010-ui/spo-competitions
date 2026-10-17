from pathlib import Path
import json,re
root=Path('docs');assets=json.loads((root/'data/official-media.json').read_text(encoding='utf-8'))
for a in assets:
 if a['key'] in ['unlimited','nto','zvezda-organizer','technocup']:a['background']='#182d4d'
 if a['key']=='student-year':a['kind']='photo'
(root/'data/official-media.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lookup={a['key']:a for a in assets if a.get('path')}
keys={'it-planet':'it-planet','big-change-spo':'big-change-photo','artmasters':'artmasters','unlimited':'unlimited','sporttech':'sporttech','terra':'terra','open-os':'it-planet','trajectory':'trajectory','abilympics':'abilympics','professionals':'professionals','hightech':'professionals','student-year':'student-year','media':'movement','nto-student':'nto','nto-school':'nto','nto-junior':'nto-junior','zvezda':'zvezda-organizer','finatlon':'finatlon','lomonosov':'lomonosov','phystech':'phystech','rosatom':'mephi','belchonok':'sfu','ommo':'mephi','higher-test':'higher-test','izumrud':'izumrud-organizer','kurchatov':'kurchatov-organizer','technocup':'technocup','finsprint':'finsprint-organizer'}
p=root/'data/competitions.json';rows=json.loads(p.read_text(encoding='utf-8'))
for r in rows:
 key=re.sub(r'-20\d\d$','',r['id'].removeprefix('verified-'));a=lookup.get(keys.get(key,''))
 if a:r['image']={'src':a['path'],'kind':a['kind'],'background':a['background'],'sourceUrl':a['sourcePage'],'alt':('Фотография с мероприятия' if a['kind']=='photo' else 'Логотип мероприятия или организатора')+' — '+r['title']}
p.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=root/'assets/public.js';s=p.read_text(encoding='utf-8')
def fn(name,nextname,new):
 global s
 a=s.index('  function '+name+'(');b=s.index('  function '+nextname+'(',a);s=s[:a]+new+'\n'+s[b:]
a=s.index('  function eventStatus(');b=s.index('  function sectionHeading(',a)
s=s[:a]+'''  const seasonLabels = { announced: 'Сезон 2026/2027', awaiting_announcement: 'Ожидается анонс' };
  function eventStatus(record) {
    if (!record.seasonConfirmed) return '2027 год · анонс ожидается';
    if (record.eventDate) return record.eventEndDate && record.eventEndDate !== record.eventDate ? `${dateLabel(record.eventDate)} — ${dateLabel(record.eventEndDate)}` : dateLabel(record.eventDate);
    return record.dateText || '2027 год · сроки уточняются';
  }
  function visual(record, hero = false) {
    const media=record.image;
    if (!media) return `<div class="identity-placeholder"><span>${escape(record.title)}</span></div>`;
    return `<img src="${escape(media.src)}" alt="${escape(media.alt)}" width="960" height="640" ${hero ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }
  function mediaClass(record) { return record.image?.kind === 'photo' ? 'official-photo' : 'official-logo'; }
  function mediaBackground(record) { return /^#[0-9a-f]{6}$/i.test(record.image?.background || '') ? record.image.background : '#f1f5f9'; }
  function card(record, heading = 'h3') {
    const topic=topics.get(record.category);
    return `<article class="event-card" data-record-id="${escape(record.id)}" data-type="${escape(record.dataType)}">
      <a class="card-visual ${mediaClass(record)}" style="background:${mediaBackground(record)}" href="${urlFor(record)}" tabindex="-1" aria-hidden="true">${visual(record)}</a>
      <div class="card-body"><p class="card-category">${escape(topic.label)}</p><${heading} class="card-title"><a href="${urlFor(record)}">${escape(record.title)}</a></${heading}>
      <p class="card-description">${escape(description(record))}</p><p class="card-date">${escape(eventStatus(record))}</p>
      <p class="card-source">${escape(audienceLabels[record.audience])}</p>
      <div class="card-actions"><a class="detail-link" href="${urlFor(record)}">Подробнее <span aria-hidden="true">↗</span></a>${saveButton(record)}</div></div></article>`;
  }
''' +s[b:]
fn('renderHome','renderCatalog','''  function renderHome() {
    const choose = list => { const used=new Set();return list.filter(r=>{if(used.has(r.category))return false;used.add(r.category);return true;}).slice(0,3); };
    const upcoming=choose(official.filter(r=>r.seasonConfirmed));
    const selected=choose(official.filter(r=>!r.seasonConfirmed));
    const counts=Object.fromEntries(categories.map(c=>[c,official.filter(r=>r.category===c).length]));
    const directionCard=c=>`<a class="direction-card" href="./competitions.html?category=${encodeURIComponent(c)}"><div><h3>${escape(topics.get(c).label)}</h3><span>${counts[c]} мероприятий</span></div><span aria-hidden="true">↗</span></a>`;
    app.className='home-page';
    app.innerHTML=`<section class="landing-hero shell"><div class="hero-copy"><p class="eyebrow">Учебный год 2026/2027</p><h1>Олимпиады<br>и конкурсы<br><span>по вашим интересам.</span></h1><p class="hero-intro">Для школьников, студентов, учителей и организаторов. Выбирайте направление, знакомьтесь с условиями и сохраняйте интересные мероприятия.</p><div class="hero-actions"><a class="btn" href="./competitions.html">Смотреть олимпиады ↗</a><a class="btn btn-secondary" href="./competitions.html#filters">Выбрать направление</a></div></div><figure class="hero-visual event-hero-photo"><img src="./assets/images/official/big-change-photo.jpg" alt="Участники финала конкурса «Большая перемена»" width="960" height="640" fetchpriority="high"><figcaption>«Большая перемена» · фото Движения Первых</figcaption></figure></section>
    <div class="catalog-strip shell"><div><strong>${official.length}</strong><span>олимпиад и конкурсов</span></div><div><strong>${categories.length}</strong><span>направлений</span></div><div><strong>2026/27</strong><span>учебный год</span></div><a href="./saved.html">Моя подборка ↗</a></div>
    <section class="section shell" id="upcoming">${sectionHeading('Сезон 2026/2027','Олимпиады, которые уже объявили новый сезон.','./competitions.html?season=announced','Смотреть все')}<div class="event-grid">${upcoming.map(r=>card(r)).join('')}</div></section>
    <section class="section direction-section" id="directions"><div class="shell">${sectionHeading('Направления','Выберите предмет или область, в которой хотите попробовать свои силы.','','')}<div class="direction-grid">${categories.map(directionCard).join('')}</div></div></section>
    <section class="section shell" id="how-it-works">${sectionHeading('Как участвовать','','','')}<ol class="steps">${[['Найдите мероприятие','Ищите по названию, направлению или аудитории.'],['Изучите условия','Проверьте требования к участникам и расписание этапов.'],['Откройте сайт организатора','Подробная программа и регистрация находятся на официальном сайте.'],['Сохраните в подборку','Возвращайтесь к интересным олимпиадам в разделе «Сохранённые».']].map(([title,text],i)=>`<li><span class="step-number">0${i+1}</span><h3>${title}</h3><p>${text}</p></li>`).join('')}</ol></section>
    <section class="section shell" id="recommended">${sectionHeading('Следите за новым набором','Конкурсы, к которым можно начать готовиться заранее.','./competitions.html?season=awaiting_announcement','Все конкурсы')}<div class="event-grid">${selected.map(r=>card(r)).join('')}</div></section>
    <section class="section about-section" id="about"><div class="shell about-layout"><div><p class="eyebrow">О сервисе</p><h2>Найдите свою<br>олимпиаду.</h2><p>Предметные олимпиады, творческие конкурсы и чемпионаты профессионального мастерства — в одном каталоге.</p></div><div class="benefit-list">${[['Школьникам','Выбирайте предметные олимпиады и творческие конкурсы.'],['Студентам','Находите соревнования по специальности и новым интересам.'],['Учителям','Подбирайте мероприятия для учеников и собирайте свою подборку.'],['Организаторам','Знакомьтесь с мероприятиями вашего направления и их официальными страницами.']].map(([title,text],i)=>`<div><span>0${i+1}</span><div><h3>${title}</h3><p>${text}</p></div></div>`).join('')}</div></div></section>${finalCta()}`;
  }
  const selectOptions = (values, selected = '') => Object.entries(values).map(([value,label]) => `<option value="${escape(value)}" ${value === selected ? 'selected' : ''}>${escape(label)}</option>`).join('');
''')
s=s.replace('${official.length} реальных мероприятий прошедших сезонов. Регистрация на эти сезоны завершена; условия новых сезонов смотрите у организаторов.','Олимпиады и конкурсы на учебный год 2026/2027. Выберите направление и аудиторию.')
s=s.replace('Реальные мероприятия <span>','Все мероприятия <span>')
s=s.replace('<span>Статус сведений</span><select name="verification">${selectOptions({\'\':\'Все статусы\',...statusLabels})}', '<span>Сезон</span><select name="season">${selectOptions({\'\':\'Все мероприятия\',...seasonLabels})}')
s=s.replace("['q','category','audience','verification']", "['q','category','audience','season']")
s=s.replace('(!filter.verification || record.verificationStatus === filter.verification)', '(!filter.season || record.competitionStatus === filter.season)')
fn('renderDetail','renderSources','''  function renderDetail() {
    const record=records.find(r=>r.id===new URLSearchParams(location.search).get('id'));
    if(!record){notFound();return;}
    document.title=`${record.title} · Олимпиады и конкурсы`;app.className='shell detail-page';
    const related=official.filter(r=>r.id!==record.id && r.category===record.category).slice(0,3);
    app.innerHTML=`<nav class="breadcrumbs" aria-label="Хлебные крошки"><a href="./index.html">Главная</a><span>/</span><a href="./competitions.html">Олимпиады</a></nav>
    <section class="detail-hero"><div class="detail-heading"><p class="eyebrow">${escape(topics.get(record.category).label)}</p><h1>${escape(record.title)}</h1><p class="detail-lead">${escape(description(record))}</p><p class="source-line">${escape(eventStatus(record))}</p></div><div class="detail-visual ${mediaClass(record)}" style="background:${mediaBackground(record)}">${visual(record,true)}</div></section>
    ${!record.seasonConfirmed ? '<p class="season-note">Ориентир — 2027 год. Анонс нового сезона пока не опубликован.</p>' : ''}
    <div class="detail-columns"><div><section class="detail-section"><h2>О мероприятии</h2><p>${escape(description(record))}</p>${record.stageNote?`<p>${escape(record.stageNote)}</p>`:''}</section>
    <section class="detail-section"><h2>Кто может участвовать</h2><p>${escape(record.audienceNote || audienceLabels[record.audience])}</p></section>
    <section class="detail-section"><h2>Даты и условия</h2><dl class="facts">${fact('Направление',record.category)}${fact('Организатор',record.organizer)}${fact(record.seasonConfirmed?'Сезон':'Ориентир',record.edition || '2027 год — анонс ожидается')}${fact('Проведение',eventStatus(record))}${record.registrationDeadline?fact('Регистрация до',dateLabel(record.registrationDeadline)):''}${record.format?fact('Формат',record.format):''}${record.cost?fact('Стоимость',record.cost):''}</dl>${record.seasonConfirmed?`<p><a href="${escape(safeExternal(record.seasonSourceUrl))}" target="_blank" rel="noopener noreferrer">Расписание и правила организатора ↗</a></p>`:''}</section></div>
    <aside class="detail-aside"><h2>Сайт организатора</h2><p>Программа, требования к участникам и регистрация.</p><div class="action-stack">${organizerAction(record)}${saveButton(record,true)}</div></aside></div>
    ${related.length?`<section class="section related-section">${sectionHeading('В том же направлении','','','')}<div class="event-grid">${related.map(r=>card(r)).join('')}</div></section>`:''}`;
  }
''')
fn('renderSources','notFound','''  function renderSources() {
    app.className='shell detail-page';
    app.innerHTML=`<div class="page-intro"><h1>Организаторы</h1><p>Официальные страницы олимпиад и конкурсов.</p></div><ol class="source-list">${official.map(r=>`<li><h2><a href="${urlFor(r)}">${escape(r.title)}</a></h2><p>${escape(r.organizer)}</p><a href="${escape(safeExternal(r.officialUrl))}" target="_blank" rel="noopener noreferrer">Сайт организатора ↗</a>${r.image?.sourceUrl?` · <a href="${escape(safeExternal(r.image.sourceUrl))}" target="_blank" rel="noopener noreferrer">Фото / логотип</a>`:''}</li>`).join('')}</ol>`;
  }
''')
s=s.replace("records=[...official,...showcase];","records=[...official];")
s=s.replace("if(Array.isArray(proposals))for(const item of proposals)if(item.status==='approved' && typeof item.title==='string')records.push({...item,dataType:'local',source:'Предложение пользователя',verificationStatus:'needs_review',audience:'unknown'});",'// Public catalogue contains only editorial records.')
s=s.replace("(params.get('collection') === 'showcase' ? 'showcase' : params.get('collection') === 'local' ? 'local' : 'official')", "'official'")
p.write_text(s,encoding='utf-8')
# Public shell: no development, repository or project notes.
for name in ['index.html','competitions.html','competition.html','saved.html','sources.html','organizer-demo.html']:
 p=root/name;s=p.read_text(encoding='utf-8');s=s.replace('СПО / возможности','Олимпиады и конкурсы').replace('СПО<span class="brand-sub"> / возможности</span>','Олимпиады<span class="brand-sub"> / конкурсы</span>')
 s=s.replace('Олимпиады и конкурсы для студентов СПО','Олимпиады и конкурсы 2026/2027').replace('Олимпиады и конкурсы для студентов колледжей: направления, проверенные источники, поиск и сохранённые мероприятия.','Олимпиады и конкурсы для школьников и студентов. Поиск по направлениям, даты, условия участия и сайты организаторов.')
 s=s.replace('<h2>О проекте</h2>','<h2>Сервис</h2>').replace('<a href="./index.html#project">Проектная информация</a>','').replace('Источники и сезоны','Организаторы')
 s=re.sub(r'<a href="https://github.com/"[^>]*>GitHub ↗</a>','',s)
 s=s.replace('Создано для студентов колледжей','Школьникам · Студентам · Учителям · Организаторам')
 p.write_text(s,encoding='utf-8')
p=root/'assets/public.css';s=p.read_text(encoding='utf-8');s+='''
/* Official event identity: preserve marks and show event photography at full width. */
.card-visual.official-logo img { object-fit:contain; padding:32px; }
.card-visual.official-photo img { object-fit:cover; }
.detail-visual.official-logo img { padding:44px; object-fit:contain; }
.detail-visual.official-photo img { object-fit:contain; }
.identity-placeholder { min-height:200px; display:grid; place-items:center; padding:28px; text-align:center; color:#23446c; font-size:1.25rem; font-weight:600; }
.event-hero-photo { margin:0; }
.event-hero-photo img { width:100%; object-fit:contain; aspect-ratio:1.5; border-radius:14px; }
.event-hero-photo figcaption { margin-top:10px; font-size:.73rem; color:var(--muted); }
.season-note { margin:0 0 30px; padding:14px 18px; background:#edf2f8; border-radius:8px; color:#52657a; font-size:.9rem; }
.direction-card { justify-content:space-between; }
.public-footer { margin-top:64px; }
@media(max-width:600px) { .card-visual.official-logo img { padding:24px; } .detail-visual.official-logo img { padding:30px; } .event-hero-photo img { max-height:280px; aspect-ratio:1.5; } .footer-bottom { line-height:1.7; } }
''';p.write_text(s,encoding='utf-8')
print('Public copy, seasons and official imagery updated')
