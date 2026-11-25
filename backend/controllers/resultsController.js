const {query}=require('../config/db');
// Only participants and owners see their own results. Winner name is seller-only.
exports.list=async(req,res,next)=>{
 try{
  const {rows}=await query(`SELECT a.id::text AS id,a.title,a.image_url,a.end_time,
    COALESCE(c.name,'Uncategorized') AS category, a.seller_id=$1 AS is_seller,
    w.amount::text AS final_price, mine.highest::text AS my_highest_bid,
    CASE WHEN a.seller_id=$1 AND w.id IS NOT NULL THEN COALESCE(u.full_name,'AuctionVerse bidder') END AS winner_name,
    CASE WHEN a.status<>'ended' OR (w.id IS NULL AND EXISTS(SELECT 1 FROM public.bids b WHERE b.auction_id=a.id)) THEN 'Pending result'
      WHEN a.seller_id=$1 THEN CASE WHEN w.id IS NULL THEN 'Unsold' ELSE 'Winner declared' END
      WHEN w.bidder_id=$1 THEN 'Won' ELSE 'Lost' END AS outcome
    FROM public.auctions a LEFT JOIN public.categories c ON c.id=a.category_id
    LEFT JOIN public.bids w ON w.id=a.winning_bid_id AND w.auction_id=a.id
    LEFT JOIN public.users u ON u.id=w.bidder_id
    LEFT JOIN LATERAL (SELECT max(amount) AS highest FROM public.bids WHERE auction_id=a.id AND bidder_id=$1) mine ON true
    WHERE (a.status='ended' OR (a.status IN ('active','upcoming') AND a.end_time<=clock_timestamp()))
      AND (a.seller_id=$1 OR mine.highest IS NOT NULL)
    ORDER BY a.end_time DESC,a.id DESC`,[req.user.id]);
  res.json({status:'success',data:rows});
 }catch(e){next(e);}
};
