/* Run from any directory. Requires Playwright only for development checks. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'ui-screenshots', 'public-landing');
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
    res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.pdf':'application/pdf'})[path.extname(target)] || 'text/plain');
    res.end(body);
  });
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}${prefix}`;
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || undefined,headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage();
    await page.clock.install({time:new Date('2026-10-14T12:00:00+03:00')});
    const jsErrors=[],badRequests=[],writes=[];
    page.on('pageerror',error=>jsErrors.push(error.message));
    page.on('response',response=>{if(response.status()>=400)badRequests.push(response.url());});
    page.on('request',request=>{if(request.method()!=='GET')writes.push(request.url());});
    async function go(file) { await page.goto(origin+file); await page.waitForFunction(()=>!document.querySelector('#app').classList.contains('loading')); }
    async function screenshot(file) { await page.clock.runFor(5000); await page.evaluate(async()=>{document.querySelectorAll('img').forEach(img=>img.loading='eager');await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));}); await page.screenshot({path:path.join(output,file),fullPage:true}); }
    fs.mkdirSync(output,{recursive:true});
    const official=JSON.parse(fs.readFileSync(path.join(root,'data/competitions.json'),'utf8'));
    const showcase=JSON.parse(fs.readFileSync(path.join(root,'data/showcase-competitions.json'),'utf8'));
    const categories=JSON.parse(fs.readFileSync(path.join(root,'data/categories.json'),'utf8'));
    check(official.length===918 && new Set(official.map(r=>r.id)).size===918,'918 official unique records');
    check(official.every(r=>r.dataType==='official' && r.eventDate===null && r.registrationDeadline===null && r.officialUrl===null),'no fabricated official dates or URLs');
    check(showcase.length===8 && showcase.every(r=>r.dataType==='showcase' && r.id.startsWith('showcase-')),'8 separate showcase records');
    check(new Set([...official,...showcase].map(r=>r.id)).size===926,'no cross-collection ID collision');
    await go('index.html');
    check(await page.locator('#upcoming .event-card').count()===3,'three upcoming concepts');
    check(await page.locator('#recommended .event-card[data-type=official]').count()===3,'official editorial recommendations');
    check(await page.locator('#directions .direction-card').count()===23,'all 23 directions represented');
    check(await page.locator('.steps li').count()===4 && await page.locator('.benefit-list>div').count()===4,'how it works and service benefits');
    check(!/демо-данные|localStorage/i.test(await page.locator('body').innerText()),'no technical demo banners');
    check(await page.evaluate(()=>Object.keys(CompetitionTopics.all).length===23 && CompetitionTopics.get('missing').image.endsWith('general.jpg')),'mapping coverage and general fallback');
    const paths=await page.evaluate(()=>[...new Set(Object.keys(CompetitionTopics.all).map(c=>CompetitionTopics.get(c).image))]);
    for(const image of paths){const response=await page.request.get(origin+image);assert.equal(response.status(),200);}
    check(paths.length===17,'all 17 thematic images load over subpath');
    const originalHtml=fs.readFileSync(path.join(root,'../olympiads.html'),'utf8');
    const preserved=await page.evaluate(html=>[...new DOMParser().parseFromString(html,'text/html').querySelectorAll('article.olympiad')].map(el=>({title:el.querySelector('h2').textContent,category:el.dataset.direction,sourceNumber:el.querySelector('span').textContent.slice(2)})),originalHtml);
    check(preserved.length===official.length && preserved.every((row,index)=>Object.keys(row).every(key=>row[key]===official[index][key])),'all source titles numbers and categories unchanged');
    await screenshot('home-1440.png');
    await go('competitions.html');
    check(await page.locator('#results .event-card').count()===24,'24 cards per page');
    check((await page.locator('#count').innerText())==='Найдено: 918','official collection isolated');
    check(await page.locator('#results img').count()===24 && await page.locator('#results [data-save]').count()===24,'image and save action on each card');
    await page.locator('#next').click();check((await page.locator('#pagination').innerText()).startsWith('2 /'),'pagination next');
    await page.locator('[name=q]').fill('олимпиада');check(await page.locator('#results .event-card').count()>0,'positive title search');
    await page.locator('[name=q]').fill('несуществующаястрока123');check(await page.locator('#results .event-card').count()===0,'empty search');
    await page.locator('[name=q]').fill('');await page.locator('[name=category]').selectOption(categories[0]);
    check((await page.locator('#count').innerText())==='Найдено: '+official.filter(r=>r.category===categories[0]).length,'exact category filter');
    await page.reload();await page.waitForSelector('#filters');check(await page.locator('[name=category]').inputValue()===categories[0],'filters restore from URL');
    await page.locator('[name=audience]').selectOption('spo');check(await page.locator('#results .event-card').count()===0,'no invented SPO eligibility');
    await page.locator('[name=audience]').selectOption('');await page.locator('[name=verification]').selectOption('verified');check(await page.locator('#results .event-card').count()===0,'verification filter');
    await go('competitions.html?page=Infinity');check((await page.locator('#pagination').innerText()).startsWith('1 /'),'invalid page handled');
    await go('competitions.html?collection=showcase');check((await page.locator('#count').innerText())==='Найдено: 8','showcase collection isolated');
    await page.locator('#results [data-save]').first().click();await page.reload();await page.waitForSelector('[data-save]');check(await page.locator('#results [data-save]').first().getAttribute('aria-pressed')==='true','card saving persists after refresh');
    await go('saved.html');check(await page.locator('.event-card').count()===1,'saved supports showcase');
    await page.locator('[data-save]').click();check(await page.locator('.event-card').count()===0,'remove saved');
    const record=official[0];await go('competition.html?id='+record.id);
    check(await page.locator('h1').innerText()===record.title,'official title preserved');
    check(await page.locator('.detail-visual img').count()===1 && await page.locator('.detail-section').count()===3,'full official detail layout');
    check(await page.getByRole('button',{name:/Перейти на сайт организатора/}).isDisabled(),'missing official URL explicitly disabled');
    check((await page.locator('.facts').innerText()).includes('Информация уточняется'),'unknown fields explained');
    await page.locator('.detail-aside [data-save]').click();await page.reload();await page.waitForSelector('.detail-aside');check(await page.locator('.detail-aside [data-save]').getAttribute('aria-pressed')==='true','detail saving persists');
    await page.evaluate(id=>localStorage.setItem('competitionOverrides',JSON.stringify({[id]:{officialUrl:'https://example.org/confirmed'}})),record.id);await page.reload();await page.waitForSelector('.detail-aside');
    check(await page.locator('.detail-aside a[target=_blank]').getAttribute('href')==='https://example.org/confirmed','confirmed URL used without rewrite');
    await page.evaluate(id=>localStorage.setItem('competitionOverrides',JSON.stringify({[id]:{officialUrl:'javascript:alert(1)',title:'<img src=x onerror=alert(1)>'}})),record.id);await page.reload();await page.waitForSelector('.detail-aside');
    check(await page.locator('h1 img').count()===0 && await page.locator('.detail-aside a[target=_blank]').count()===0,'XSS title escaped and unsafe URL rejected');
    await page.evaluate(()=>localStorage.removeItem('competitionOverrides'));
    await go('competition.html?id='+showcase[0].id);check((await page.locator('.collection-note').innerText()).includes('Авторский концепт'),'concept provenance visible');
    await page.locator('.detail-aside a').click();await page.waitForSelector('#apply-button');
    check(new URL(page.url()).pathname.endsWith('/organizer-demo.html'),'organizer route under repository subpath');
    check(await page.locator('.three-steps li').count()===3 && await page.locator('.faq').count()===3,'organizer stages and FAQ');
    await page.locator('#apply-button').click();check(await page.locator('#application-dialog').isVisible(),'application opens');
    check(await page.locator('#application-dialog input').count()===0 && (await page.locator('#application-dialog').innerText()).includes('Регистрация не проводится'),'no false real registration or personal data');
    await page.locator('#application-save').click();check((await page.locator('#application-status').innerText()).includes('Сохранено'),'application saves interest');
    await page.keyboard.press('Escape');check(!await page.locator('#application-dialog').isVisible(),'dialog closes with Escape');
    await screenshot('organizer-1440.png');
    await go('organizer-demo.html?id='+official[0].id);check((await page.locator('h1').innerText()).includes('не найдено'),'official ID cannot open fictitious organizer');
    await go('competition.html?id=missing');check((await page.locator('h1').innerText()).includes('не найдено'),'unknown record handled');
    for(const width of [1440,1024,768,390]){
      await page.setViewportSize({width,height:950});
      for(const target of ['index.html','competitions.html','competition.html?id='+showcase[0].id,'organizer-demo.html?id='+showcase[0].id,'saved.html']){
        await go(target);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width} ${target}`);
      }
      check(true,'no overflow across 5 routes at '+width);
    }
    await page.setViewportSize({width:390,height:844});await go('index.html');
    check(!await page.locator('#main-menu').isVisible(),'mobile menu collapsed');
    await page.locator('#menu-toggle').click();check(await page.locator('#main-menu').isVisible(),'mobile menu opens');
    await page.keyboard.press('Escape');check(!await page.locator('#main-menu').isVisible(),'mobile menu closes by keyboard');
    await screenshot('home-390.png');
    await go('competitions.html');await screenshot('catalog-390.png');
    await go('competition.html?id='+showcase[0].id);await screenshot('detail-390.png');
    await go('organizer-demo.html?id='+showcase[0].id);await screenshot('organizer-390.png');
    await page.setViewportSize({width:1440,height:1000});await go('competitions.html');await screenshot('catalog-1440.png');
    await go('competition.html?id='+showcase[0].id);await screenshot('detail-1440.png');
    check(jsErrors.length===0,'no JavaScript errors');check(badRequests.length===0,'no resource errors');check(writes.length===0,'no backend requests');
    const failPage=await context.newPage();await failPage.route('**/data/competitions.json',route=>route.fulfill({status:503,body:'unavailable'}));await failPage.goto(origin+'competitions.html');await failPage.waitForSelector('#retry');check(await failPage.locator('#retry').isVisible(),'fetch failure has retry state');await failPage.close();
    console.log(`PASSED ${passed} / FAILED 0 / SKIPPED 0`);
    fs.writeFileSync(path.join(output,'test-results.txt'),`PASSED ${passed}\nFAILED 0\nSKIPPED 0\nHTTP subpath: ${prefix}\nWidths: 1440, 1024, 768, 390\n`);
  } finally { await browser.close(); server.close(); }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
