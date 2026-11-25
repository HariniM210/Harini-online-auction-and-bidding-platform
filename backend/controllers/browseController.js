const { query } = require('../config/db');
const base = `SELECT a.id, a.title, a.description, a.seller_id, a.category_id, COALESCE(c.name,'Uncategorized') AS category, a.image_url, a.start_time, a.end_time, a.created_at, a.starting_price, a.min_bid_increment, b.highest AS current_bid, COALESCE(b.highest,a.starting_price) AS price, CASE WHEN a.status NOT IN ('upcoming','active','ended','closed','completed','sold') THEN a.status WHEN a.status IN ('ended','closed','completed','sold') OR a.end_time <= now() THEN 'ended' WHEN a.start_time > now() THEN 'upcoming' ELSE 'active' END AS status FROM public.auctions a LEFT JOIN public.categories c ON c.id=a.category_id LEFT JOIN LATERAL (SELECT max(amount) AS highest FROM public.bids WHERE auction_id=a.id) b ON true`;
const visible = `status IN ('active','upcoming','ended')`;
const wrap = fn => async (req,res,next) => { try { await fn(req,res); } catch(e) { next(e); } };
const ok = (res,data) => res.json({status:'success',data});
const bad = (res,message) => res.status(400).json({status:'error',message});
const validId = id => /^[1-9][0-9]{0,18}$/.test(id) && BigInt(id)<=9223372036854775807n;
exports.categories = wrap(async (req, res) => {
  const r = await query(
    `WITH listings AS (${base})
     SELECT c.id, c.name, count(l.id)::int AS count
     FROM public.categories c
     LEFT JOIN listings l
       ON l.category_id = c.id
       AND l.status IN ('active', 'upcoming', 'ended')
       AND l.seller_id <> $1
     GROUP BY c.id, c.name
     ORDER BY c.name`,
    [req.user.id]
  );

  ok(res, r.rows);
});
exports.list = wrap(async(req,res)=>{
 const {search='',category,status='All',sort='featured',min='',max='',page='1',saved='false'}=req.query;
 const cats=category===undefined?[]:Array.isArray(category)?category:[category];
 const sorts={featured:'id DESC',ending:"CASE WHEN status='active' THEN 0 WHEN status='upcoming' THEN 1 ELSE 2 END, end_time ASC, id ASC",newest:'created_at DESC,id DESC',low:'price ASC,id ASC',high:'price DESC,id ASC'};
 const number=v=>typeof v==='string'&&(v===''||(/^\d{1,12}(\.\d{1,2})?$/.test(v)));
 if(typeof search!=='string'||search.length>200||cats.length>30||cats.some(c=>typeof c!=='string'||c.length>255)||!['All','Active','Upcoming','Ended'].includes(status)||!Object.hasOwn(sorts,sort)||!number(min)||!number(max)||(min!==''&&max!==''&&Number(min)>Number(max))||typeof page!=='string'||!/^\d{1,7}$/.test(page)||Number(page)<1||!['true','false'].includes(saved))return bad(res,'Invalid auction filters');
 const args = [req.user.id];
 const where = [visible, 'seller_id <> $1']; const add=v=>{args.push(v);return '$'+args.length;};
 if(search.trim()) {const p=add(search.trim());where.push(`strpos(lower(title || ' ' || category || ' ' || coalesce(description,'')),lower(${p}))>0`);}
 if(cats.length)where.push(`category=ANY(${add(cats)}::text[])`);
 if(status!=='All')where.push(`status=${add(status.toLowerCase())}`);
 if(min!=='')where.push(`price>=${add(min)}::numeric`);if(max!=='')where.push(`price<=${add(max)}::numeric`);
 if(saved==='true'||req.watchlistOnly)where.push('is_saved');
 const sql=`WITH listings AS (${base}), filtered AS (SELECT l.*, EXISTS(SELECT 1 FROM public.watchlists w WHERE w.auction_id=l.id AND w.user_id=$1) AS is_saved FROM listings l), matched AS (SELECT * FROM filtered WHERE ${where.join(' AND ')})`;
 const r=await query(`${sql} SELECT (SELECT count(*)::int FROM matched) AS total, COALESCE((SELECT jsonb_agg(to_jsonb(p) || jsonb_build_object('id',p.id::text,'seller_id',p.seller_id::text,'category_id',p.category_id::text) ORDER BY ${sorts[sort]}) FROM (SELECT * FROM matched ORDER BY ${sorts[sort]} LIMIT 6 OFFSET ${add((Number(page)-1)*6)}) p),'[]'::jsonb) AS items`,args);
 ok(res,{...r.rows[0],page:Number(page),pageSize:6});
});
exports.detail = wrap(async (req, res) => {
  if (!validId(req.params.id)) {
    return bad(res, 'Invalid auction ID');
  }

  const r = await query(
    `WITH listings AS (${base})
     SELECT *
     FROM listings
     WHERE id = $1
       AND ${visible}
       AND seller_id <> $2`,
    [req.params.id, req.user.id]
  );

  if (!r.rows.length) {
    return res.status(404).json({
      status: 'error',
      message: 'Auction not found'
    });
  }

  ok(res, r.rows[0]);
});
exports.save = wrap(async (req, res) => {
  const id = req.body?.auction_id;

  if (typeof id !== 'string' || !validId(id)) {
    return bad(res, 'Invalid auction ID');
  }

  const auction = await query(
    `WITH listings AS (${base})
     SELECT id, seller_id
     FROM listings
     WHERE id = $1 AND ${visible}`,
    [id]
  );

  if (!auction.rows.length) {
    return res.status(404).json({
      status: 'error',
      message: 'Auction not found'
    });
  }

  if (
    String(auction.rows[0].seller_id) ===
    String(req.user.id)
  ) {
    return res.status(403).json({
      status: 'error',
      message: 'You cannot save your own auction'
    });
  }

  const result = await query(
    `WITH listings AS (${base})
     INSERT INTO public.watchlists (user_id, auction_id)
     SELECT $1, id
     FROM listings
     WHERE id = $2
       AND ${visible}
       AND seller_id <> $1
     ON CONFLICT (user_id, auction_id)
     DO NOTHING
     RETURNING id`,
    [req.user.id, id]
  );

  if (!result.rowCount) {
    const existing = await query(
      `SELECT 1
       FROM public.watchlists w
       JOIN public.auctions a ON a.id = w.auction_id
       WHERE w.user_id = $1
         AND w.auction_id = $2
         AND a.seller_id <> $1`,
      [req.user.id, id]
    );

    if (!existing.rowCount) {
      return res.status(404).json({
        status: 'error',
        message: 'Auction not found'
      });
    }
  }

  ok(res, { saved: true });
});
exports.remove=wrap(async(req,res)=>{if(!validId(req.params.id))return bad(res,'Invalid auction ID');await query('DELETE FROM public.watchlists WHERE user_id=$1 AND auction_id=$2',[req.user.id,req.params.id]);ok(res,{saved:false});});
