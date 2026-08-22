import React from 'react';

import PropTypes from 'prop-types';

import ErrorPageWrapper, { ErrorPageBubble } from 'components/errors/ErrorPageWrapper';
import Translate from 'utils/Translate';

const MethodNotAllowedPage = ({ errorPage }) => (
  <ErrorPageWrapper
    flashMessage={errorPage.flashMessage}
    title={(
      <>
        <Translate id="react.error.methodNotAllowed.label" defaultMessage="Method not allowed" />
        {' (405)'}
      </>
    )}
  >
    <ErrorPageBubble>
      <Translate
        id="react.error.methodNotAllowed.message"
        defaultMessage="Apologies, but you are not allowed to do *that* on that page."
        options={{ renderInnerHtml: true }}
      />
    </ErrorPageBubble>
  </ErrorPageWrapper>
);

export default MethodNotAllowedPage;

MethodNotAllowedPage.propTypes = {
  errorPage: PropTypes.shape({
    flashMessage: PropTypes.string,
  }).isRequired,
};
