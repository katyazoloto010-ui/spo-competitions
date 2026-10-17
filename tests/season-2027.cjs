/* Run from any directory. Requires Playwright only for development checks. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'ui-screenshots', 'season-2027');
const prefix = '/spo-competitions/';
let passed = 0;
function check(condition, label) { assert.ok(condition, label); passed++; console.log('PASS', label); }
const server = http.createServer((req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if (!pathname.startsWith(prefix)) { res.writeHead(404); return res.end(); }
  const target = path.resolve(root, pathname.slice(prefix.length) || 'index.html');
  if (!target.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(target,(error,body)=>{
    if(error){res.writeHead(404);return res.end();}
    res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.pdf':'application/pdf','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(target)] || 'text/plain');
    res.end(body);
  });
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}${prefix}`;
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 try {
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
  const errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url());});
  await page.clock.install({time:new Date('2026-10-16T12:00:00+03:00')});
  const data=JSON.parse(fs.readFileSync(path.join(root,'data/competitions.json'),'utf8'));
  const old=JSON.parse(fs.readFileSync(path.join(root,'data/archive/verified-seasons-through-2025-2026.json'),'utf8'));
  async function go(target){await page.goto(origin+target);await page.waitForFunction(()=>!document.querySelector('#app').classList.contains('loading'));}
  async function shot(file){await page.evaluate(async()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager');await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});await page.screenshot({path:path.join(output,file),fullPage:true});}
  fs.mkdirSync(output,{recursive:true});
  check(data.length===30 && old.length===30 && data.every(r=>old.some(o=>o.id===r.id)),'30 events; archive and saved identifiers preserved');
  check(data.filter(r=>r.seasonConfirmed).length===11,'11 officially announced seasons');
  check(data.filter(r=>!r.seasonConfirmed).every(r=>r.competitionStatus==='awaiting_announcement' && r.eventDate===null && r.registrationDeadline===null && r.edition===null),'unannounced 2027 plans have no fabricated season or dates');
  check(data.every(r=>!r.seasonConfirmed || r.seasonSourceUrl),'announced seasons have primary sources');
  check(data.filter(r=>r.image).length>=27,'official media added to at least 27 cards');
  for(const r of data.filter(r=>r.image))assert.ok(fs.existsSync(path.join(root,r.image.src)));
  check(true,'all official local media files exist');
  const banned=/Название и источник проверены|Проверены названия|реальных мероприятий|Реальные мероприятия|Проектная информация|проект информационной системы|2025|localStorage|демо-данные/;
  for(const target of ['index.html','competitions.html','saved.html','sources.html']){
   await go(target);check(!banned.test(await page.locator('body').innerText()),'clean public copy: '+target);
  }
  await go('index.html');check(await page.locator('#upcoming .event-card').count()===3,'three diverse announced events');
  check(await page.locator('.hero-visual img').getAttribute('src')==='./assets/images/official/big-change-photo.jpg','official event photo in hero');
  check((await page.locator('#about').innerText()).includes('Учителям') && (await page.locator('#about').innerText()).includes('Организаторам'),'all service audiences represented');
  await shot('home-1440.png');
  await go('competitions.html');check(await page.locator('#results .event-card').count()===24,'catalogue pagination retained');
  await page.locator('[name=season]').selectOption('announced');check((await page.locator('#count').innerText())==='Найдено: 11','announced season filter');
  await page.reload();await page.waitForSelector('#filters');check(await page.locator('[name=season]').inputValue()==='announced','season filter survives reload');
  await page.locator('[name=season]').selectOption('awaiting_announcement');check((await page.locator('#count').innerText())==='Найдено: 19','pending announcement filter');
  await go('competitions.html');await page.locator('[name=q]').fill('Ломоносов');check(await page.locator('#results .event-card').count()===1,'title search');
  await page.locator('#results [data-save]').click();await page.reload();await page.waitForSelector('#results [data-save]');check(await page.locator('#results [data-save]').getAttribute('aria-pressed')==='true','saved event survives refresh');
  await go('saved.html');check(await page.locator('.event-card').count()===1,'saved route works');
  for(const r of data){
   await go('competition.html?id='+r.id);assert.equal(await page.locator('h1').innerText(),r.title);
   const text=await page.locator('body').innerText();assert.ok(!banned.test(text),r.id+' public copy');
   assert.equal(await page.getByRole('link',{name:'Открыть официальный сайт ↗'}).getAttribute('href'),r.officialUrl);
   if(!r.seasonConfirmed){assert.ok(text.includes('Анонс нового сезона пока не опубликован'));assert.ok(text.includes('2027 год'));}
   if(r.image){await page.locator('.detail-visual img').evaluate(i=>i.decode());assert.ok(await page.locator('.detail-visual img').evaluate(i=>i.naturalWidth>0));}
  }
  check(true,'all 30 detail pages, organizer links, media and date labels');
  for(const width of [1440,1024,768,390]){
   await page.setViewportSize({width,height:950});
   for(const target of ['index.html','competitions.html','competition.html?id=verified-it-planet-2025','competition.html?id=verified-nto-school-2025','saved.html','sources.html']){
    await go(target);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),target+' width '+width);
   }
   check(true,'six public routes without overflow at '+width);
  }
  await page.setViewportSize({width:390,height:844});await go('index.html');await shot('home-390.png');
  await page.locator('#menu-toggle').click();check(await page.locator('#main-menu').isVisible(),'mobile menu opens');await page.keyboard.press('Escape');check(!await page.locator('#main-menu').isVisible(),'mobile menu closes');
  await go('competitions.html');await shot('catalog-390.png');
  await go('competition.html?id=verified-nto-school-2025');await shot('detail-390.png');
  await page.setViewportSize({width:1440,height:1000});await go('competitions.html');await shot('catalog-1440.png');
  await go('competition.html?id=verified-it-planet-2025');await shot('pending-detail-1440.png');
  check(errors.length===0,'no JavaScript errors');check(bad.length===0,'no missing local resources');
  fs.writeFileSync(path.join(output,'test-results.txt'),`PASSED ${passed}\nFAILED 0\nSKIPPED 0\n`);console.log(`PASSED ${passed} / FAILED 0 / SKIPPED 0`);
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
