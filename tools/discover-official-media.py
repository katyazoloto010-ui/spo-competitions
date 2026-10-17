from pathlib import Path
import json, urllib.request, concurrent.futures
from html.parser import HTMLParser
class Parser(HTMLParser):
 def __init__(self): super().__init__();self.images=[];self.in_title=False;self.title=''
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='title':self.in_title=True
  if tag=='meta' and (a.get('property')=='og:image' or a.get('name')=='twitter:image') and a.get('content'):self.images.append({'url':a['content'],'kind':'cover','alt':''})
  if tag=='img':
   src=a.get('data-src') or a.get('src') or '';desc=str(a).lower()
   if src and not src.startswith('data:') and any(w in desc for w in ['logo','логотип','brand']):self.images.append({'url':src,'kind':'logo','alt':a.get('alt','')})
 def handle_data(self,data):
  if self.in_title:self.title+=data
 def handle_endtag(self,tag):
  if tag=='title':self.in_title=False
from urllib.parse import urljoin
root=Path('docs');rows=json.loads((root/'data/competitions.json').read_text(encoding='utf-8'))
urls={r['id']:r['officialUrl'] for r in rows}
urls.update({'verified-artmasters-2025':'https://artmasters.ru/','verified-higher-test-2025':'https://olymp.hse.ru/mmo/','verified-nto-student-2025':'https://ntcontest.ru/','verified-nto-school-2025':'https://ntcontest.ru/','verified-nto-junior-2025':'https://junior.ntcontest.ru/','verified-open-os-2025':'https://world-it-planet.org/','verified-student-year-2025':'https://www.ruy.ru/projects/student-goda/'})
def fetch(pair):
 id,url=pair
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=22) as response:html=response.read();base=response.url
  soup=Parser();soup.feed(html.decode('utf-8','replace'));items=[dict(i,url=urljoin(base,i['url'])) for i in soup.images]
  return dict(id=id,page=base,title=soup.title,images=list({i['url']:i for i in items}.values())[:10])
 except Exception as e:return dict(id=id,page=url,error=str(e),images=[])
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:out=list(pool.map(fetch,urls.items()))
(root/'tools/official-media-candidates.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for r in out: print(r['id'],r.get('error',''),[(i['kind'],i['url']) for i in r['images'][:4]])
