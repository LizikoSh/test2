if (!window.GARMIN_CONTENT || !Array.isArray(window.GARMIN_CONTENT.posts)) {
  document.body.innerHTML = `<div style="max-width:680px;margin:40px auto;padding:24px;font-family:Arial,sans-serif;line-height:1.5"><h2>Не завантажився content.js</h2><p>Перевірте, що <b>content.js</b> лежить у корені поруч з index.html та app.js.</p></div>`;
  throw new Error('GARMIN_CONTENT is missing');
}

const POSTS = window.GARMIN_CONTENT?.posts || [];
const STORIES = window.GARMIN_CONTENT?.stories || [];

const SIMPLE_POSTS = Array.from({length:12}, (_,i)=>{
  const num=String(i+1).padStart(2,'0');
  return {
    simple:true,
    key:`simple-${num}`,
    title:'Garmin',
    date:'',
    format:'Фото',
    count:1,
    caption:'',
    cta:'',
    slides:[],
    stories:[],
    layout:'Фото приладу Garmin без текстового оверлею.',
    images:[`assets/img-simple-${num}.jpg`],
    hashtags:''
  };
});

function buildGridRows(){
  const rows=[];
  const n=POSTS.length;

  // Підбираємо кількість рядків так, щоб:
  // 1) верхній ряд був повністю заповнений;
  // 2) порожні комірки залишалися лише в найнижчому рядку;
  // 3) чисті фото стояли в центрі кожного другого рядка.
  let rowCount=1;
  let simpleCount=0;
  let blanks=0;

  for(let r=1;r<100;r++){
    const k=Math.min(SIMPLE_POSTS.length, Math.floor(r/2));
    const b=3*r-(n+k);
    if((b===1||b===2) && n+k<=3*r){
      rowCount=r;
      simpleCount=k;
      blanks=b;
      break;
    }
  }

  // Запасний варіант для нетипової кількості публікацій.
  if(!rowCount || rowCount===1 && n>3){
    simpleCount=Math.min(SIMPLE_POSTS.length, Math.floor(n/5));
    rowCount=Math.ceil((n+simpleCount)/3);
    blanks=3*rowCount-(n+simpleCount);
  }

  let postIndex=0;
  let simpleIndex=0;
  const bottomPosts=Math.max(1, 3-blanks);

  // Найнижчий ряд: старі публікації притиснуті вліво,
  // тому перша публікація залишається внизу ліворуч.
  const firstBatch=POSTS.slice(postIndex, postIndex+bottomPosts);
  postIndex+=firstBatch.length;
  const bottomRow=[...firstBatch].reverse().concat(Array(3-firstBatch.length).fill(null));
  rows.push(bottomRow);

  // Далі: кожен другий ряд має чисте фото строго в центрі.
  for(let rowNo=2; rowNo<=rowCount; rowNo++){
    const isSimpleRow=rowNo%2===0 && simpleIndex<simpleCount;

    if(isSimpleRow){
      const older=POSTS[postIndex++]||null;
      const newer=POSTS[postIndex++]||null;
      const simple=SIMPLE_POSTS[simpleIndex++];
      rows.push([newer, simple, older]);
    }else{
      const batch=POSTS.slice(postIndex, postIndex+3);
      postIndex+=batch.length;
      const visual=[...batch].reverse();
      while(visual.length<3) visual.unshift(null);
      rows.push(visual);
    }
  }

  return rows;
}

const GRID_ROWS=buildGridRows();

function buildTimeline(){
  // Читаємо кожен рядок у хронологічному напрямку справа наліво.
  // Так порядок існуючих дописів 1,2,3... не змінюється.
  const items=[];
  GRID_ROWS.forEach(row=>{
    [...row].reverse().forEach(item=>{if(item) items.push(item)});
  });
  return items;
}
const TIMELINE=buildTimeline();

const feed=document.getElementById('feed');
const continuousOverlay=document.getElementById('continuousOverlay');
const continuousFeed=document.getElementById('continuousFeed');
const closeContinuous=document.getElementById('closeContinuous');
const jumpFirst=document.getElementById('jumpFirst');
const storyAvatarHotspot=document.getElementById('storyAvatarHotspot');
const storiesOverlay=document.getElementById('storiesOverlay');
const closeStories=document.getElementById('closeStories');
const storyPrev=document.getElementById('storyPrev');
const storyNext=document.getElementById('storyNext');
const openRelatedPost=document.getElementById('openRelatedPost');
let storyIndex=0;

function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function nl(v){return esc(v).replace(/\n/g,'<br>')}
function itemId(post){return post.simple?post.key:String(post.n)}
function images(post){return Array.isArray(post.images)&&post.images.length?post.images:[`assets/post-${String(post.n).padStart(2,'0')}.jpg`]}
function coverImage(post){return post.simple?post.images[0]:`assets/post-${String(post.n).padStart(2,'0')}.jpg`}
function tags(post){if(Object.prototype.hasOwnProperty.call(post,'hashtags'))return post.hashtags||'';const t=(post.title||'').toLowerCase();const a=['#4garmin_смартгодинники','#garminukraine'];if(t.includes('edge'))a.push('#garmin_edge');else if(t.includes('tacx'))a.push('#garmin_tacx');else if(t.includes('tactix'))a.push('#garmin_tactix');else if(t.includes('fēnix')||t.includes('fenix'))a.push('#garmin_fenix');else a.push('#garmin');return a.join(' ')}
function metrics(post){const seed=post.simple?30+Number(post.key.slice(-2)):Number(post.n||1);return{likes:3+seed%9,comments:seed%3,reposts:(seed+1)%2}}

function uiIcon(name){
 const common='viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
 const icons={
  heart:`<svg ${common}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>`,
  comment:`<svg ${common}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.38 8.38 0 0 1 12.5 3h.5a8.48 8.48 0 0 1 8 8Z"/></svg>`,
  repost:`<svg ${common}><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  send:`<svg ${common}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
  bookmark:`<svg ${common}><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"/></svg>`,
  menu:`<svg ${common}><path d="M7 8h13"/><path d="M7 16h13"/></svg>`
 };
 return icons[name]||'';
}

function makeTile(item){
  const b=document.createElement('button');
  b.type='button';
  b.className=`tile${item.simple?' tile-simple':''}`;
  b.innerHTML=`<img src="${coverImage(item)}" alt="${item.simple?'Фото приладу Garmin':esc(item.title)}">`;
  b.addEventListener('click',()=>openContinuous(itemId(item)));
  return b;
}

function renderGrid(){
  feed.innerHTML='';
  [...GRID_ROWS].reverse().forEach(row=>{
    row.forEach(item=>{
      if(item){
        feed.appendChild(makeTile(item));
      }else{
        const spacer=document.createElement('div');
        spacer.className='tile-placeholder';
        spacer.setAttribute('aria-hidden','true');
        feed.appendChild(spacer);
      }
    });
  });
}
renderGrid();

function postArticle(post){
 const ims=images(post);const m=metrics(post);const hs=tags(post);const id=itemId(post);
 const slides=post.slides||[];const stories=post.stories||[];
 const dots=ims.length>1?ims.map((_,i)=>`<button class="continuous-dot ${i===0?'active':''}" type="button" data-slide="${i}" aria-label="Слайд ${i+1}"></button>`).join(''):'';
 const author=`<div class="continuous-author-main"><img src="assets/avatar.png" alt="4garmin"><strong>4garmin</strong></div><button class="continuous-menu" type="button" aria-label="Меню допису">${uiIcon('menu')}</button>`;
 const captionVisible=Boolean(post.caption||hs||post.date);
 const caption=captionVisible?`<div class="continuous-caption"><strong>4garmin</strong>${post.caption?` <span class="caption-body">${nl(post.caption)}</span>`:''}${hs?`<div class="continuous-hashtags">${esc(hs)}</div>`:''}${post.date?`<div class="continuous-date">${esc(post.date)}</div>`:''}</div>`:(post.simple?`<div class="continuous-caption continuous-caption-empty"></div>`:'');
 const notes=!post.simple?`<details class="continuous-notes"><summary>Виробничі нотатки</summary><div class="continuous-notes-inner"><h4>Структура</h4><ol>${slides.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>${stories.length?`<h4>Stories</h4><ul>${stories.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:''}<h4>Макет</h4><div>${esc(post.layout||'')}</div><h4>CTA</h4><div>${esc(post.cta||'')}</div></div></details>`:'';
 return `<article class="continuous-post${post.simple?' continuous-post-simple':''}" id="continuous-post-${id}" data-post="${id}" data-slide="0">
  <div class="continuous-author continuous-author-mobile">${author}</div>
  <div class="continuous-post-grid">
   <div class="continuous-media-col">
    <div class="continuous-media-wrap">
     <img class="continuous-media" src="${ims[0]}" alt="${post.simple?'Фото приладу Garmin':esc(post.title)}">
     <button class="continuous-slide-prev" type="button" aria-label="Попередній слайд" ${ims.length<2?'hidden':''}>‹</button>
     <button class="continuous-slide-next" type="button" aria-label="Наступний слайд" ${ims.length<2?'hidden':''}>›</button>
    </div>
    <div class="continuous-dots continuous-dots-desktop">${dots}</div>
   </div>
   <div class="continuous-text-col">
    <div class="continuous-author continuous-author-desktop">${author}</div>
    ${caption}
    <div class="continuous-admin-row"><button class="continuous-stat-btn" type="button">Переглянути статистику</button><button class="continuous-promote-btn" type="button">Просувати допис</button></div>
    <div class="continuous-dots continuous-dots-mobile">${dots}</div>
    <div class="continuous-actions">
      <span class="continuous-action">${uiIcon('heart')}<b>${m.likes}</b></span>
      <span class="continuous-action">${uiIcon('comment')}</span>
      <span class="continuous-action">${uiIcon('repost')}${m.reposts?`<b>${m.reposts}</b>`:''}</span>
      <span class="continuous-action">${uiIcon('send')}</span>
      <span class="continuous-action save">${uiIcon('bookmark')}</span>
    </div>
    ${notes}
   </div>
  </div>
 </article>`
}

function renderContinuous(){
  continuousFeed.innerHTML=[...TIMELINE].reverse().map(postArticle).join('');
  const byId=new Map(TIMELINE.map(item=>[itemId(item),item]));
  continuousFeed.querySelectorAll('.continuous-post').forEach(article=>{
    const id=article.dataset.post;const post=byId.get(id);if(!post)return;
    const ims=images(post);let idx=0;
    const img=article.querySelector('.continuous-media');const dots=[...article.querySelectorAll('.continuous-dot')];
    function show(i){idx=(i+ims.length)%ims.length;article.dataset.slide=idx;img.src=ims[idx];img.alt=post.simple?'Фото приладу Garmin':`${post.title} — слайд ${idx+1}`;dots.forEach((d,j)=>d.classList.toggle('active',j===idx))}
    article.querySelector('.continuous-slide-prev')?.addEventListener('click',()=>show(idx-1));
    article.querySelector('.continuous-slide-next')?.addEventListener('click',()=>show(idx+1));
    dots.forEach(d=>d.addEventListener('click',()=>show(Number(d.dataset.slide))));
    const wrap=article.querySelector('.continuous-media-wrap');let sx=null,sy=null;
    wrap.addEventListener('touchstart',e=>{sx=e.changedTouches[0].clientX;sy=e.changedTouches[0].clientY},{passive:true});
    wrap.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;sx=sy=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.2&&ims.length>1)show(idx+(dx<0?1:-1))},{passive:true});
  });
}
renderContinuous();

function openContinuous(postKey=1){const id=String(postKey);continuousOverlay.classList.add('open');document.body.style.overflow='hidden';requestAnimationFrame(()=>{document.getElementById(`continuous-post-${id}`)?.scrollIntoView({block:'start'})})}
function closeContinuousViewer(){continuousOverlay.classList.remove('open');document.body.style.overflow=''}
closeContinuous.addEventListener('click',closeContinuousViewer);jumpFirst.addEventListener('click',()=>document.getElementById('continuous-post-1')?.scrollIntoView({behavior:'smooth',block:'start'}));

/* Stories */
function renderProgress(){document.getElementById('storiesProgress').innerHTML=STORIES.map((_,i)=>`<span class="story-progress-segment ${i<storyIndex?'done':i===storyIndex?'active':''}"></span>`).join('')}
function storyWidgetHtml(s){if(s.type==='poll')return s.options.map((o,i)=>`<button class="story-option" data-option="${i}">${esc(o)}</button>`).join('');if(s.type==='quiz')return s.options.map((o,i)=>`<button class="story-option" data-correct="${i===s.correct?'1':'0'}">${esc(o)}</button>`).join('');if(s.type==='question')return `<div class="story-question-box"><span>Стікер «Питання»</span><div>${esc(s.placeholder||'Ваша відповідь…')}</div></div>`;if(s.type==='share')return `<button class="story-share-button" type="button">${esc(s.button||'Дивитися допис')}</button>`;if(s.type==='quote')return `<div class="story-quote">${esc(s.body)}</div>`;return''}
function renderStory(){const s=STORIES[storyIndex];renderProgress();document.getElementById('storyDate').textContent=s.date;document.getElementById('storyEyebrow').textContent=s.eyebrow||'';document.getElementById('storyTitle').textContent=s.title||'';document.getElementById('storyBody').textContent=s.type==='quote'?'':(s.body||'');document.getElementById('storyFooter').textContent=s.footer||'';document.getElementById('storyIndex').textContent=`${storyIndex+1} / ${STORIES.length}`;document.getElementById('storyCard').className=`story-card bg-${s.bg||'dark'}`;const w=document.getElementById('storyWidget');w.innerHTML=storyWidgetHtml(s);w.querySelectorAll('.story-option').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();w.querySelectorAll('.story-option').forEach(x=>x.classList.remove('selected','correct','wrong'));if(s.type==='quiz'){btn.classList.add(btn.dataset.correct==='1'?'correct':'wrong');if(btn.dataset.correct!=='1')w.querySelector('[data-correct="1"]')?.classList.add('correct')}else btn.classList.add('selected')}));w.querySelector('.story-share-button')?.addEventListener('click',e=>{e.stopPropagation();if(s.post){closeStoriesViewer();openContinuous(s.post)}});openRelatedPost.style.display=s.post?'':'none'}
function openStoriesViewer(i=0){storyIndex=Math.max(0,Math.min(STORIES.length-1,i));renderStory();storiesOverlay.classList.add('open');document.body.style.overflow='hidden'}
function closeStoriesViewer(){storiesOverlay.classList.remove('open');document.body.style.overflow=''}
function nextStory(){if(storyIndex>=STORIES.length-1)closeStoriesViewer();else{storyIndex++;renderStory()}}function prevStory(){if(storyIndex>0){storyIndex--;renderStory()}}
storyAvatarHotspot.addEventListener('click',()=>openStoriesViewer(0));closeStories.addEventListener('click',closeStoriesViewer);storyNext.addEventListener('click',nextStory);storyPrev.addEventListener('click',prevStory);openRelatedPost.addEventListener('click',()=>{const s=STORIES[storyIndex];if(s.post){closeStoriesViewer();openContinuous(s.post)}});
document.addEventListener('keydown',e=>{if(storiesOverlay.classList.contains('open')){if(e.key==='Escape')closeStoriesViewer();if(e.key==='ArrowRight')nextStory();if(e.key==='ArrowLeft')prevStory();return}if(continuousOverlay.classList.contains('open')&&e.key==='Escape')closeContinuousViewer()});
