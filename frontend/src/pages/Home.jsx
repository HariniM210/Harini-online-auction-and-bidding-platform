import {useState} from 'react';
import Hero from '../components/home/Hero';
import CategorySection from '../components/home/CategorySection';
import LiveAuctions from '../components/home/LiveAuctions';
import FeaturesSection from '../components/home/FeaturesSection';
import SellerBanner from '../components/home/SellerBanner';
export default function Home(){const [category,setCategory]=useState('All Categories');return <><Hero/><CategorySection onSelect={name=>{setCategory(name);document.getElementById('auctions')?.scrollIntoView()}}/><LiveAuctions category={category} onReset={()=>setCategory('All Categories')}/><FeaturesSection/><SellerBanner/></>}
