import React, { useEffect, useState } from 'react';

import { ADMIN_CONTROLLERS } from 'api/urls';
import { CONTEXT_PATH } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const AdminIndexPage = () => {
  useTranslation('admin', 'default');

  const [controllers, setControllers] = useState([]);

  useEffect(() => {
    apiClient.get(ADMIN_CONTROLLERS)
      .then((response) => setControllers(response.data.data));
  }, []);

  return (
    <PageWrapper>
      <div className="admin-page box">
        <h2>
          <Translate id="react.admin.controllers.label" defaultMessage="Controllers" />
        </h2>
        <ul>
          {controllers.map((controller) => (
            <li key={controller.fullName} className="controller">
              <a href={`${CONTEXT_PATH}/${controller.logicalPropertyName}`}>
                {controller.fullName}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </PageWrapper>
  );
};

export default AdminIndexPage;
