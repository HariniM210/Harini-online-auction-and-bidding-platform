import { useId } from 'react';
const paths = {email:'M3 5h18v14H3z M3 6l9 7 9-7',name:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2z',phone:'M7 2h10v20H7z M11 18h2',lock:'M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4 M12 14v3'};
export default function AuthInput({ label, icon, error, hint, trailing, ...props }) {
  const id = useId();
  return <div className="auth-field"><label htmlFor={id}>{label} <span aria-hidden="true">*</span></label><div className="auth-input-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d={paths[icon]}/></svg><input {...props} id={id} required aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}/>{trailing}</div>{hint && <small id={`${id}-hint`}>{hint}</small>}{error && <p className="auth-error" id={`${id}-error`}>{error}</p>}</div>;
}
