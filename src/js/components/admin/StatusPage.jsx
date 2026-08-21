import React, { useEffect, useState } from 'react';

import { ADMIN_STATUS } from 'api/urls';
import { CONTEXT_PATH } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const StatusPage = () => {
  useTranslation('admin', 'default');

  const [status, setStatus] = useState(null);

  useEffect(() => {
    apiClient.get(ADMIN_STATUS)
      .then((response) => setStatus(response.data.data));
  }, []);

  return (
    <PageWrapper>
      <div className="admin-page box">
        <div className="yui-gb">
          <div className="yui-u first">
            <h1>
              <Translate id="react.admin.status.applicationStatus.label" defaultMessage="Application Status" />
            </h1>
            <ul>
              <li>
                <Translate id="react.admin.status.appVersion.label" defaultMessage="App version" />
                {': '}
                {status?.appVersion}
              </li>
              <li>
                <Translate id="react.admin.status.grailsVersion.label" defaultMessage="Grails version" />
                {': '}
                {status?.grailsVersion}
              </li>
              <li>
                <Translate id="react.admin.status.jvmVersion.label" defaultMessage="JVM version" />
                {': '}
                {status?.jvmVersion}
              </li>
              <li>
                <Translate id="react.admin.status.controllers.label" defaultMessage="Controllers" />
                {': '}
                {status?.controllerCount}
              </li>
              <li>
                <Translate id="react.admin.status.domains.label" defaultMessage="Domains" />
                {': '}
                {status?.domainCount}
              </li>
              <li>
                <Translate id="react.admin.status.services.label" defaultMessage="Services" />
                {': '}
                {status?.serviceCount}
              </li>
              <li>
                <Translate id="react.admin.status.tagLibraries.label" defaultMessage="Tag Libraries" />
                {': '}
                {status?.tagLibCount}
              </li>
            </ul>
          </div>
          <div className="yui-u">
            <h1>
              <Translate id="react.admin.status.installedPlugins.label" defaultMessage="Installed Plugins" />
            </h1>
            <ul>
              {status?.plugins?.map((plugin) => (
                <li key={plugin.name}>
                  {plugin.name}
                  {' - '}
                  {plugin.version}
                </li>
              ))}
            </ul>
          </div>
          <div className="yui-u">
            <h1>
              <Translate id="react.admin.status.availableControllers.label" defaultMessage="Available Controllers" />
            </h1>
            <ul>
              {status?.controllers?.map((controller) => (
                <li className="controller" key={controller.name}>
                  <a href={`${CONTEXT_PATH}/${controller.logicalPropertyName}`}>
                    {controller.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default StatusPage;
