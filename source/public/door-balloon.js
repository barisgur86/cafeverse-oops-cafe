/* Cancelable door-only animation. The existing call transaction owns rewards/guests. */
(() => {
 function create({update,complete,schedule=setTimeout,unschedule=clearTimeout}) {
  let generation=0,active=false,timer=null,resolveWait=null;
  const wait=ms=>new Promise(resolve=>{resolveWait=resolve;timer=schedule(()=>{timer=null;resolveWait=null;resolve(true)},ms)});
  function cancel(){generation++;active=false;if(timer!==null)unschedule(timer);timer=null;resolveWait?.(false);resolveWait=null;update({phase:'idle',pump:0});}
  async function run(){if(active)return false;active=true;const token=++generation;
   try {for(let pump=1;pump<=4;pump++){update({phase:'pumping',pump});if(!await wait(650)||token!==generation)return false;}
    update({phase:'beckoning',pump:4});if(!await wait(1400)||token!==generation)return false;
    update({phase:'calling',pump:4});await complete(()=>token===generation,wait);
    return token===generation;
   }finally{if(token===generation){active=false;update({phase:'idle',pump:0});}}
  }
  return {run,cancel,get active(){return active}};
 }
 globalThis.CafeDoorBalloon={create};
})();
