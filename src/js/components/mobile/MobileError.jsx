import React, { useEffect, useState } from 'react';

import { MOBILE_ERROR_DETAILS } from 'api/urls';
import MobileLayout from 'components/mobile/MobileLayout';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

// React version of views/mobile/error.gsp: shows details of the last error
// captured for mobile user agents (status code, message, URI, exception and
// stack trace when available).
const MobileError = () => {
  const [error, setError] = useState({});

  useEffect(() => {
    apiClient.get(MOBILE_ERROR_DETAILS)
      .then((response) => setError(response.data.data || {}));
  }, []);

  return (
    <MobileLayout title={<Translate id="inventory.browse.label" defaultMessage="Browse inventory" />}>
      <div className="container-fluid">
        <h2>Error Details</h2>
        <div className="message" role="status" aria-label="message">
          <strong>
            Error
            {' '}
            {error.statusCode}
            :
          </strong>
          {' '}
          {error.message}
          <br />
          <strong>Servlet:</strong>
          {' '}
          {error.servletName}
          <br />
          <strong>URI:</strong>
          {' '}
          {error.requestUri}
          <br />
          {error.exceptionMessage && (
            <>
              <strong>Exception Message:</strong>
              {' '}
              {error.exceptionMessage}
              <br />
              <strong>Caused by:</strong>
              {' '}
              {error.causeMessage}
              <br />
              <strong>Class:</strong>
              {' '}
              {error.className}
              <br />
            </>
          )}
        </div>
        {error.stackTraceLines && error.stackTraceLines.length > 0 && (
          <>
            <h2>Stack Trace</h2>
            <code>
              <pre>{error.stackTraceLines.join('\n')}</pre>
            </code>
          </>
        )}
      </div>
    </MobileLayout>
  );
};

export default MobileError;
