from pathlib import Path
import json,urllib.request,urllib.parse,concurrent.futures,xml.etree.ElementTree as ET
root=Path('docs');d={x['key']:x for x in json.loads((root/'tools/media-details.json').read_text(encoding='utf-8'))};c={x['id']:x for x in json.loads((root/'tools/official-media-candidates.json').read_text(encoding='utf-8'))}
assets=[]
def add(key,url,kind='logo',bg='#ffffff',page=None):
 assets.append(dict(key=key,remoteUrl=url,kind=kind,background=bg,sourcePage=page or next((x['page'] for x in c.values() if any(i['url']==url for i in x['images'])),'')))
def pick(key,id,n,kind='logo',bg='#ffffff'):add(key,c[id]['images'][n]['url'],kind,bg,c[id]['page'])
pick('it-planet','verified-it-planet-2025',0,bg='#172f59')
pick('artmasters','verified-artmasters-2025',1,bg='#25213b')
pick('unlimited','verified-unlimited-2025',1)
pick('sporttech','verified-sporttech-2025',0)
pick('terra','verified-terra-2025',1)
pick('trajectory','verified-trajectory-2025',0)
pick('abilympics','verified-abilympics-2025',1)
pick('professionals','verified-professionals-2025',1)
pick('student-year','verified-student-year-2025',0,'cover')
pick('movement','verified-media-2025',3)
add('nto','https://ntcontest.ru/local/templates/main/img/logo.svg',page='https://ntcontest.ru/')
pick('nto-junior','verified-nto-junior-2025',1)
pick('zvezda-organizer','verified-zvezda-2026',0)
pick('finatlon','verified-finatlon-2025',0)
pick('lomonosov','verified-lomonosov-2025',0)
pick('phystech','verified-phystech-2025',0)
pick('sfu','verified-belchonok-2025',1)
pick('izumrud-organizer','verified-izumrud-2025',0)
add('mephi','https://mephi.ru/content/public/uploads/files/news/logotip-mifi-rgb_001.png',page='https://old.olimpiadakurchatov.ru/')
pick('kurchatov-organizer','verified-kurchatov-2025',1)
add('technocup',d['techno']['images'][0]['url'],page=d['techno']['page'])
add('higher-test',d['hse']['images'][0]['url'],page=d['hse']['page'])
add('big-change-photo',d['bigchange']['images'][24]['url'],'photo',page=d['bigchange']['page'])
pick('finsprint-organizer','verified-finsprint-2025',0,'cover')
folder=root/'assets/images/official';folder.mkdir(parents=True,exist_ok=True)
def save(a):
 try:
  u=urllib.parse.quote(a['remoteUrl'],safe=':/?=&%+#');req=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'})
  with urllib.request.urlopen(req,timeout=25) as res:b=res.read();ctype=res.headers.get('Content-Type','')
  if len(b)>8_000_000:raise ValueError('oversized')
  if 'svg' in ctype or b.lstrip().startswith(b'<svg') or b'<?xml' in b[:100]:
   node=ET.fromstring(b)
   for parent in node.iter():
    for child in list(parent):
     if child.tag.split('}')[-1] in ['script','foreignObject','iframe']:parent.remove(child)
    for k,v in list(parent.attrib.items()):
     if k.lower().startswith('on') or (k.split('}')[-1]=='href' and not v.startswith('#')):del parent.attrib[k]
   b=ET.tostring(node,encoding='utf-8');ext='svg'
  elif b.startswith(b'\x89PNG'):ext='png'
  elif b.startswith(b'\xff\xd8'):ext='jpg'
  elif b[:4]==b'RIFF':ext='webp'
  else:raise ValueError('not an image: '+ctype)
  f=folder/(a['key']+'.'+ext);f.write_bytes(b);a.update(path='./assets/images/official/'+f.name,bytes=len(b));return a
 except Exception as e:a['error']=str(e);return a
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:out=list(pool.map(save,assets))
(root/'data/official-media.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for a in out:print(a['key'],a.get('path',a.get('error')))
