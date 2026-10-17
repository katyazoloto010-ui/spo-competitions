from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
p=root/'assets/public.js';s=p.read_text(encoding='utf-8')
def replace(a,b):
    global s
    assert a in s,a[:110]
    s=s.replace(a,b)
replace("verified: 'Сведения проверены'", "verified: 'Название и источник проверены'")
replace("if (record.eventDate && record.eventDate < today())", "if (record.competitionStatus === 'completed') return `Завершено · сезон ${record.edition || record.academicYear}`;\n    if (record.eventDate && record.eventDate < today())")
replace("record.academicYear || 'Учебный год уточняется'", "record.edition || record.academicYear || 'Сезон уточняется'")
replace("const upcoming = showcase.filter(record => record.eventDate >= today()).sort((a,b) => a.eventDate.localeCompare(b.eventDate)).slice(0,3);", "const upcoming = official.slice(0,3);")
replace('мероприятий в перечне','реальных мероприятий')
replace('направления интересов','направлений интересов')
replace('<div><strong>2026/27</strong><span>учебный год</span></div><a href="./sources/Приказ_Минпросвещения_598_текстовый.pdf">Источник — Минпросвещения РФ', '<div><strong>Архив</strong><span>прошедшие сезоны</span></div><a href="./sources.html">Источники и сезоны')
replace('<p class="eyebrow">Коллекция «Практика» · концепты мероприятий</p>${sectionHeading(\'Ближайшие олимпиады\', \'Авторские концепты с подробной программой. Отдельно от официального перечня.\', collectionUrl, \'Смотреть коллекцию\')}', '<p class="eyebrow">Реальные мероприятия</p>${sectionHeading(\'Прошедшие сезоны\', \'Познакомьтесь с конкурсами и их организаторами. Эти сезоны завершены; сроки нового набора проверяйте на официальном сайте.\', \'./competitions.html\', \'Смотреть все мероприятия\')}')
replace('Несколько мероприятий из разных направлений официального перечня. Подборка для знакомства, а не проверка допуска.', 'Реальные мероприятия разных направлений. Это знакомство с прошедшими сезонами, а не подтверждение открытой регистрации или допуска.')
replace('В основе каталога — перечень Минпросвещения РФ. Источник и учебный год указаны в каждой записи.', 'Названия и сезоны сверены с сайтами организаторов и официальными публикациями. Ссылки на источники есть в каждой карточке.')
replace('В каталоге сохранены названия из перечня; отдельные сведения требуют проверки. Условия и допуск к участию уточняйте у организатора.', 'Каталог содержит проверенную подборку реальных мероприятий прошедших сезонов. Здесь есть конкурсы для СПО и школьные олимпиады: аудитория указана отдельно. Новые сроки и условия участия уточняйте у организатора.')
replace('Коллекция «Практика» содержит авторские концепты, не входящие в официальный перечень. Контакт проекта и адрес репозитория пока не опубликованы.', 'Проверены названия, сезоны и источники. Неизвестные даты, стоимость и формат не заполняются предположениями. <a href="./sources.html">Открыть все источники</a>.')
replace('${official.length} мероприятий официального перечня. Выберите тему, которая вас увлекает.', '${official.length} реальных мероприятий прошедших сезонов. Регистрация на эти сезоны завершена; условия новых сезонов смотрите у организаторов.')
replace('Официальный перечень <span>${official.length}</span>', 'Реальные мероприятия <span>${official.length}</span>')
replace('<a href="${collectionUrl}" ${collection === \'showcase\' ? \'aria-current="page"\' : \'\'}>Коллекция «Практика» <span>${showcase.length}</span></a>', '')
replace('${escape(record.academicYear)}</p></div><div class="detail-visual">', '${escape(record.edition || record.academicYear)}</p></div><div class="detail-visual">')
needle='      <div class="detail-columns"><div><section class="detail-section">'
replace(needle, '''      ${record.competitionStatus === 'completed' ? `<p class="collection-note"><strong>${escape(eventStatus(record))}.</strong> Эта карточка описывает прошедший сезон. Приём заявок на него завершён. На сайте организатора могут быть опубликованы сведения о новом сезоне.</p>` : ''}
      <div class="detail-columns"><div><section class="detail-section">''')
replace('record.about || topic.description','record.about || record.description || topic.description')
replace("!isConcept ? '<p class=\"muted\">Это описание направления. Подробная программа конкретного мероприятия уточняется у организатора.</p>'", "!isConcept ? `<p class=\"muted\">${escape(record.verificationScope || 'Подробная программа уточняется у организатора.')}</p>`")
replace("'Интерес к направлению не подтверждает допуск. Возраст, курс и условия участия необходимо уточнить.'", "escape(record.audienceNote || 'Интерес к направлению не подтверждает допуск. Условия участия необходимо уточнить.')")
replace("${fact('Номер в официальном перечне',isConcept ? 'Не входит в официальный перечень' : record.sourceNumber)}", "${record.sourceNumber ? fact('Номер в источнике',record.sourceNumber) : ''}")
replace("${fact('Учебный год',record.academicYear)}", "${fact('Сезон',record.edition || record.academicYear)}${fact('Состояние сезона',eventStatus(record))}")
replace("${fact('Дата проведения',dateLabel(record.eventDate))}${fact('Приём заявок до',dateLabel(record.registrationDeadline))}${fact('Формат',record.format)}${fact('Стоимость',record.cost)}", "${record.eventDate ? fact('Дата проведения',dateLabel(record.eventDate)) : ''}${record.registrationDeadline ? fact('Приём заявок до',dateLabel(record.registrationDeadline)) : ''}${record.format ? fact('Формат',record.format) : ''}${record.cost ? fact('Стоимость',record.cost) : ''}")
replace('</dl></section></div>', '</dl>${safeExternal(record.sourceUrl) ? `<p><a href="${escape(safeExternal(record.sourceUrl))}" target="_blank" rel="noopener noreferrer">Источник сведений о сезоне ↗</a></p>` : \'\'}</section></div>')
replace('Перейти на сайт организатора ↗</a>${safeExternal(record.registrationUrl)', 'Открыть официальный сайт ↗</a>${record.competitionStatus !== \'completed\' && safeExternal(record.registrationUrl)')
# Curated records cannot silently inherit stale demo moderation edits.
replace("official=overlayRecords(official).map", "official=official.map")
replace("else if(route==='organizer-demo.html')renderOrganizer();else renderHome();", "else if(route==='organizer-demo.html')renderOrganizer();else if(route==='sources.html')renderSources();else renderHome();")
insert='''  function renderSources() {
    app.className='shell detail-page';
    app.innerHTML=`<div class="page-intro"><p class="eyebrow">Проверенные первоисточники</p><h1>Источники и сезоны</h1><p>Проверка названий и ссылок: 15 октября 2026 года. Все ${official.length} карточек описывают завершённые сезоны. Страницы организаторов могут обновляться к новому набору.</p><p>Ссылки ведут на сайты организаторов, операторов и официальные публикации. Неизвестные условия не заполнены предположениями.</p></div><ol class="source-list">${official.map(record=>`<li><h2><a href="${urlFor(record)}">${escape(record.title)}</a></h2><p>Сезон ${escape(record.edition)} · Завершено</p><p>${escape(record.source)}</p><a href="${escape(safeExternal(record.sourceUrl))}" target="_blank" rel="noopener noreferrer">Публикация о сезоне ↗</a></li>`).join('')}</ol>`;
  }
'''
replace('  function notFound()',insert+'  function notFound()')
p.write_text(s,encoding='utf-8')
for name in ['index.html','competitions.html','competition.html','saved.html','organizer-demo.html']:
    p=root/name;t=p.read_text(encoding='utf-8')
    t=t.replace('./sources/Приказ_Минпросвещения_598_текстовый.pdf','./sources.html').replace('Источник данных · приказ №598','Источники и сезоны').replace('официальный перечень','проверенные источники')
    p.write_text(t,encoding='utf-8')
t=(root/'index.html').read_text(encoding='utf-8')
t=re.sub(r'<title>.*?</title>','<title>Источники и сезоны · СПО / возможности</title>',t)
(root/'sources.html').write_text(t,encoding='utf-8')
p=root/'assets/public.css'
p.write_text(p.read_text(encoding='utf-8')+'\n.source-list { padding-left: 1.5rem; }\n.source-list li { padding: 1.2rem 0; border-bottom: 1px solid #e1e7ed; overflow-wrap: anywhere; }\n.source-list h2 { font-size: 1.15rem; }\n',encoding='utf-8')
print('Public pages now use real archived events and source links')
