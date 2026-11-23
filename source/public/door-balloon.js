/* Three deliberate pump presses; only the third starts one guest-call round. */
(() => {
 function create({update,complete,schedule=setTimeout,unschedule=clearTimeout}) {
  let generation=0,active=false,finished=false,pump=0,timer=null,resolveWait=null;
  const wait=ms=>new Promise(resolve=>{resolveWait=resolve;timer=schedule(()=>{timer=null;resolveWait=null;resolve(true)},ms)});
  function cancel(){generation++;active=false;finished=false;pump=0;if(timer!==null)unschedule(timer);timer=null;resolveWait?.(false);resolveWait=null;update({phase:'idle',pump:0});}
  async function run(){if(active||finished)return false;active=true;const token=++generation;pump++;
   try{update({phase:'pumping',pump});if(!await wait(650)||token!==generation)return false;
    if(pump<3)return true;
    update({phase:'beckoning',pump:3});if(!await wait(1400)||token!==generation)return false;
    update({phase:'calling',pump:3});await complete(()=>token===generation,wait);finished=true;return token===generation;
   }finally{if(token===generation){active=false;update({phase:finished?'inflated':'paused',pump});}}
  }
  return {run,cancel,get active(){return active}};
 }
 globalThis.CafeDoorBalloon={create};
})();
