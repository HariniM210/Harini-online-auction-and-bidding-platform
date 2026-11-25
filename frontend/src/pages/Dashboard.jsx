import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/common/Icon';
import CategorySection from '../components/home/CategorySection';
import LiveAuctions from '../components/home/LiveAuctions';
import gavel from '../assets/images/seller-gavel.webp';
const quick = [['Browse Auctions','Discover and bid on amazing items','search','/dashboard#auctions'],['Create Auction','Sell your items to the highest bidder','gavel','/dashboard/create'],['My Watchlist','Keep track of items you love','heart','/dashboard/watchlist'],['My Account','Manage your profile and settings','users','/dashboard/account']];
export default function Dashboard(){
 const [category,setCategory]=useState('All Categories');
 return <><section className="dash-hero"><div><h1>Welcome to AuctionVerse</h1><p>Bid, Sell, and Discover Unique Items in Exciting Auctions</p><div className="dash-hero-actions"><Link className="btn primary" to="/dashboard#auctions">Browse Auctions →</Link><Link className="btn outline" to="/dashboard/create"><Icon name="gavel"/>Create an Auction</Link></div></div><img src={gavel} alt="Auction gavel"/></section><div className="dash-quick">{quick.map(([title,desc,icon,to])=><Link key={title} to={to}><Icon name={icon} size={36}/><div><h3>{title}</h3><p>{desc}</p></div><span>→</span></Link>)}</div><CategorySection onSelect={name=>{setCategory(name);document.getElementById('auctions')?.scrollIntoView();}}/><LiveAuctions category={category} onReset={()=>setCategory('All Categories')}/></>;
}
