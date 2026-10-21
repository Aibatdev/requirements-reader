const headingCache = new WeakMap();
export function lectureNumber(text) {
  const match = text.normalize('NFKC').trim().match(/^ДӘРІС\s+(\d+)\s*$/iu);
  return match ? Number(match[1]) : null;
}
export function googleFormURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'forms.gle' ||
      url.hostname === 'docs.google.com' && url.pathname.startsWith('/forms/')) ? url.href : null;
  } catch { return null; }
}
async function headings(pdf, source) {
  if (!headingCache.has(pdf)) headingCache.set(pdf, new Map());
  const cache = headingCache.get(pdf);
  if (!cache.has(source)) cache.set(source, (async () => {
    const page = await pdf.getPage(source), viewport = page.getViewport({scale:1});
    const text = await page.getTextContent();
    return text.items.flatMap(item => {
      const number = lectureNumber(item.str || '');
      if (!number && !/^\d+\s*\.\s*\d+\s*\.?$/.test((item.str || '').trim())) return [];
      const [x,y] = viewport.convertToViewportPoint(item.transform[4],item.transform[5]);
      const height = Math.max(item.height || Math.hypot(item.transform[2],item.transform[3]),10);
      return [{number,text:item.str,rawY:item.transform[5],x:Math.max(0,x-5)/viewport.width,y:Math.max(0,y-height-4)/viewport.height,
        width:(item.width+10)/viewport.width,height:(height+9)/viewport.height}];
    });
  })());
  return cache.get(source);
}
export async function attachBookInteractions(pdf, profile, entries, canvases, book, isCurrent, select) {
  const groups = await Promise.all(entries.map(entry => profile.formPages?.includes(entry.source) ? [] : headings(pdf,entry.source)));
  if (!isCurrent()) return;
  const layer = book.querySelector('.pdf-links');
  if (!layer) return;
  groups.forEach((headings,i) => {
    const canvas=canvases[i], width=parseFloat(canvas.style.width),height=parseFloat(canvas.style.height);
    for (const heading of headings) {
      const section=profile.contents.find(item=>item.page===entries[i].source && (heading.number ? item.key===`lecture-${heading.number}` : item.depth===2 && item.matchText===heading.text && Math.abs(item.anchor.y-heading.rawY)<2));
      if (!section) continue;
      const button=document.createElement('button');
      button.type='button';button.className='pdf-link chapter-hotspot';button.dataset.section=section.key;
      button.setAttribute('aria-label',`${section.title} · мазмұнында көрсету`);
      button.style.cssText=`left:${canvas.offsetLeft+heading.x*width}px;top:${canvas.offsetTop+heading.y*height}px;width:${heading.width*width}px;height:${heading.height*height}px`;
      button.onclick=e=>{e.stopPropagation();select(section.page, section.key);};
      layer.append(button);
    }
    if (profile.formPages?.includes(entries[i].source)) {
      const url=googleFormURL(profile.selfCheckUrl),card=document.createElement('div');
      card.className='book-test-card';
      card.style.cssText=`left:${canvas.offsetLeft+width*.1}px;top:${canvas.offsetTop+height*.3}px;width:${width*.8}px`;
      if(url){const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.className='pdf-link form-link';link.textContent='Тестті Google Forms-та ашу ↗';link.onclick=e=>e.stopPropagation();card.append(link);}
      else {const note=document.createElement('p');note.textContent='Google Forms сілтемесі әлі қосылмаған.';card.append(note);}
      layer.append(card);
    }
  });
}
