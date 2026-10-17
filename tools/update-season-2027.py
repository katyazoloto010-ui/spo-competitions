from pathlib import Path
import json,shutil,re
root=Path('docs');p=root/'data/competitions.json';rows=json.loads(p.read_text(encoding='utf-8'))
archive=root/'data/archive/verified-seasons-through-2025-2026.json'
if not archive.exists():shutil.copy2(p,archive)
confirmed={
'nto-student':('https://ntcontest.ru/participants/schedule/',None,None,'2026-12-13'),
'nto-school':('https://ntcontest.ru/participants/schedule/',None,None,'2026-10-28'),
'nto-junior':('https://ntcontest.ru/participants/schedule/','2026-12-07','2026-12-17','2026-11-09'),
'lomonosov':('https://olymp.msu.ru/rus/page/main/29/page/reglament-provedeniya-olimpiady-lomonosov-v-2026-2027-uchebnom-godu',None,None,None),
'phystech':('https://olymp-online.mipt.ru/',None,None,None),
'finatlon':('https://fin-olimp.ru/',None,None,None),
'belchonok':('https://dovuz.sfu.ru/abiturientu-sfu/olimpiady/belchonok/2026-2027-uchebnyy-god/','2027-02-07','2027-02-14',None),
'higher-test':('https://talent.hse.ru/olimp/mmo','2027-02-05','2027-02-15',None),
'zvezda':('https://zv.susu.ru/',None,None,None),
'rosatom':('https://olymp.mephi.ru/rosatom/about',None,None,None),
'technocup':('https://techno-cup.ru/',None,None,None)
}
for r in rows:
 key=re.sub(r'-20\d\d$','',r['id'].removeprefix('verified-'))
 r['historicalSource']={'edition':r['edition'],'url':r['sourceUrl']}
 r.update(planningYear=2027,edition=None,academicYear=None,competitionStatus='awaiting_announcement',seasonConfirmed=False,seasonSourceUrl=None,eventDate=None,eventEndDate=None,dateText=None,registrationDeadline=None,registrationStart=None,registrationUrl=None,updatedAt='2026-10-16')
 # Keep only the evergreen factual introduction; older season descriptions remain archived.
 r['description']=re.split(r' В каталоге| Представлен| На сайте| Организатор| Источник| Здесь| НИЯУ| Сведения| Информация о сезоне| Опубликован',r['description'])[0]
 if not r['description'].endswith('.'):r['description']+='.'
 r['audienceNote']=re.sub(r' Это сведения о сезоне 2025 года\.| в архивном сезоне| в этом сезоне| архивного сезона','',r['audienceNote'])
 if key in confirmed:
  source,start,end,deadline=confirmed[key]
  r.update(edition='2026/2027',academicYear='2026/2027',competitionStatus='announced',seasonConfirmed=True,seasonSourceUrl=source,sourceUrl=source,eventDate=start,eventEndDate=end,registrationDeadline=deadline)
  if deadline:r['registrationStart']='2026-08-26'
 if key.startswith('nto-'):r['officialUrl']='https://ntcontest.ru/participants/schedule/'
 if key=='nto-school':r.update(audience='mixed',audienceNote='Школьники 8–11 классов и студенты 1–2 курсов СПО.',dateText='Февраль — апрель 2027 года')
 if key=='nto-student':r['audienceNote']='Студенческий трек. Доступные профили и требования к участникам смотрите у организатора.'
 if key=='belchonok':r['officialUrl']=r['seasonSourceUrl'];r['audienceNote']='Школьники 2–11 классов. Допустимый класс зависит от предмета.';r['stageNote']='Отборочный этап: 1 октября 2026 — 12 января 2027. Финал: 7 или 14 февраля, в зависимости от предмета.'
 if key=='higher-test':r['officialUrl']=r['seasonSourceUrl'];r['stageNote']='Основная регистрация завершилась 22 сентября 2026. Для отдельных профилей действует собственный календарь.'
 if key=='finatlon':r.update(audience='school',audienceNote='Школьники 6–11 классов. Финансовая грамотность и информатика с финтехом.',dateText='Февраль — март 2027 года')
 if key=='zvezda':r.update(audience='mixed',audienceNote='Школьники и студенты 1–2 курсов СПО. Условия зависят от профиля.',officialUrl='https://zv.susu.ru/')
 if key=='technocup':r['officialUrl']='https://techno-cup.ru/';r['audienceNote']='Школьники 8–11 классов.'
 if key=='artmasters':r['officialUrl']='https://artmasters.ru/'
 if key=='lomonosov':r['description']='Предметные олимпиады Московского университета: от математики и естественных наук до языков и гуманитарных дисциплин.'
 if key=='nto-student':r['description']='Командные инженерные соревнования: от идеи и расчётов до работающего технологического решения.'
 if key=='higher-test':r['description']='Предметные олимпиады НИУ ВШЭ по естественным, гуманитарным и социально-экономическим направлениям.'
 if key=='student-year':r['description']='Конкурс достижений студентов профессиональных образовательных организаций: учёба, общественная работа, творчество и профессиональное мастерство.'
 if key=='student-spb':r['audienceNote']='Конкурс для студентов организаций СПО Санкт-Петербурга. Условия нового набора будут опубликованы организатором.'
 if key=='artmasters':r['audienceNote']='Творческие и технические компетенции. Возрастные категории и требования указаны в правилах чемпионата.'
 if key=='it-planet':r['audienceNote']='Студенты и выпускники вузов и колледжей. Возраст и допуск зависят от условий конкурса.'
p.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Announced:',sum(r['seasonConfirmed'] for r in rows),'awaiting:',sum(not r['seasonConfirmed'] for r in rows))
