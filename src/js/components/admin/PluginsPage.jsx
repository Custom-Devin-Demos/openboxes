import React, { useEffect, useState } from 'react';

import { ADMIN_PLUGINS } from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const PluginsPage = () => {
  useTranslation('admin', 'default');

  const [plugins, setPlugins] = useState([]);

  useEffect(() => {
    apiClient.get(ADMIN_PLUGINS)
      .then((response) => setPlugins(response.data.data));
  }, []);

  return (
    <PageWrapper>
      <div className="admin-page box">
        <h2>
          <Translate id="react.admin.plugins.label" defaultMessage="Installed Plug-ins" />
        </h2>
        <ul>
          {plugins.map((plugin) => (
            <li key={plugin.name}>
              {plugin.name}
              {' - '}
              {plugin.version}
            </li>
          ))}
        </ul>
      </div>
    </PageWrapper>
  );
};

export default PluginsPage;
