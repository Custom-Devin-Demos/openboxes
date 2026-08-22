import React from 'react';

import PropTypes from 'prop-types';

import ErrorPageWrapper, { ErrorPageBubble } from 'components/errors/ErrorPageWrapper';
import Translate from 'utils/Translate';

const AccessDeniedPage = ({ errorPage }) => (
  <ErrorPageWrapper
    flashMessage={errorPage.flashMessage}
    title={<Translate id="react.error.accessDenied.label" defaultMessage="Access Denied" />}
  >
    <ErrorPageBubble>
      <Translate
        id="react.error.accessDenied.message"
        defaultMessage="Apologies, but you are not authorized to access this page or to perform this action."
      />
    </ErrorPageBubble>
  </ErrorPageWrapper>
);

export default AccessDeniedPage;

AccessDeniedPage.propTypes = {
  errorPage: PropTypes.shape({
    flashMessage: PropTypes.string,
  }).isRequired,
};
