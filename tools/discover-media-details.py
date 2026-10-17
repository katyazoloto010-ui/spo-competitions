from pathlib import Path
import urllib.request,json,re,concurrent.futures
from html.parser import HTMLParser
from urllib.parse import urljoin
class P(HTMLParser):
 def __init__(self):super().__init__();self.img=[]
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='img':self.img.append(a)
urls={'nto':'https://ntcontest.ru/','rosatom':'https://olymp.mephi.ru/rosatom/','ommo':'https://olymp.mephi.ru/olympiad/15','hse':'https://talent.hse.ru/olimp/mmo','techno':'https://techno-cup.ru/','kurchatov':'https://old.olimpiadakurchatov.ru/','volga':'https://volga-it.org/winners/','bigchange':'https://xn--90acagbhgpca7c8c7f.xn--p1ai/news/v-nizhnem-novgorode-proshyel-final-bolshoy-peremeny-sredi-studentov-kolledzhey-i-tekhnikumov/','finsprint':'https://vbudushee.ru/about/news/konkurs-finsprint-zavershilsya/','zvezda':'https://zv.susu.ru/'}
def get(item):
 key,url=item
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=20) as r:
   b=r.read();enc=r.headers.get_content_charset() or 'utf-8'
  m=re.search(br'charset=["\s]*([\w-]+)',b[:10000],re.I)
  if m:enc=m[1].decode()
  h=b.decode(enc,'replace');p=P();p.feed(h)
  images=[{'url':urljoin(url,x.get('data-original') or x.get('data-src') or x.get('src') or ''),'alt':x.get('alt','')} for x in p.img]
  svgs=re.findall(r'<svg\b.*?</svg>',h,re.S)
  return dict(key=key,page=url,images=images,svgs=svgs[:8],cssImages=re.findall(r'url\([\'\"]?([^\)\'\"]+)',h)[:10])
 except Exception as e:return dict(key=key,error=str(e))
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:out=list(pool.map(get,urls.items()))
Path('docs/tools/media-details.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
for r in out:print(r['key'],r.get('error',''),r.get('images',[])[:12],'inline SVG',len(r.get('svgs',[])))
