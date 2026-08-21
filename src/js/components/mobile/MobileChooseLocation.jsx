import React, { useEffect, useState } from 'react';

import queryString from 'query-string';
import { useLocation } from 'react-router-dom';

import { MOBILE_CHOOSE_LOCATION_OPTIONS } from 'api/urls';
import MobileLayout from 'components/mobile/MobileLayout';
import { DASHBOARD_URL } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

// React version of views/mobile/chooseLocation.gsp: an accordion of login
// locations (saved locations first, then locations grouped by organization).
// Selecting a location hits the legacy dashboard/chooseLocation action so the
// session warehouse switch and post-login redirects behave exactly as before.
const MobileChooseLocation = () => {
  const { search } = useLocation();
  const { message } = queryString.parse(search);

  const [savedLocations, setSavedLocations] = useState([]);
  const [loginLocationsMap, setLoginLocationsMap] = useState([]);
  const [openSection, setOpenSection] = useState(0);

  useEffect(() => {
    apiClient.get(MOBILE_CHOOSE_LOCATION_OPTIONS)
      .then((response) => {
        setSavedLocations(response.data.data.savedLocations || []);
        setLoginLocationsMap(response.data.data.loginLocationsMap || []);
      });
  }, []);

  const renderLocationList = (locations) => (
    <ul className="list-group">
      {locations.map((location) => (
        <li key={location.id} className="list-group-item list-group-item-action">
          <a href={DASHBOARD_URL.chooseLocation(location.id)}>
            <span className="text-truncate">{location.name}</span>
          </a>
        </li>
      ))}
    </ul>
  );

  const renderSection = (index, header, locations) => (
    <div key={index} className="accordion-item">
      <h2 className="accordion-header">
        <button
          type="button"
          className={`accordion-button ${openSection === index ? '' : 'collapsed'}`}
          aria-expanded={openSection === index}
          onClick={() => setOpenSection(index)}
        >
          {header}
        </button>
      </h2>
      <div className={`accordion-collapse collapse ${openSection === index ? 'show' : ''}`}>
        {renderLocationList(locations)}
      </div>
    </div>
  );

  return (
    <MobileLayout title={<Translate id="dashboard.chooseLocation.label" defaultMessage="Choose Location" />}>
      {message && (
        <div className="message" role="status" aria-label="message">{message}</div>
      )}
      <div className="row">
        <div className="col-sm-12">
          <div className="accordion">
            {renderSection(
              0,
              <Translate id="user.savedLocations.label" defaultMessage="Saved Locations" />,
              savedLocations,
            )}
            {loginLocationsMap.map((entry, index) => renderSection(
              index + 1,
              entry.organization || (
                <>
                  <Translate id="default.no.label" defaultMessage="No" />
                  {' '}
                  <Translate id="organization.label" defaultMessage="Organization" />
                </>
              ),
              entry.locations,
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileChooseLocation;
