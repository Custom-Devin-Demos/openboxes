import React, { useRef, useState } from 'react';

import PropTypes from 'prop-types';

import ErrorPageWrapper from 'components/errors/ErrorPageWrapper';
import { CONTEXT_PATH, DASHBOARD_URL } from 'consts/applicationUrls';
import Translate from 'utils/Translate';

const exceptionShape = PropTypes.shape({
  message: PropTypes.string,
  causeMessage: PropTypes.string,
  className: PropTypes.string,
  lineNumber: PropTypes.number,
  codeSnippet: PropTypes.arrayOf(PropTypes.string),
  stackTraceLines: PropTypes.arrayOf(PropTypes.string),
});

const BugReportDialog = ({ errorPage, onClose }) => {
  const { bugReport, exception } = errorPage;
  const [validationError, setValidationError] = useState(null);
  const commentsRef = useRef(null);

  const checkFormSubmission = (event) => {
    if (!commentsRef.current?.value) {
      setValidationError(
        'Please describe your bug, including steps to reproduce and any other information you can gather.',
      );
      event.preventDefault();
    }
  };

  const absoluteTargetUri = `${window.location.origin}${CONTEXT_PATH}${errorPage.path || ''}`;

  return (
    <div className="error-page-dialog-overlay">
      <div className="error-page-dialog" title="Report a Bug">
        <h2><Translate id="react.error.reportBug.title.label" defaultMessage="Report a Bug" /></h2>
        {bugReport?.enabled ? (
          <>
            {validationError && (
              <ul className="error-page-errors" role="alert">
                <li>{validationError}</li>
              </ul>
            )}
            <form
              method="post"
              action={`${CONTEXT_PATH}/errors/processError`}
              onSubmit={checkFormSubmission}
            >
              <input type="hidden" name="dom" value="" />
              <input type="hidden" name="reportedBy" value={bugReport?.user?.username || ''} />
              <input type="hidden" name="targetUri" value={errorPage.path || ''} />
              <input type="hidden" name="request.statusCode" value={errorPage.statusCode || ''} />
              <input type="hidden" name="request.errorMessage" value={errorPage.errorMessage || ''} />
              <input type="hidden" name="exception.message" value={exception?.message || ''} />
              <input type="hidden" name="exception.class" value={exception?.className || ''} />
              <input type="hidden" name="exception.date" value={new Date().toString()} />
              <input type="hidden" name="absoluteTargetUri" value={absoluteTargetUri} />
              <table>
                <tbody>
                  <tr className="prop">
                    <td className="name">
                      <Translate id="react.error.reportedTo.label" defaultMessage="To" />
                    </td>
                    <td className="value">
                      {bugReport?.recipients?.length
                        ? bugReport.recipients.join(';')
                        : 'errors@openboxes.com'}
                    </td>
                  </tr>
                  <tr className="prop">
                    <td className="name">
                      <Translate id="react.error.reportedBy.label" defaultMessage="From" />
                    </td>
                    <td className="value">
                      {bugReport?.user ? (
                        <>
                          {bugReport.user.name}
                          {' '}
                          <a href={`mailto:${bugReport.user.email}`} target="_blank" rel="noopener noreferrer">
                            {bugReport.user.email}
                          </a>
                          {' '}
                          <label htmlFor="ccMe">
                            <input type="checkbox" id="ccMe" name="ccMe" defaultChecked />
                            {' '}
                            <Translate
                              id="react.error.reportCcMe.label"
                              defaultMessage="Send a copy of this bug report to me."
                            />
                          </label>
                        </>
                      ) : bugReport?.mailFrom}
                    </td>
                  </tr>
                  <tr className="prop">
                    <td className="name">
                      <Translate id="react.error.summary.label" defaultMessage="Summary" />
                    </td>
                    <td className="value">
                      <input
                        type="text"
                        name="summary"
                        className="text"
                        size="80"
                        defaultValue={exception?.message || ''}
                        placeholder="e.g. Receive shipment throws NullPointerException"
                      />
                    </td>
                  </tr>
                  <tr className="prop">
                    <td className="name">
                      <Translate id="react.error.details.label" defaultMessage="Steps to reproduce" />
                    </td>
                    <td className="value">
                      <textarea
                        ref={commentsRef}
                        name="comments"
                        cols="80"
                        rows="10"
                        placeholder="Please tell us what happened ..."
                      />
                    </td>
                  </tr>
                  <tr className="prop">
                    <td className="name" />
                    <td className="value">
                      <button type="submit" className="button icon mail">
                        <Translate id="react.default.button.submit.label" defaultMessage="Submit" />
                      </button>
                      &nbsp;
                      <button type="button" className="button icon remove" onClick={onClose}>
                        <Translate id="react.default.button.close.label" defaultMessage="Close" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </form>
          </>
        ) : (
          <div className="empty fade center">
            <Translate
              id="react.error.errorReportDisabled.message"
              defaultMessage="The bug reporting system has been disabled. Please contact your system administrator for more information."
            />
            <div className="mt-2">
              <button type="button" className="button" onClick={onClose}>
                <Translate id="react.default.button.close.label" defaultMessage="Close" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const GeneralErrorPage = ({ errorPage }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { exception } = errorPage;

  return (
    <ErrorPageWrapper flashMessage={errorPage.flashMessage}>
      <div className="error-page-buttons mb-3">
        <a
          href={DASHBOARD_URL.base}
          className="button"
          onClick={() => window.history.go(-1)}
        >
          <Translate id="react.error.ignoreError.label" defaultMessage="Go Back" />
        </a>
        {' '}
        <button type="button" className="button" onClick={() => setDialogOpen(true)}>
          <Translate id="react.error.reportAsBug.label" defaultMessage="Report bug" />
        </button>
      </div>
      <div className="error-page-details">
        {exception ? (
          <>
            <div className="error-page-errors" role="alert" aria-label="error-message">
              <strong>
                {exception.className}
              </strong>
              {exception.message && `: ${exception.message}`}
              {exception.lineNumber != null && (
                <>
                  <br />
                  At Line: [
                  {exception.lineNumber}
                  ]
                </>
              )}
            </div>
            {exception.codeSnippet?.length > 0 && (
              <div className="snippet">
                {exception.codeSnippet.map((line) => (
                  <React.Fragment key={line}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </div>
            )}
            {exception.stackTraceLines?.length > 0 && (
              <div className="stack">
                <pre>{exception.stackTraceLines.join('\n')}</pre>
              </div>
            )}
          </>
        ) : (
          <ul className="error-page-errors" role="alert" aria-label="error-message">
            <li>An error has occurred</li>
            <li>
              Message:
              {' '}
              {errorPage.errorMessage}
            </li>
            <li>
              Path:
              {' '}
              {errorPage.path}
            </li>
          </ul>
        )}
      </div>
      {dialogOpen && (
        <BugReportDialog errorPage={errorPage} onClose={() => setDialogOpen(false)} />
      )}
    </ErrorPageWrapper>
  );
};

export default GeneralErrorPage;

const errorPageShape = PropTypes.shape({
  flashMessage: PropTypes.string,
  statusCode: PropTypes.number,
  errorMessage: PropTypes.string,
  path: PropTypes.string,
  exception: exceptionShape,
  bugReport: PropTypes.shape({
    enabled: PropTypes.bool,
    recipients: PropTypes.arrayOf(PropTypes.string),
    mailFrom: PropTypes.string,
    user: PropTypes.shape({
      username: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string,
    }),
  }),
});

GeneralErrorPage.propTypes = {
  errorPage: errorPageShape.isRequired,
};

BugReportDialog.propTypes = {
  errorPage: errorPageShape.isRequired,
  onClose: PropTypes.func.isRequired,
};
