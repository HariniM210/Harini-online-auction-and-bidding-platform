const {query}=require('../config/db');
// All identities come from authenticated middleware, never query parameters.
const fields=`a.id::text AS id,a.title,a.image_url,COALESCE(c.name,'Uncategorized') AS category,
 a.starting_price,a.start_time,a.end_time,a.winning_bid_id::text AS winning_bid_id,
 CASE WHEN a.status IN ('cancelled','ended') THEN a.status WHEN a.end_time<=now() THEN 'ended' WHEN a.start_time>now() THEN 'upcoming' ELSE 'active' END AS status,
 top.amount AS current_bid, (SELECT count(*)::int FROM public.bids b WHERE b.auction_id=a.id) AS bid_count`;
const joins=`LEFT JOIN public.categories c ON c.id=a.category_id
 LEFT JOIN LATERAL (SELECT id,bidder_id,amount FROM public.bids WHERE auction_id=a.id ORDER BY amount DESC,id ASC LIMIT 1) top ON true`;
const handle=sql=>async(req,res,next)=>{try{const r=await query(sql,[req.user.id]);res.json({status:'success',data:r.rows});}catch(e){next(e);}};
exports.bids=handle(`WITH mine AS (SELECT auction_id,max(amount) AS my_highest_bid,count(*)::int AS my_bid_count,max(bid_time) AS activity_time FROM public.bids WHERE bidder_id=$1 GROUP BY auction_id), listings AS (
 SELECT ${fields},m.my_highest_bid,m.my_bid_count,m.activity_time,(top.bidder_id = $1) AS is_leading,
 EXISTS(SELECT 1 FROM public.bids w WHERE w.id=a.winning_bid_id AND w.auction_id=a.id AND w.bidder_id=$1) AS won
 FROM mine m JOIN public.auctions a ON a.id=m.auction_id ${joins})
 SELECT id,title,image_url,category,starting_price,start_time,end_time,status,current_bid,bid_count,my_highest_bid,my_bid_count,activity_time,
 CASE WHEN status='cancelled' THEN 'Cancelled' WHEN status='ended' THEN CASE WHEN winning_bid_id IS NULL THEN 'Pending result' WHEN won THEN 'Won' ELSE 'Lost' END WHEN status='active' THEN CASE WHEN is_leading THEN 'Winning' ELSE 'Outbid' END ELSE 'Upcoming' END AS bid_status
 FROM listings ORDER BY activity_time DESC,id DESC`);
exports.watchlist=handle(`SELECT ${fields},w.created_at AS activity_time FROM public.watchlists w JOIN public.auctions a ON a.id=w.auction_id ${joins} WHERE w.user_id=$1 AND a.seller_id<>$1 ORDER BY w.created_at DESC,w.id DESC`);
