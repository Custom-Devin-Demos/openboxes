import React from 'react';

import PropTypes from 'prop-types';

// Lightweight layout for the mobile mini-app (parity with views/layouts/mobile.gsp:
// page title rendered as a top-level heading above the body).
const MobileLayout = ({ title, children }) => (
  <div className="container-fluid p-2">
    <h1>{title}</h1>
    {children}
  </div>
);

export default MobileLayout;

MobileLayout.propTypes = {
  title: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
};
