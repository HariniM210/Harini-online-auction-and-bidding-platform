import { Link, useParams } from 'react-router-dom';
import MyAccount from './MyAccount';
const titles={account:'My Account',bids:'My Bids','my-auctions':'My Auctions',watchlist:'My Watchlist',create:'Create an Auction','how-it-works':'How It Works'};
export default function DashboardSection({admin=false}){
 const {section}=useParams();
 if (!admin && section==='account') return <MyAccount/>;
 return <section className="dash-panel"><Link className="text-link" to={admin?'/admin':'/dashboard'}>{admin?'Admin home':'← Back to Dashboard'}</Link><h1>{admin?'Admin Dashboard':titles[section] || 'Page not found'}</h1>{section==='how-it-works'?<p>Browse auctions, place bids on items from other sellers, or create your own auction. Live bidding and listing creation will be enabled in a later phase.</p>:<p>{admin?'Admin management features are not implemented yet.':'This module is coming in a later development phase. No live data or transactions are available here yet.'}</p>}</section>;
}
