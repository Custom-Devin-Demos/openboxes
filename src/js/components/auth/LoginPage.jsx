import React, { useEffect, useState } from 'react';

import queryString from 'query-string';

import { apiClientCustomResponseHandler } from 'utils/apiClient';

import 'components/auth/AuthPages.scss';

const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch (e) {
    return '';
  }
};

// Mirrors openboxes.expireFromLocal() from the legacy login page: it drops
// locally cached requisitions that have not been accessed in the last 7 days.
const expireFromLocal = () => {
  try {
    if (typeof Storage === 'undefined' || !localStorage.openboxesManager) {
      return;
    }
    const manager = JSON.parse(localStorage.openboxesManager);
    Object.keys(manager).forEach((prop) => {
      const lastAccessDate = new Date(manager[prop]);
      lastAccessDate.setDate(lastAccessDate.getDate() + 7);
      if (new Date() > lastAccessDate) {
        if (localStorage[prop]) {
          delete localStorage[prop];
        }
      }
    });
  } catch (e) {
    // ignore malformed local storage content, same as the legacy page
  }
};

const LoginPage = () => {
  const [labels, setLabels] = useState(null);
  const pageContext = window.PAGE_CONTEXT || {};
  const contextPath = window.CONTEXT_PATH || '';
  const { targetUri } = queryString.parse(window.location.search);

  useEffect(() => {
    expireFromLocal();
    apiClientCustomResponseHandler.get('/api/loginContext')
      .then((response) => setLabels(response.data.data.labels));
  }, []);

  useEffect(() => {
    if (labels) {
      document.title = labels.title;
      const usernameInput = document.getElementById('username');
      if (usernameInput) {
        usernameInput.focus();
      }
    }
  }, [labels]);

  if (!labels) {
    return null;
  }

  return (
    <div className="auth-page">
      <div className="body">
        <form action={`${contextPath}/auth/handleLogin`} method="post">
          <input type="hidden" name="targetUri" value={targetUri || pageContext.targetUri || ''} />
          <input type="hidden" id="browserTimezone" name="browserTimezone" value={getBrowserTimezone()} />

          <div id="loginContainer" className="dialog">
            <div id="loginForm">
              {pageContext.flashMessage && (
                <div className="message" role="status" aria-label="message">{pageContext.flashMessage}</div>
              )}

              {pageContext.errors && pageContext.errors.length > 0 && (
                <div className="errors" role="alert" aria-label="error-message">
                  <ul>
                    {pageContext.errors.map((error) => <li key={error}>{error}</li>)}
                  </ul>
                </div>
              )}

              <div id="loginBox" className="box">
                <h2>
                  <img src={`${contextPath}/images/icons/silk/lock.png`} alt="" className="middle" />
                  {labels.login}
                </h2>

                <table>
                  <tbody>
                    <tr>
                      <td className="left middle">
                        <input
                          className="text"
                          type="text"
                          id="username"
                          name="username"
                          placeholder={labels.username}
                          defaultValue={pageContext.username || ''}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="left middle">
                        <input
                          className="text"
                          type="password"
                          id="password"
                          name="password"
                          placeholder={labels.password}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="middle center">
                        <button type="submit" className="button big" id="loginButton">
                          {labels.loginButton}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="middle left" colSpan="2">
                        {labels.newUserText}
                        &nbsp;
                        <a className="list" href={`${contextPath}/auth/signup`}>{labels.signup}</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
