
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/common/Icon';
import gavel from '../assets/images/seller-gavel.webp';
import '../styles/profile.css';
import ProfileForms from './ProfileForms';

const symbols = {
  person: 'M20 21v-3a8 8 0 0 0-16 0v3 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  mail: 'M3 5h18v14H3z M3 5l9 8 9-8',
  phone: 'M5 3h4l2 5-3 2c2 4 4 6 7 7l2-3 5 2v4c-1 4-10 0-15-5S1 4 5 3',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  lock: 'M5 10h14v12H5z M8 10V6a4 4 0 0 1 8 0v4 M12 15v3',
  edit: 'M4 16l12-12 4 4L8 20H4z M14 6l4 4',
  info: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 11v6 M12 7h.01',
  settings: 'M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2 M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  logout: 'M10 3H3v18h7 M9 12h13 M17 7l5 5-5 5',
  close: 'M6 6l12 12 M18 6L6 18'
};

function ProfileIcon({ name, size = 24 }) {
  return symbols[name] ? (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={symbols[name]} />
    </svg>
  ) : (
    <Icon name={name} size={size} />
  );
}

const actions = [
  ['Edit Profile', 'edit'],
  ['Manage Addresses', 'pin'],
  ['Change Password', 'lock']
];

export default function MyAccount() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!panel) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;

    document.body.style.overflow = 'hidden';

    const dialog = document.getElementById('profile-dialog');
    dialog?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setPanel('');
      }

      if (event.key === 'Tab' && dialog) {
        const elements = Array.from(
          dialog.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'
          )
        );

        if (!elements.length) {
          event.preventDefault();
          return;
        }

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [panel]);

  if (!user) return null;

  const name = user.full_name || 'Not provided';
  const mobile = user.mobile_number || 'Not available';

  const date = user.created_at
    ? new Date(user.created_at)
    : null;

  const joined =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      : 'Not available';

  const details = [
    ['Full name', name],
    ['Email address', user.email],
    ['Mobile number', mobile],
    ['Account type', 'Buyer and Seller'],
    ['Member since', joined]
  ];

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="profile-page">

      {/* Account Sidebar */}
      <aside
        className="profile-sidebar"
        aria-label="Account navigation"
      >
        <Link
          className="profile-current"
          aria-current="page"
          to="/dashboard/account"
        >
          <ProfileIcon name="person" />
          My Account
        </Link>

        {[
          ['My Bids', 'bids', 'gavel'],
          ['My Auctions', 'my-auctions', 'box'],
          ['Watchlist', 'watchlist', 'heart']
        ].map(([label, path, icon]) => (
          <Link key={path} to={'/dashboard/' + path}>
            <ProfileIcon name={icon} />
            {label}
          </Link>
        ))}

        <div className="profile-rule" />

        <h2>
          <ProfileIcon name="settings" />
          Account Settings
        </h2>

        {actions.map(([label, icon]) => (
          <button
            key={label}
            type="button"
            onClick={() => setPanel(label)}
          >
            <ProfileIcon name={icon} />
            {label}
          </button>
        ))}

        <div className="profile-rule" />

        <button
          type="button"
          className="profile-logout"
          onClick={handleLogout}
        >
          <ProfileIcon name="logout" />
          Logout
        </button>
      </aside>

      {/* Main Profile Content */}
      <section className="profile-content">

        <header className="profile-heading">
          <h1>My Account</h1>
          <p>
            Manage your profile, personal details,
            and account settings
          </p>
        </header>

        {/* Profile Banner */}
        {notice && <p className="profile-feedback success" role="status">{notice}</p>}
        <div className="profile-banner">
          <div className="profile-avatar">
            <ProfileIcon name="person" size={62} />
          </div>

          <div className="profile-identity">
            <div className="profile-name">
              <h2>{name}</h2>
              <span>Buyer &amp; Seller</span>
            </div>

            <p>
              <ProfileIcon name="mail" size={20} />
              {user.email}
            </p>

            <p>
              <ProfileIcon name="phone" size={20} />
              {mobile}
            </p>
          </div>

          <img src={gavel} alt="" />
        </div>

        <div className="profile-grid">

          {/* Personal Information */}
          <article className="profile-card profile-personal">
            <header>
              <h2>
                <ProfileIcon name="person" />
                Personal Information
              </h2>

              <button
                type="button"
                className="profile-edit"
                onClick={() => setPanel('Edit Profile')}
              >
                <ProfileIcon name="edit" size={17} />
                Edit Profile
              </button>
            </header>

            <dl>
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>

          {/* Account Actions */}
          <div className="profile-sidecards">
            {[
              [
                'Manage Addresses',
                'pin',
                'Add, edit, or remove your delivery addresses'
              ],
              [
                'Change Password',
                'lock',
                'Update your account password securely'
              ]
            ].map(([label, icon, description]) => (
              <button
                type="button"
                className="profile-card profile-action"
                key={label}
                onClick={() => setPanel(label)}
              >
                <ProfileIcon name={icon} size={32} />

                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>

                <span aria-hidden="true">→</span>
              </button>
            ))}

            <article className="profile-card">
              <h2>
                <ProfileIcon name="info" />
                Account Details
              </h2>

              <dl>
                <div>
                  <dt>Account status</dt>
                  <dd>
                    <span
                      className={
                        'profile-status ' +
                        (user.is_active === true ? 'active' : '')
                      }
                    >
                      {user.is_active === true
                        ? 'Active'
                        : user.is_active === false
                        ? 'Inactive'
                        : 'Unknown'}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt>Role</dt>
                  <dd>
                    {user.role === 'user'
                      ? 'User'
                      : user.role || 'Not available'}
                  </dd>
                </div>
              </dl>
            </article>
          </div>
        </div>
      </section>

      {/* Account Settings Modal */}
      {panel && (
        <div
          className="profile-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setPanel('');
            }
          }}
        >
          <section
            key={panel}
            id="profile-dialog"
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            tabIndex={-1}
          >
            <header className="profile-modal-header">
              <div>
                <h2 id="profile-modal-title">{panel}</h2>
                <p>Manage your AuctionVerse account</p>
              </div>

              <button
                type="button"
                className="profile-modal-close"
                aria-label="Close dialog"
                onClick={() => setPanel('')}
              >
                <ProfileIcon name="close" />
              </button>
            </header>

            <ProfileForms key={panel} panel={panel} close={()=>setPanel('')} onSuccess={setNotice}/>
          </section>
        </div>
      )}
    </div>
  );
}
