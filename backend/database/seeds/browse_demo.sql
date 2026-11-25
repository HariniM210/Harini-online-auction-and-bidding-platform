-- OPTIONAL LOCAL DEVELOPMENT ONLY. Uses an existing active normal user as seller.
BEGIN;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.users WHERE role='user' AND is_active) THEN RAISE EXCEPTION 'Register an active test user first'; END IF; END $$;
INSERT INTO public.auctions(seller_id,category_id,title,description,starting_price,min_bid_increment,start_time,end_time,status,image_url)
SELECT u.id,c.id,v.title,'[Browse demo] Local test listing only',v.price,100,now()+v.start_hours*interval '1 hour',now()+v.end_hours*interval '1 hour','upcoming',v.image
FROM (VALUES ('Apple AirPods Pro','Electronics',12500,-1,62,'active','/auction-images/airpods.webp'),('Michael Kors Handbag','Fashion',4500,24,42,'upcoming','/auction-images/handbag.webp'),('Samsung Galaxy Watch','Electronics',8200,-1,84,'active','/auction-images/smartwatch.webp'),('Vintage Painting','Collectibles',3000,48,68,'upcoming','/auction-images/painting.webp'),('Nike Air Force 1','Sports',5750,-1,34,'active','/auction-images/sneakers.webp'),('The Great Gatsby Book','Books & Media',850,-48,-2,'ended','/auction-images/books.webp'),('Canon EOS 90D DSLR Camera','Electronics',52000,-1,90,'active','/auction-images/camera.webp'),('Apple MacBook Air M2','Electronics',78500,-1,100,'active','/auction-images/laptop.webp'),('Seiko Automatic Watch','Watches',24000,-1,110,'active','/auction-images/watch.webp'),('Vintage Record Player','Collectibles',16500,-1,120,'active','/auction-images/record-player.webp')) v(title,category,price,start_hours,end_hours,status,image)
CROSS JOIN (SELECT id FROM public.users WHERE role='user' AND is_active ORDER BY id LIMIT 1) u
JOIN LATERAL (SELECT id FROM public.categories WHERE name=v.category ORDER BY id LIMIT 1) c ON true
WHERE NOT EXISTS(SELECT 1 FROM public.auctions a WHERE a.title=v.title AND a.description='[Browse demo] Local test listing only');
COMMIT;
