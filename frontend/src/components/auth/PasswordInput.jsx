import { useState } from 'react';
import AuthInput from './AuthInput';
export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  return <AuthInput {...props} icon="lock" type={visible ? 'text' : 'password'} trailing={<button className="auth-eye" type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(v => !v)}><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>{visible && <path d="M3 3l18 18"/>}</svg></button>}/>;
}
