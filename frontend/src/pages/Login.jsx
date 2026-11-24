import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import AuthInput from '../components/auth/AuthInput';
import PasswordInput from '../components/auth/PasswordInput';
export default function Login() {
  const [values,setValues] = useState({email:'',password:''});
  const [errors,setErrors] = useState({});
  const [notice,setNotice] = useState('');
  const field = name => ({name,value:values[name],error:errors[name],onChange:e=>{setValues(v=>({...v,[name]:e.target.value}));setErrors(v=>({...v,[name]:undefined}));setNotice('');}});
  function submit(e){e.preventDefault();const next={};if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email='Enter a valid email address.';if(!values.password) next.password='Enter your password.';setErrors(next);setNotice(Object.keys(next).length ? '' : 'Validation passed. Sign in is not connected to the server yet.');}
  return <AuthLayout><h2 id="auth-heading">Welcome Back</h2><p className="auth-subtitle">Sign in to your AuctionVerse account.</p><form className="auth-form" onSubmit={submit} noValidate><AuthInput {...field('email')} label="Email address" icon="email" type="email" autoComplete="email" placeholder="you@example.com"/><PasswordInput {...field('password')} label="Password" autoComplete="current-password" placeholder="Enter your password"/><div className="auth-options"><span>Forgot password? <small>Coming soon</small></span></div><button className="auth-submit" type="submit">Sign In <span aria-hidden="true">→</span></button><p className="auth-notice" role="status">{notice}</p></form><p className="auth-switch">Don't have an account? <Link to="/register">Sign Up</Link></p></AuthLayout>;
}
