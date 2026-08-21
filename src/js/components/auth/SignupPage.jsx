import React, { useEffect, useState } from 'react';

import { apiClientCustomResponseHandler } from 'utils/apiClient';

import 'components/auth/AuthPages.scss';

const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch (e) {
    return '';
  }
};

const COMMENTS_PLACEHOLDER = 'Tell us more about yourself. What features are important to you? Do you need help getting started?';

const SignupPage = () => {
  const [context, setContext] = useState(null);
  const pageContext = window.PAGE_CONTEXT || {};
  const contextPath = window.CONTEXT_PATH || '';
  const values = pageContext.values || {};
  const errorFields = pageContext.errorFields || [];

  useEffect(() => {
    apiClientCustomResponseHandler.get('/api/signupContext')
      .then((response) => setContext(response.data.data));
  }, []);

  useEffect(() => {
    if (context) {
      document.title = context.labels.title;
      if (context.recaptchaEnabled && !document.getElementById('recaptcha-script')) {
        const script = document.createElement('script');
        script.id = 'recaptcha-script';
        script.src = 'https://www.google.com/recaptcha/api.js';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      window.validateRecaptchaToken = () => {
        document.getElementById('handleSignup').submit();
      };
    }
  }, [context]);

  if (!context) {
    return null;
  }

  const { labels } = context;
  const fieldErrorClass = (field) => (errorFields.includes(field) ? ' errors' : '');

  return (
    <div className="auth-page">
      <div className="body">
        <form id="handleSignup" name="handleSignup" action={`${contextPath}/auth/handleSignup`} method="POST" autoComplete="off">
          <div className="dialog">
            <div id="signupForm">
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
                  {' '}
                  Signup for an account
                </h2>
                <table>
                  <tbody>
                    <tr className="prop">
                      <td className="name middle right">
                        <span className="required">*</span>
                        <label htmlFor="firstName">{labels.firstName}</label>
                      </td>
                      <td className={`value${fieldErrorClass('firstName')}`}>
                        <input type="text" name="firstName" id="firstName" defaultValue={values.firstName || ''} className="text" size="40" />
                      </td>
                    </tr>
                    <tr className="prop">
                      <td className="name middle right">
                        <span className="required">*</span>
                        <label htmlFor="lastName">{labels.lastName}</label>
                      </td>
                      <td className={`value${fieldErrorClass('lastName')}`}>
                        <input type="text" name="lastName" id="lastName" defaultValue={values.lastName || ''} className="text" size="40" />
                      </td>
                    </tr>
                    <tr className="prop">
                      <td className="name middle right">
                        <span className="required">*</span>
                        <label htmlFor="email">{labels.email}</label>
                      </td>
                      <td className={`value${fieldErrorClass('username')}`}>
                        <input type="text" name="email" id="email" defaultValue={values.email || ''} className="text" size="40" autoComplete="off" />
                      </td>
                    </tr>
                    <tr className="prop">
                      <td className="name middle right">
                        <span className="required">*</span>
                        <label htmlFor="password">{labels.password}</label>
                      </td>
                      <td className={`value${fieldErrorClass('password')}`}>
                        <input type="password" name="password" id="password" defaultValue={values.password || ''} className="text" size="40" autoComplete="off" />
                      </td>
                    </tr>
                    <tr className="prop">
                      <td className="name middle right">
                        <span className="required">*</span>
                        <label htmlFor="passwordConfirm">{labels.passwordConfirm}</label>
                      </td>
                      <td className={`value${fieldErrorClass('passwordConfirm')}`}>
                        <input type="password" name="passwordConfirm" id="passwordConfirm" defaultValue={values.passwordConfirm || ''} className="text" size="40" />
                      </td>
                    </tr>
                    <tr className="prop">
                      <td className="name middle right">
                        <label htmlFor="locale">{labels.locale}</label>
                      </td>
                      <td className={`value${fieldErrorClass('locale')}`}>
                        <select name="locale" id="locale" defaultValue={values.locale || ''}>
                          <option value="" aria-label="empty" />
                          {context.supportedLocales.map((locale) => (
                            <option key={locale.code} value={locale.code}>{locale.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr className="prop">
                      <td valign="top" className="name">
                        <label htmlFor="timezone">{labels.timezone}</label>
                      </td>
                      <td valign="top" className="value">
                        <select
                          id="timezone"
                          name="timezone"
                          defaultValue={values.timezone || getBrowserTimezone() || ''}
                        >
                          <option value="" aria-label="empty" />
                          {context.timezones.map((timezone) => (
                            <option key={timezone} value={timezone}>{timezone}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {context.additionalQuestions.map((question) => (
                      <tr className="prop" key={question.id}>
                        <td className="name">
                          <label htmlFor={question.id}>{question.label}</label>
                        </td>
                        <td className="value">
                          {question.options && (
                            <select
                              name={`additionalQuestions.${question.id}`}
                              id={question.id}
                              defaultValue={(values.additionalQuestions
                                && values.additionalQuestions[question.id]) || ''}
                            >
                              {question.options.map((option) => (
                                <option key={option.key} value={option.key}>{option.value}</option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="prop">
                      <td className="name">
                        <label htmlFor="additionalQuestions.comments">{labels.comments}</label>
                      </td>
                      <td valign="top">
                        <textarea
                          name="additionalQuestions.comments"
                          id="additionalQuestions.comments"
                          rows="5"
                          className="text large"
                          placeholder={COMMENTS_PLACEHOLDER}
                          defaultValue={values.comments || ''}
                        />
                      </td>
                    </tr>
                    <tr className="prop">
                      <td className="name middle right" />
                      <td valign="top">
                        {context.recaptchaEnabled ? (
                          <button
                            type="submit"
                            className="button block g-recaptcha"
                            data-sitekey={context.recaptchaSiteKey}
                            data-callback="validateRecaptchaToken"
                            data-action="submit"
                          >
                            <img src={`${contextPath}/images/icons/silk/accept.png`} alt="" className="middle" />
                            {' '}
                            {labels.signupButton}
                          </button>
                        ) : (
                          <button type="submit" className="button block">
                            {labels.signupButton}
                          </button>
                        )}
                      </td>
                    </tr>
                    <tr className="prop">
                      <td className="name" />
                      <td className="value">
                        {labels.alreadyHaveAccount}
                        &nbsp;
                        <a className="list" href={`${contextPath}/auth/login`}>{labels.login}</a>
                        <div className="right">
                          <span className="required">*</span>
                          {' '}
                          denotes required fields
                        </div>
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

export default SignupPage;
