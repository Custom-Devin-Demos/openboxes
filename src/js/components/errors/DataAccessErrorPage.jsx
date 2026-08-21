import React from 'react';

import PropTypes from 'prop-types';

import ErrorPageWrapper, { ErrorPageBubble } from 'components/errors/ErrorPageWrapper';
import Translate from 'utils/Translate';

const DataAccessErrorPage = ({ errorPage }) => {
  const { exception } = errorPage;

  return (
    <ErrorPageWrapper
      flashMessage={errorPage.flashMessage}
      title={<Translate id="react.error.dataAccess.label" defaultMessage="Data Access Error" />}
    >
      <ErrorPageBubble>
        <Translate
          id="react.error.dataAccess.message"
          defaultMessage="Apologies, but you just tried to do something unspeakable to the database."
        />
      </ErrorPageBubble>
      <div className="error-page-details">
        <h2><Translate id="react.error.errorDetails.label" defaultMessage="Error Details" /></h2>
        <div className="error-page-flash-message">
          <strong>
            Error
            {' '}
            {errorPage.statusCode}
            :
          </strong>
          {' '}
          {errorPage.errorMessage}
          <br />
          <strong>Servlet:</strong>
          {' '}
          {errorPage.servletName}
          <br />
          <strong>URI:</strong>
          {' '}
          {errorPage.requestUri}
          <br />
          {exception && (
            <>
              <strong>Exception Message:</strong>
              {' '}
              {exception.message}
              <br />
              <strong>Caused by:</strong>
              {' '}
              {exception.causeMessage}
              <br />
              <strong>Class:</strong>
              {' '}
              {exception.className}
              <br />
              <strong>At Line:</strong>
              {' '}
              [
              {exception.lineNumber}
              ]
              <br />
              <strong>Code Snippet:</strong>
              <br />
              <div className="snippet">
                {(exception.codeSnippet || []).map((line) => (
                  <React.Fragment key={line}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </div>
            </>
          )}
        </div>
        {exception && (
          <>
            <h2><Translate id="react.error.stackTrace.label" defaultMessage="Stack Trace" /></h2>
            <div className="stack">
              <pre>{(exception.stackTraceLines || []).join('\n')}</pre>
            </div>
          </>
        )}
      </div>
    </ErrorPageWrapper>
  );
};

export default DataAccessErrorPage;

DataAccessErrorPage.propTypes = {
  errorPage: PropTypes.shape({
    flashMessage: PropTypes.string,
    statusCode: PropTypes.number,
    errorMessage: PropTypes.string,
    servletName: PropTypes.string,
    requestUri: PropTypes.string,
    exception: PropTypes.shape({
      message: PropTypes.string,
      causeMessage: PropTypes.string,
      className: PropTypes.string,
      lineNumber: PropTypes.number,
      codeSnippet: PropTypes.arrayOf(PropTypes.string),
      stackTraceLines: PropTypes.arrayOf(PropTypes.string),
    }),
  }).isRequired,
};
