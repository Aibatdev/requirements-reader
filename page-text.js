import {TextLayer} from './vendor/pdf.mjs';
const cache=new WeakMap();
export function pageText(pdf,source){
 if(!cache.has(pdf))cache.set(pdf,new Map());
 const pages=cache.get(pdf);
 if(!pages.has(source))pages.set(source,pdf.getPage(source).then(page=>page.getTextContent()));
 return pages.get(source);
}
export function hiddenItem(item,masks=[]){
 return masks.some(mask=>item.str?.trim()===mask.text && Math.abs(item.transform[4]-mask.x)<1 && Math.abs(item.transform[5]-mask.y)<1);
}
export async function hidePrintedNumbers(pdf,entry,profile,context,viewport){
 const masks=profile.hiddenPageNumbers?.[entry.source];if(!masks?.length)return;
 const text=await pageText(pdf,entry.source);
 context.save();context.fillStyle='#fff';
 for(const item of text.items){
  if(!hiddenItem(item,masks))continue;
  const [x,y]=viewport.convertToViewportPoint(item.transform[4],item.transform[5]);
  const height=(item.height||Math.hypot(item.transform[2],item.transform[3]))*viewport.scale;
  const pad=viewport.scale;
  context.fillRect(x-pad,y-height-pad,item.width*viewport.scale+2*pad,height+3*pad);
 }
 context.restore();
}
export async function attachTextLayers(pdf,entries,canvases,profile,book,isCurrent){
 const layers=await Promise.all(entries.map(async(entry,i)=>{
  if(profile.formPages?.includes(entry.source))return null;
  const page=await pdf.getPage(entry.source),text=await pageText(pdf,entry.source);
  const canvas=canvases[i],scale=parseFloat(canvas.style.width)/entry.width;
  const layer=document.createElement('div');layer.className='textLayer';layer.dataset.source=entry.source;
  layer.style.setProperty('--scale-factor',scale);
  const renderer=new TextLayer({textContentSource:{...text,items:text.items.filter(item=>!hiddenItem(item,profile.hiddenPageNumbers?.[entry.source]))},container:layer,viewport:page.getViewport({scale})});
  await renderer.render();return layer;
 }));
 if(!isCurrent())return;
 const group=document.createElement('div');group.className='page-text-layers';
 layers.forEach((layer,i)=>{if(!layer)return;layer.style.left=`${canvases[i].offsetLeft}px`;layer.style.top=`${canvases[i].offsetTop}px`;group.append(layer);});
 book.append(group);
}
