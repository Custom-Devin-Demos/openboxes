import React from 'react';

import { useSelector } from 'react-redux';

import { CONTEXT_PATH, STOCK_MOVEMENT_URL } from 'consts/applicationUrls';

const MobileMenuBar = () => {
  const { logoUrl, currentLocation, highestRole } = useSelector((state) => state.session);
  const logoLink = highestRole === 'Authenticated' ? STOCK_MOVEMENT_URL.listInbound() : `${CONTEXT_PATH}/`;

  return (
    <nav className="navbar navbar-light bg-light p-2 border-bottom">
      {currentLocation?.id ? (
        <div id="logo-wrapper" className="d-flex align-items-center gap-8" aria-label="logo">
          <div id="logo-square">
            <a href={logoLink}>
              <img src={logoUrl} alt="Openboxes" width="40" height="40" />
            </a>
          </div>
        </div>
      ) : (
        <a className="navbar-brand" href="#">
          <img src="https://openboxes.com/img/logo_30.png" alt="Openboxes" />
        </a>
      )}
    </nav>
  );
};

export default MobileMenuBar;
