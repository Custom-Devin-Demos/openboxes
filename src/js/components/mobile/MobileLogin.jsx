import React from 'react';

import queryString from 'query-string';
import { useLocation } from 'react-router-dom';

import MobileLayout from 'components/mobile/MobileLayout';
import { AUTH_URL } from 'consts/applicationUrls';

// React version of views/mobile/login.gsp. The form posts credentials to the
// legacy auth/handleLogin action, which owns the mobile login flow (redirects
// to location chooser or dashboard on success, back here on failure).
const MobileLogin = () => {
  const { search } = useLocation();
  const { message } = queryString.parse(search);

  return (
    // The login screen renders before authentication, when translations are
    // not initialized yet, so it uses plain-text labels like the legacy GSP.
    <MobileLayout title="Login">
      <div className="container">
        {message && (
          <div className="message" role="status" aria-label="message">{message}</div>
        )}
        <div className="row">
          <div className="col-sm-12">
            <form method="post" action={AUTH_URL.handleLogin()}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Email address</label>
                <input className="form-control" id="username" name="username" />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input type="password" className="form-control" id="password" name="password" />
              </div>
              <div className="d-grid gap-2">
                <button type="submit" className="btn btn-outline-primary">Login</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileLogin;
