import { Link } from 'react-router-dom';
import Icon from '../common/Icon';
import gavel from '../../assets/images/seller-gavel.webp';
import '../../styles/auth.css';

export default function AuthLayout({ children, register = false }) {
  return <section className="auth-page" aria-labelledby="auth-heading">
    <header className="auth-intro"><span className="auth-eyebrow">Welcome to AuctionVerse</span><h1>Join <span>AuctionVerse</span></h1><p>Discover, buy, sell and bid on unique items.</p></header>
    <div className="auth-card">
      <aside className="auth-art"><span className="auth-eyebrow">Online auction marketplace</span><h2>{register ? 'Discover something unique.' : 'Your next discovery awaits.'}</h2><p>Explore a world of pre-owned and premium items, all in one marketplace.</p><img src={gavel} alt=""/><div className="auth-art-features"><span><Icon name="gavel"/> Discover auctions</span><span><Icon name="tag"/> Buy and sell</span><span><Icon name="box"/> Explore unique items</span></div></aside>
      <div className="auth-form-panel"><nav className="auth-tabs" aria-label="Account pages"><Link to="/login" aria-current={!register ? 'page' : undefined}>Sign In</Link><Link to="/register" aria-current={register ? 'page' : undefined}>Sign Up</Link></nav>{children}</div>
    </div>
    <Link className="auth-back" to="/">← Back to Home</Link>
  </section>;
}
