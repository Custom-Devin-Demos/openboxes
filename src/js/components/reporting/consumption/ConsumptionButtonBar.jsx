import React from 'react';

import { useSelector } from 'react-redux';

import Translate from 'utils/Translate';

const ConsumptionButtonBar = () => {
  const isSuperuser = useSelector((state) => state.session.isSuperuser);

  return (
    <div className="d-flex justify-content-between mb-3">
      <div>
        <a className="btn btn-outline-primary btn-sm mr-2" href={`${window.CONTEXT_PATH}/consumption/list`}>
          <Translate id="react.consumption.report.show.label" defaultMessage="Show Consumption Report" />
        </a>
        <a className="btn btn-outline-primary btn-sm" href={`${window.CONTEXT_PATH}/consumption/pivot`}>
          <Translate id="react.consumption.report.edit.label" defaultMessage="Edit Consumption Report" />
        </a>
      </div>
      {isSuperuser && (
        <a className="btn btn-outline-secondary btn-sm" href={`${window.CONTEXT_PATH}/consumption/refresh`}>
          <Translate id="react.consumption.refreshData.label" defaultMessage="Refresh data" />
        </a>
      )}
    </div>
  );
};

export default ConsumptionButtonBar;
