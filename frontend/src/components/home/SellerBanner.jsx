import {Link} from 'react-router-dom';
import Icon from '../common/Icon';
import gavel from '../../assets/images/seller-gavel.webp';
export default function SellerBanner(){return <section id="sell" className="container seller-banner"><img src={gavel} alt="Purple and gold auction gavel"/><div><h2>Have Something to Sell?</h2><p>Get ready to list your items and set your terms. Selling functionality is coming soon.</p></div><Link className="btn primary" to="/register"><Icon name="upload"/>Start Selling Now →</Link></section>}
