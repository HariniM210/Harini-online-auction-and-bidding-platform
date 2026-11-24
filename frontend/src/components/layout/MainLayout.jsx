import {useEffect} from 'react';
import {Outlet,useLocation} from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
export default function MainLayout(){const {pathname,hash}=useLocation();useEffect(()=>{if(hash) document.getElementById(hash.slice(1))?.scrollIntoView();else window.scrollTo(0,0)},[pathname,hash]);return <div className="site-layout"><Navbar/><main><Outlet/></main><Footer/></div>}
