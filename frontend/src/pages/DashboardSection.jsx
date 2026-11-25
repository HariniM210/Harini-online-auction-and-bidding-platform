import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const titles={account:'My Account',bids:'My Bids','my-auctions':'My Auctions',watchlist:'My Watchlist',create:'Create an Auction','how-it-works':'How It Works'};
export default function DashboardSection({admin=false}){
 const {section}=useParams(); const {user}=useAuth();
 return <section className="dash-panel"><Link className="text-link" to={admin?'/admin':'/dashboard'}>{admin?'Admin home':'← Back to Dashboard'}</Link><h1>{admin?'Admin Dashboard':titles[section] || 'Page not found'}</h1>{section==='account'?<dl><dt>Full name</dt><dd>{user.full_name || 'Not provided'}</dd><dt>Email</dt><dd>{user.email}</dd><dt>Mobile number</dt><dd>{user.mobile_number || 'Not available'}</dd><dt>Account type</dt><dd>Buyer and Seller</dd></dl>:section==='how-it-works'?<p>Browse auctions, place bids on items from other sellers, or create your own auction. Live bidding and listing creation will be enabled in a later phase.</p>:<p>{admin?'Admin management features are not implemented yet.':'This module is coming in a later development phase. No live data or transactions are available here yet.'}</p>}</section>;
}
