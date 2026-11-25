const {pool,query}=require('../config/db');
const {EventEmitter}=require('node:events');
const events=new EventEmitter(); events.setMaxListeners(0);
const validId=v=>typeof v==='string'&&/^[1-9]\d{0,18}$/.test(v)&&BigInt(v)<=9223372036854775807n;
const validAmount=v=>typeof v==='string'&&/^\d{1,8}(\.\d{1,2})?$/.test(v)&&Number(v)>0;
const fail=(res,code,message)=>res.status(code).json({status:'error',message});
exports.place=async(req,res,next)=>{
 const id=req.params.id, amount=req.body?.amount;
 if(!validId(id)||!validAmount(amount))return fail(res,400,'Enter a valid positive bid amount (up to two decimal places)');
 if(req.user.role!=='user')return fail(res,403,'Only user accounts can bid');
 let c;
 try{c=await pool.connect();await c.query('BEGIN');
 const {rows:[a]}=await c.query('SELECT * FROM public.auctions WHERE id=$1 FOR UPDATE',[id]);
 if(!a){await c.query('ROLLBACK');return fail(res,404,'Auction not found');}
 if(String(a.seller_id)===String(req.user.id)){await c.query('ROLLBACK');return fail(res,403,'Cannot bid on your own auction');}
 const {rows:[check]}=await c.query(`SELECT status IN ('active','upcoming') AND start_time<=clock_timestamp() AND end_time>clock_timestamp() AS open, $2::numeric>=COALESCE((SELECT max(amount) FROM public.bids WHERE auction_id=$1)+min_bid_increment,starting_price) AS enough FROM public.auctions WHERE id=$1`,[id,amount]);
 if(!check.open||!check.enough){await c.query('ROLLBACK');return fail(res,409,check.open?'Bid is below the latest minimum. Refresh and try again.':'Auction is not accepting bids');}
 const {rows:[bid]}=await c.query('INSERT INTO public.bids(auction_id,bidder_id,amount) VALUES($1,$2,$3) RETURNING id,amount,bid_time',[id,req.user.id,amount]);
 await c.query('COMMIT');events.emit(id);return res.status(201).json({status:'success',data:bid});
 }catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});if(['23514','22003'].includes(e.code))return fail(res,409,'Bid rejected: check the latest price and auction status');next(e);}finally{c?.release();}
};
exports.stream=async(req,res,next)=>{
 const id=req.params.id;if(!validId(id))return fail(res,400,'Invalid auction ID');
 try{const r=await query("SELECT id FROM public.auctions WHERE id=$1 AND (status<>'cancelled' OR seller_id=$2)",[id,req.user.id]);if(!r.rowCount)return fail(res,404,'Auction not found');
 res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','X-Accel-Buffering':'no'});res.flushHeaders();
 const send=()=>res.write('data: refresh\n\n');events.on(id,send);send();
 // Revalidate via a fresh authenticated request every 25 seconds.
 const timer=setTimeout(()=>res.end(),25000);res.on('close',()=>{clearTimeout(timer);events.off(id,send);});
 }catch(e){next(e);}
};
exports.finalize=async()=>{
 const c=await pool.connect();let ids=[];
 try{await c.query('BEGIN');const r=await c.query("SELECT id FROM public.auctions WHERE status IN ('upcoming','active') AND end_time<=clock_timestamp() ORDER BY id LIMIT 100 FOR UPDATE SKIP LOCKED");ids=r.rows.map(x=>String(x.id));
 for(const id of ids)await c.query("UPDATE public.auctions SET status='ended',winning_bid_id=(SELECT id FROM public.bids WHERE auction_id=$1 ORDER BY amount DESC,id ASC LIMIT 1),updated_at=now() WHERE id=$1",[id]);
 await c.query('COMMIT');for(const id of ids)events.emit(id);
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}
};
exports.validAmount=validAmount;
