import React from 'react';

import PropTypes from 'prop-types';

import ErrorPageWrapper, { ErrorPageBubble } from 'components/errors/ErrorPageWrapper';
import { CONTEXT_PATH } from 'consts/applicationUrls';
import Translate from 'utils/Translate';

const NotFoundPage = ({ errorPage }) => (
  <ErrorPageWrapper
    flashMessage={errorPage.flashMessage}
    title={(
      <>
        <img src={`${CONTEXT_PATH}/images/icons/silk/error.png`} alt="" />
        {errorPage.id ? (
          <Translate
            id="react.error.resourceWithIdNotFound.title"
            defaultMessage={`Resource with ID ${errorPage.id} not found`}
            data={{ 0: errorPage.id }}
          />
        ) : (
          <>
            <Translate id="react.error.resourceNotFound.title" defaultMessage="Resource not found" />
            {' (404)'}
          </>
        )}
      </>
    )}
  >
    <ErrorPageBubble>
      {errorPage.exceptionMessage && (
        <>
          {errorPage.exceptionMessage}
          {' '}
        </>
      )}
      <Translate
        id="react.error.resourceNotFound.message"
        defaultMessage="Sorry, that resource could not be found"
      />
    </ErrorPageBubble>
  </ErrorPageWrapper>
);

export default NotFoundPage;

NotFoundPage.propTypes = {
  errorPage: PropTypes.shape({
    flashMessage: PropTypes.string,
    id: PropTypes.string,
    exceptionMessage: PropTypes.string,
  }).isRequired,
};
