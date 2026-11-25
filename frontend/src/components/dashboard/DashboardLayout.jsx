import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';
import '../../styles/dashboard.css';
export default function DashboardLayout() {
  const {user, logout} = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menu = useRef(null);
  useEffect(() => {
    const close = e => { if (!menu.current?.contains(e.target)) setOpen(false); };
    const escape = e => { if (e.key === 'Escape') {setOpen(false); menu.current?.querySelector('button')?.focus();} };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => {document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape);};
  }, []);
  useEffect(() => { if(location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView(); else window.scrollTo(0,0); }, [location.pathname, location.hash]);
  if (!user) return <Navigate to="/login" replace />;
  const admin = user.role === 'admin';
  if (admin && location.pathname !== '/admin') return <Navigate to="/admin" replace />;
  if (!admin && location.pathname === '/admin') return <Navigate to="/dashboard" replace />;
  const home = admin ? '/admin' : '/dashboard';
  return <div className="dash-shell"><header className="dash-header"><div className="dash-nav">
    <Link className="dash-brand" to={home}><Icon name="gavel" size={40}/>AuctionVerse</Link>
    <nav aria-label="Dashboard navigation"><Link to={home}>Home</Link>{!admin && <><Link className={location.pathname==='/dashboard/browse'?'browse-nav-active':undefined} to="/dashboard/browse">Browse Auctions</Link><Link to="/dashboard#categories">Categories ⌄</Link><Link to="/dashboard/how-it-works">How It Works</Link></>}</nav>
    <div className="dash-user"><button className="dash-bell" disabled title="Notifications coming later" aria-label="Notifications coming later"><Icon name="bell"/></button><div className="dash-menu" ref={menu}><button className="dash-profile" aria-expanded={open} aria-controls="dash-profile-links" onClick={()=>setOpen(v=>!v)}><span className="dash-avatar"><Icon name="users" size={25}/></span><span>Welcome,<strong>{user.full_name || user.email}</strong></span><span>⌄</span></button>{open && <div className="dash-dropdown" id="dash-profile-links">{!admin && [['My Account','account','users'],['My Bids','bids','gavel'],['My Auctions','my-auctions','box'],['Watchlist','watchlist','heart']].map(([label,path,icon])=><Link key={path} to={'/dashboard/'+path} onClick={()=>setOpen(false)}><Icon name={icon}/>{label}</Link>)}<button className="dash-logout" onClick={()=>{setOpen(false);logout();navigate('/',{replace:true});}}>↪ Logout</button></div>}</div></div>
  </div></header><main className="dash-main"><Outlet/></main><footer className="dash-footer">AuctionVerse · Online Auction &amp; Bidding Platform</footer></div>;
}
