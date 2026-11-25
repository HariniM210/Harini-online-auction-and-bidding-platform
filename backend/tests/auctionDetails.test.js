const test=require('node:test');
const assert=require('node:assert/strict');
const p=require.resolve('../config/db');
let calls=[], rows=[];
require.cache[p]={id:p,filename:p,loaded:true,exports:{query:async(sql,args)=>{calls.push({sql,args});return {rows}},pool:{}}};
const buyer=require('../controllers/browseController'),seller=require('../controllers/sellerController');
async function invoke(fn,id){let result;await fn({user:{id:'4'},params:{id}},{status(n){this.code=n;return this},json(body){result={code:this.code||200,body};return this}},e=>{throw e});return result;}
test('buyer details exclude own and cancelled listings, include masked history and saved state',async()=>{calls=[];rows=[{id:'11',bid_history:[],is_saved:false}];assert.equal((await invoke(buyer.detail,'11')).code,200);assert.deepEqual(calls[0].args,['11','4']);assert.match(calls[0].sql,/l.seller_id<>\$2/);assert.match(calls[0].sql,/l.status IN \('active','upcoming','ended'\)/);assert.match(calls[0].sql,/AS is_saved/);assert.match(calls[0].sql,/Bidder /);assert.doesNotMatch(calls[0].sql,/u.email/);});
test('seller details scoped to owner and include watchlist count',async()=>{calls=[];rows=[{id:'11'}];assert.equal((await invoke(seller.detail,'11')).code,200);assert.deepEqual(calls[0].args,['4','11']);assert.match(calls[0].sql,/a.seller_id=\$1/);assert.match(calls[0].sql,/watchlist_count/);});
test('invalid IDs rejected without querying',async()=>{calls=[];assert.equal((await invoke(buyer.detail,'abc')).code,400);assert.equal((await invoke(seller.detail,'9223372036854775808')).code,400);assert.equal(calls.length,0);});
test('missing or inaccessible auctions return 404',async()=>{rows=[];assert.equal((await invoke(buyer.detail,'11')).code,404);assert.equal((await invoke(seller.detail,'11')).code,404);});
