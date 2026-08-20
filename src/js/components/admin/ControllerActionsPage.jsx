import React, { useEffect, useState } from 'react';

import { ADMIN_CONTROLLER_ACTIONS } from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const ControllerActionsPage = () => {
  useTranslation('admin', 'default');

  const [actionNames, setActionNames] = useState([]);

  useEffect(() => {
    apiClient.get(ADMIN_CONTROLLER_ACTIONS)
      .then((response) => setActionNames(response.data.data));
  }, []);

  return (
    <PageWrapper>
      <div className="admin-page box">
        <h2>
          <Translate id="react.admin.controllerActions.label" defaultMessage="Controller actions" />
        </h2>
        <ul>
          {actionNames.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>
    </PageWrapper>
  );
};

export default ControllerActionsPage;
