import React from 'react';

import AccessDeniedPage from 'components/errors/AccessDeniedPage';
import DataAccessErrorPage from 'components/errors/DataAccessErrorPage';
import GeneralErrorPage from 'components/errors/GeneralErrorPage';
import MethodNotAllowedPage from 'components/errors/MethodNotAllowedPage';
import NotFoundPage from 'components/errors/NotFoundPage';
import getErrorPage from 'utils/errorPageUtils';

const ErrorPage = () => {
  const errorPage = getErrorPage() || {};

  switch (errorPage.page) {
    case 'accessDenied':
      return <AccessDeniedPage errorPage={errorPage} />;
    case 'notFound':
      return <NotFoundPage errorPage={errorPage} />;
    case 'methodNotAllowed':
      return <MethodNotAllowedPage errorPage={errorPage} />;
    case 'dataAccess':
      return <DataAccessErrorPage errorPage={errorPage} />;
    default:
      return <GeneralErrorPage errorPage={errorPage} />;
  }
};

export default ErrorPage;
