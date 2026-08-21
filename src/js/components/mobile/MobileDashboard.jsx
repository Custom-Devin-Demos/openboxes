import React, { useEffect, useState } from 'react';

import { MOBILE_DASHBOARD } from 'api/urls';
import MobileLayout from 'components/mobile/MobileLayout';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

// React version of views/mobile/index.gsp: indicator cards with entity counts
// for the current location, each linking to its legacy list screen.
const MobileDashboard = () => {
  const [indicators, setIndicators] = useState([]);

  useEffect(() => {
    apiClient.get(MOBILE_DASHBOARD)
      .then((response) => setIndicators(response.data.data || []));
  }, []);

  return (
    <MobileLayout title={<Translate id="dashboard.label" defaultMessage="Dashboard" />}>
      <div className="row">
        {indicators.map((indicator) => (
          <div key={indicator.name} className="col-md-4">
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">
                  <i className={indicator.class} />
                  {' '}
                  {indicator.name}
                </h5>
                <h2 className="card-text">
                  <a href={indicator.url} className="text-decoration-none">{indicator.count}</a>
                </h2>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MobileLayout>
  );
};

export default MobileDashboard;
