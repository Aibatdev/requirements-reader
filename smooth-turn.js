// Keep the previous pixels until the new spread is ready. No PDF work in animation frames.
export function captureSpread(book){
 const layer=document.createElement('div');layer.className='spread-outgoing';layer.setAttribute('aria-hidden','true');
 for(const source of book.querySelectorAll(':scope > canvas:not(.curl-sheet)')){
  const copy=document.createElement('canvas');copy.width=source.width;copy.height=source.height;
  copy.style.width=source.style.width;copy.style.height=source.style.height;
  copy.getContext('2d').drawImage(source,0,0);layer.append(copy);
 }
 return layer.children.length?layer:null;
}
export async function animateSpread(book,old,canvases,direction){
 if(!old)return;
 book.append(old);book.classList.add('turning');
 const options={duration:360,easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'};
 const animations=[old.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${-direction*24}px)`}],options),
  ...canvases.map(canvas=>canvas.animate([{opacity:0,transform:`translateX(${direction*24}px)`},{opacity:1,transform:'translateX(0)'}],options))];
 try{await Promise.all(animations.map(animation=>animation.finished));}
 finally{animations.forEach(animation=>animation.cancel());old.remove();book.classList.remove('turning');}
}
