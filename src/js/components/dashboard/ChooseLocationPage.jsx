import React, { useEffect, useState } from 'react';

import queryString from 'query-string';

import 'components/auth/AuthPages.scss';

const locationColorStyle = (backgroundColor) => {
  const locationColor = backgroundColor ? backgroundColor.replace('#', '').toUpperCase() : null;
  if (!locationColor || ['FFFFFF', 'FFFF'].includes(locationColor)) {
    return { '--location-color': 'unset' };
  }
  return { '--location-color': `#${locationColor}` };
};

const ChooseLocationPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const pageContext = window.PAGE_CONTEXT || {};
  const contextPath = window.CONTEXT_PATH || '';
  const { targetUri } = queryString.parse(window.location.search);

  const { labels = {}, organizations, savedLocations } = pageContext;

  useEffect(() => {
    if (labels.chooseLocation) {
      document.title = labels.chooseLocation;
    }
  }, []);
  const hasSavedLocations = savedLocations && savedLocations.length > 0;
  // tab indexes: saved locations tab (when present) is first, organization tabs follow
  const organizationTabOffset = hasSavedLocations ? 1 : 0;

  const locationLink = (locationId) => {
    const effectiveTargetUri = targetUri || pageContext.targetUri;
    const params = effectiveTargetUri ? `?${queryString.stringify({ targetUri: effectiveTargetUri })}` : '';
    return `${contextPath}/dashboard/chooseLocation/${locationId}${params}`;
  };

  const renderLocation = (location) => (
    <span key={location.id}>
      <a
        href={locationLink(location.id)}
        className="element"
        style={locationColorStyle(location.backgroundColor)}
      >
        <i className="ri-map-pin-line" />
        <span>{location.name}</span>
      </a>
    </span>
  );

  return (
    <div className="auth-page choose-location-page">
      <div className="d-flex justify-content-center align-items-center h-100">
        <div className="location-chooser location-chooser__login">
          <div className="location-chooser__header">
            <h2>{labels.chooseLocation}</h2>
            {pageContext.flashMessage && (
              <div className="message" role="status" aria-label="message">{pageContext.flashMessage}</div>
            )}
          </div>
          <form>
            {organizations && organizations.length > 0 ? (
              <div data-testid="location-chooser-modal" className="tabs tabs-left">
                <ul className="scrollbar ui-tabs-nav" data-testid="location-organization-list">
                  {hasSavedLocations && (
                    <li
                      role="tab"
                      className={`organization-tab${activeTab === 0 ? ' ui-tabs-selected' : ''}`}
                    >
                      <a
                        href="#saved-locations"
                        onClick={(event) => { event.preventDefault(); setActiveTab(0); }}
                      >
                        {labels.savedLocations}
                      </a>
                    </li>
                  )}
                  {organizations.map((organization, index) => (
                    <li
                      role="tab"
                      key={organization.organization || 'no-organization'}
                      className={`organization-tab${activeTab === index + organizationTabOffset ? ' ui-tabs-selected' : ''}`}
                    >
                      <a
                        href={`#organization-${index}`}
                        onClick={(event) => {
                          event.preventDefault();
                          setActiveTab(index + organizationTabOffset);
                        }}
                      >
                        {organization.organization || 'No organization'}
                      </a>
                    </li>
                  ))}
                </ul>
                {hasSavedLocations && activeTab === 0 && (
                  <div id="saved-locations" className="organization-group scrollbar ui-tabs-panel">
                    <div className="location-group">
                      <h6 className="heading"><span>{labels.savedLocations}</span></h6>
                      {savedLocations.map(renderLocation)}
                    </div>
                  </div>
                )}
                {organizations.map((organization, index) => (
                  activeTab === index + organizationTabOffset && (
                    <div
                      id={`organization-${index}`}
                      key={organization.organization || 'no-organization'}
                      className="organization-group scrollbar ui-tabs-panel"
                      data-testid="location-list"
                    >
                      {organization.locationGroups.map((locationGroup) => (
                        <div className="location-group" key={locationGroup.name || 'no-location-group'}>
                          <h6 className="heading"><span>{locationGroup.name || 'No Location Group'}</span></h6>
                          {locationGroup.locations.map(renderLocation)}
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="error center">
                {labels.noWarehouse}
              </div>
            )}
            <div className="d-flex justify-content-between location-chooser__footer">
              <div
                className="location-chooser__footer__last-signin d-flex align-items-center justify-content-center"
                // The server-localized message contains markup (a span with the exact
                // date as its tooltip), matching the legacy GSP output.
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: labels.lastLoggedIn }}
              />
              <div className="d-flex justify-content-center align-items-center">
                <span className="location-chooser__footer__logout-user mr-2">
                  {labels.loggedInAs}
                  .
                </span>
                <a className="location-chooser__footer__logout-btn" href={`${contextPath}/auth/logout`}>
                  <i className="ri-logout-box-r-line" />
                  {labels.logout}
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChooseLocationPage;
