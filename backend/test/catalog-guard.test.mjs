import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CatalogAccessGuard } from '../dist/auth/guards/catalog-access.guard.js';
import { ItemsController } from '../dist/catalog/controllers/items.controller.js';
import { CatalogController } from '../dist/catalog/controllers/catalog.controller.js';
const company = '11111111-1111-4111-8111-111111111111';
const item = '22222222-2222-4222-8222-222222222222';
function setup(controller, action, options={}) {
  const req={user:{id:'user'},query:options.query ?? {},body:options.body ?? {},params:{id:item},method:options.method ?? 'GET'};
  const jwt={canActivate:async()=>{if(options.noToken)throw new Error('unauthorized');return true}};
  const iam={requireActiveCompanyMembership:async()=>({id:'member'}),permissionsForCompanyUser:async()=> options.permissions ?? []};
  const db={query:async sql=>sql.includes('iam.company_users')?[{company_id:company}]:options.exists?[{id:item}]:[]};
  const context={getClass:()=>controller,getHandler:()=>({name:action}),switchToHttp:()=>({getRequest:()=>req})};
  return ()=>new CatalogAccessGuard(jwt,iam,db).canActivate(context);
}
test('requires authentication for items',async()=>assert.rejects(setup(ItemsController,'findAll',{noToken:true}),/unauthorized/));
test('rejects a different company',async()=>assert.rejects(setup(ItemsController,'findAll',{query:{companyId:'another'}}),/Company does not match/));
test('rejects records outside company',async()=>assert.rejects(setup(ItemsController,'findOne'),/not found/));
test('rejects writes without permission',async()=>assert.rejects(setup(ItemsController,'create',{method:'POST'}),/permission is required/));
test('permits authorized create',async()=>assert.equal(await setup(ItemsController,'create',{method:'POST',permissions:['manage_catalog']})(),true));
test('blocks company creation of shared units',async()=>assert.rejects(setup(CatalogController,'createUnit',{method:'POST'}),/managed by the platform/));
