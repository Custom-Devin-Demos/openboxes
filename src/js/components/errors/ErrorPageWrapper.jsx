import React from 'react';

import PropTypes from 'prop-types';

import { CONTEXT_PATH } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';

import 'components/errors/errorPages.scss';

const ErrorPageWrapper = ({ flashMessage, title, children }) => {
  useTranslation('error', 'default');

  return (
    <div className="error-page">
      {flashMessage && (
        <div className="error-page-flash-message" role="status" aria-label="message">
          {flashMessage}
        </div>
      )}
      {title && (
        <div className="error-page-title">
          {title}
        </div>
      )}
      {children}
    </div>
  );
};

export const ErrorPageBubble = ({ children }) => (
  <div className="error-page-bubble-container">
    <div className="triangle-isosceles">
      {children}
    </div>
    <div className="error-page-portrait">
      <img src={`${CONTEXT_PATH}/assets/jgreenspan.png`} alt="" />
    </div>
  </div>
);

export default ErrorPageWrapper;

ErrorPageWrapper.propTypes = {
  flashMessage: PropTypes.string,
  title: PropTypes.node,
  children: PropTypes.node,
};

ErrorPageWrapper.defaultProps = {
  flashMessage: null,
  title: null,
  children: null,
};

ErrorPageBubble.propTypes = {
  children: PropTypes.node.isRequired,
};
