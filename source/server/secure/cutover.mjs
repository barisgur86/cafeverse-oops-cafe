import crypto from 'node:crypto';
import {gameEngine} from './engine.mjs';
import {problem} from './apple.mjs';

// Only an already persisted, account-owned server backup is eligible. There is
// deliberately no HTTP endpoint accepting a client's wallet/import JSON.
export async function adoptBackup(c,id){
 await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',['cutover:'+id]);
 const existing=(await c.query('select * from cafe_game_accounts where user_id=$1 for update',[id])).rows[0];
 if(existing){const marker=(await c.query('select 1 from cafe_account_cutovers where user_id=$1',[id])).rows[0];if(marker)return existing;throw problem('Eski sunucu kaydı geçiş incelemesi bekliyor; bakiyeler korundu.',409);}
 // A deployment may provide a server-owned reader for its legacy backup schema.
 // The account ID comes from verified authentication, never a client import body.
 const backup=c.readLegacyBackup?await c.readLegacyBackup(id):(await c.query('select revision,save from cafe_cloud_saves where user_id=$1 for update',[id])).rows[0];
 let save=gameEngine(id).exportSave();
 if(backup){try{const engine=gameEngine(id,backup.save);save=engine.exportSave();}catch{throw problem('Eski kafe kaydı doğrulanamadı; kayıt ve bakiye korundu.',409);}}
 const checksum=crypto.createHash('sha256').update(JSON.stringify(save)).digest('hex');
 const code=crypto.createHash('sha256').update(id).digest('hex').slice(0,10).toUpperCase();
 await c.query('insert into cafe_game_accounts(user_id,code,save) values($1,$2,$3)',[id,code,save]);
 await c.query('insert into cafe_account_cutovers(user_id,source_revision,source_version,checksum) values($1,$2,$3,$4)',[id,Number(backup?.revision||0),save.version,checksum]);
 return (await c.query('select * from cafe_game_accounts where user_id=$1 for update',[id])).rows[0];
}
