/* A picture of the saved café, composed from the café artwork and selected décor. */
const cafePhotoDialog=document.createElement('dialog');
cafePhotoDialog.className='cafe-photo-dialog';
cafePhotoDialog.innerHTML='<button class="secondary" id="close-cafe-photo" aria-label="Kapat">×</button><h2>Kafenin son hali</h2><img alt="" id="cafe-photo"><button class="primary" id="return-to-cafe">Kafeme dön</button>';
document.body.appendChild(cafePhotoDialog);
cafePhotoDialog.querySelector('#close-cafe-photo').onclick=()=>cafePhotoDialog.close();
cafePhotoDialog.querySelector('#return-to-cafe').onclick=()=>{cafePhotoDialog.close();tab='cafe';render()};
const cafePhotoStyle=document.createElement('style');
cafePhotoStyle.textContent='.cafe-photo-dialog{width:min(720px,94vw);max-height:92dvh;overflow:auto;border:2px solid white;border-radius:28px;padding:20px;background:#fff0fa;color:#45304f}.cafe-photo-dialog::backdrop{background:#34203caa;backdrop-filter:blur(6px)}.cafe-photo-dialog img{display:block;width:100%;border-radius:18px;margin:14px 0 20px}.cafe-photo-dialog #close-cafe-photo{float:right}.saved-cafe-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#e9b3d8;z-index:2}';
cafePhotoStyle.textContent+='#scene .scene-character,#scene .mascot,#scene .machine,#scene .sign,#scene .scene-label{z-index:3}#scene .plant{display:none}';
document.head.appendChild(cafePhotoStyle);
let cafeArtwork=null,cafeArtworkReady=null,lastCafePhotoKey='',lastCafePhotoAccount=null;
const cafePreviewImages=new Map();
function loadCafeArtwork(){if(!cafeArtworkReady){cafeArtwork=new Image();cafeArtwork.src='/assets/universe.png';cafeArtworkReady=cafeArtwork.decode().catch(error=>{cafeArtworkReady=null;throw error})}return cafeArtworkReady;}
function previewImage(file){if(cafePreviewImages.has(file))return cafePreviewImages.get(file);const task=(async()=>{const image=new Image();const svg=await fetch('/assets/'+file).then(r=>r.text());image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();return image})();cafePreviewImages.set(file,task);task.catch(()=>cafePreviewImages.delete(file));return task;}

let cafePhotoRevision=0;
async function updateCafePhoto(show=false){
 if(!show&&(document.hidden||!$('scene')?.getClientRects().length))return;
 const account=state.cafeCode||globalThis.CafeAccountID||'device';
 if(account!==lastCafePhotoAccount){lastCafePhotoAccount=account;lastCafePhotoKey='';cafePreviewImages.clear();cafePhotoDialog.querySelector('#cafe-photo').removeAttribute('src');document.querySelector('#scene .saved-cafe-photo')?.remove();}
 const key=JSON.stringify([account,state.owned,state.placedDecor,state.decor,state.progression?.upgrades]);
 if(key===lastCafePhotoKey){if(show&&!cafePhotoDialog.open)cafePhotoDialog.showModal();return;}
 const revision=++cafePhotoRevision;
 const placed=['plant','flower','cat','mushroom','piranha','pineapple','sadcupcake','cherryjelly','bluechick'].filter(id=>(state.owned||['plant']).includes(id)&&(state.placedDecor||state.owned||['plant']).includes(id));
 try{await loadCafeArtwork()}catch{return}
 if(revision!==cafePhotoRevision)return;
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=432;const ctx=canvas.getContext('2d');
 ctx.drawImage(cafeArtwork,0,0,1000,360,0,0,1200,432);
 // Keep every purchased decoration in its own place when another is added.
 const positions={plant:[80,310,90,106],flower:[550,300,85,101],cat:[660,305,100,118],mushroom:[1050,310,90,106],piranha:[130,238,82,90],pineapple:[370,305,72,79],sadcupcake:[480,306,75,82],cherryjelly:[760,280,75,82],bluechick:[925,312,72,79]};
 const names={plant:'Yeşil dost',flower:'Bahar çiçekleri',cat:'Uykucu kedi',mushroom:'Masal mantarı',piranha:'Pirana',pineapple:'Canlı ananas',sadcupcake:'Mutsuz cupcake',cherryjelly:'Vişneli jöle',bluechick:'Mavi civciv'};
 const items=await Promise.all(placed.map(async id=>({id,item:await previewImage('decor-'+id+'.svg')})));
 if(revision!==cafePhotoRevision)return;
 const bought=state.progression?.upgrades||[];
 const tableArt=await previewImage('table-four.svg');if(revision!==cafePhotoRevision)return;
 const seats=1+['table2','table3','table4'].filter(id=>bought.includes(id)).length;
 const tablePositions=[250,460,680,900];for(let i=0;i<seats;i++)ctx.drawImage(tableArt,tablePositions[i]-60,315,120,115);
 for(const {id,item} of items){const [x,y,w,h]=positions[id];ctx.save();ctx.shadowColor='#733c6555';ctx.shadowBlur=16;ctx.fillStyle='#80496644';ctx.beginPath();ctx.ellipse(x+w/2,y+h*.91,w*.44,13,0,0,Math.PI*2);ctx.fill();ctx.restore();ctx.drawImage(item,x,y,w,h)}
 if(bought.includes('counter')){ctx.fillStyle='#ffe0af';ctx.fillRect(1010,342,125,12);ctx.fillStyle='#c992ad';ctx.fillRect(1020,354,105,55)}
 if(bought.includes('espresso2')||bought.includes('blender2')){ctx.font='bold 22px system-ui';ctx.fillStyle='#fff5bf';ctx.fillText('⚙ II',875,245)}
 if(bought.includes('expansion')){ctx.font='bold 20px system-ui';ctx.fillStyle='#fff2c3';ctx.fillText('✦ Genişletilmiş kafe',690,425)}
 const url=canvas.toDataURL('image/png'),name=placed.map(id=>names[id]).join(', ');
 const image=cafePhotoDialog.querySelector('#cafe-photo');image.src=url;image.alt=name+' · '+seats+' masa ve '+seats*4+' sandalye bulunan kafe';
 let sceneImage=document.querySelector('#scene .saved-cafe-photo');if(!sceneImage){sceneImage=document.createElement('img');sceneImage.className='saved-cafe-photo';$('scene').appendChild(sceneImage)}sceneImage.src=url;sceneImage.alt=image.alt;
 lastCafePhotoKey=key;if(show&&!cafePhotoDialog.open)cafePhotoDialog.showModal();
}
const renderBeforeCafePhoto=render;
render=function(){renderBeforeCafePhoto();updateCafePhoto()};
if(typeof requestIdleCallback==='function')requestIdleCallback(()=>updateCafePhoto(),{timeout:2000});else if(typeof setTimeout==='function')setTimeout(()=>updateCafePhoto(),0);
globalThis.addEventListener?.('pagehide',()=>{cafePhotoRevision++;lastCafePhotoKey='';cafeArtworkReady=cafeArtwork=null;cafePreviewImages.clear();cafePhotoDialog.querySelector('#cafe-photo').removeAttribute('src');document.querySelector('#scene .saved-cafe-photo')?.remove()});
