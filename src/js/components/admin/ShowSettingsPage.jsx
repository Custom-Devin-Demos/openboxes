import React, { useEffect, useState } from 'react';

import { useLocation } from 'react-router-dom';

import { ADMIN_SETTINGS, ADMIN_TRIGGER_STOCK_ALERTS } from 'api/urls';
import notification from 'components/Layout/notifications/notification';
import { ADMIN_URL, CONTEXT_PATH } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const CACHE_COLUMNS = [
  'name',
  'status',
  'eternal',
  'overflowToDisk',
  'maxElementsInMemory',
  'maxElementsOnDisk',
  'memoryStoreEvictionPolicy',
  'timeToLiveSeconds',
  'timeToIdleSeconds',
  'diskPersistent',
  'diskExpiryThreadIntervalSeconds',
];

const ShowSettingsPage = () => {
  useTranslation('admin', 'default');

  const location = useLocation();
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [jobStatus, setJobStatus] = useState('');

  useEffect(() => {
    apiClient.get(ADMIN_SETTINGS)
      .then((response) => setSettings(response.data.data));
  }, []);

  const showJobStatus = () => {
    apiClient.get(`${CONTEXT_PATH}/json/statusCalculateHistoricalQuantityJob`)
      .then((response) => setJobStatus(String(response.data)));
  };

  const enableJob = () => {
    apiClient.get(`${CONTEXT_PATH}/json/enableCalculateHistoricalQuantityJob`);
  };

  const disableJob = () => {
    apiClient.get(`${CONTEXT_PATH}/json/disableCalculateHistoricalQuantityJob`);
  };

  const triggerStockAlerts = () => {
    apiClient.post(ADMIN_TRIGGER_STOCK_ALERTS)
      .then((response) => {
        notification(NotificationType.SUCCESS)({ message: response.data.data.message });
      });
  };

  const returnUrl = location.pathname;

  const tabs = [
    { id: 'general', label: <Translate id="react.admin.generalSettings.header.label" defaultMessage="General settings" /> },
    { id: 'email', label: <Translate id="react.admin.emailSettings.header.label" defaultMessage="Email settings" /> },
    { id: 'externalConfig', label: <Translate id="react.admin.externalAppConfig.header.label" defaultMessage="External application configuration" /> },
    { id: 'systemProperties', label: <Translate id="react.admin.systemProperties.header.label" defaultMessage="System properties" /> },
    { id: 'printers', label: <Translate id="react.admin.printers.header.label" defaultMessage="Printers" /> },
    { id: 'backgroundJobs', label: <Translate id="react.admin.backgroundJobs.header.label" defaultMessage="Background jobs" /> },
    { id: 'caches', label: <Translate id="react.admin.caches.header.label" defaultMessage="Caches" /> },
  ];

  return (
    <PageWrapper>
      <div className="admin-page box">
        <ul className="admin-tabs">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                className={`button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
          <li>
            <a className="button" href={ADMIN_URL.showDatabaseStatus()}>
              <Translate id="react.admin.database.status.label" defaultMessage="Database Status" />
            </a>
          </li>
          <li>
            <a className="button" href={ADMIN_URL.showDatabaseProcessList()}>
              <Translate id="react.admin.database.processList.label" defaultMessage="Database Process List" />
            </a>
          </li>
        </ul>
        {activeTab === 'general' && (
          <table>
            <tbody>
              <tr className="prop">
                <td className="name">
                  <Translate id="react.admin.application.environment.label" defaultMessage="Environment" />
                </td>
                <td className="value">{settings?.environment}</td>
              </tr>
              <tr className="prop">
                <td className="name">
                  <Translate id="react.admin.application.version.label" defaultMessage="Application version" />
                </td>
                <td className="value">
                  {settings?.appVersion}
                  {' '}
                  {settings?.showUpgradeLink && (
                    <a href={ADMIN_URL.showUpgrade()}>
                      <Translate id="react.admin.application.upgrade.label" defaultMessage="Upgrade" />
                    </a>
                  )}
                </td>
              </tr>
              <tr className="prop">
                <td className="name">
                  <Translate id="react.admin.application.buildNumber.label" defaultMessage="Build Number" />
                </td>
                <td className="value">{settings?.buildNumber}</td>
              </tr>
              <tr className="prop">
                <td className="name">
                  <Translate id="react.admin.application.buildDate.label" defaultMessage="Build Date" />
                </td>
                <td className="value">
                  {settings?.buildDate
                    || <Translate id="react.admin.application.realTimeBuild.label" defaultMessage="real-time" />}
                </td>
              </tr>
              <tr className="prop">
                <td className="name">
                  <Translate id="react.admin.application.branchName.label" defaultMessage="Branch name" />
                </td>
                <td className="value">{settings?.branchName}</td>
              </tr>
              <tr className="prop">
                <td className="name">
                  <Translate id="react.admin.application.grailsVersion.label" defaultMessage="Grails version" />
                </td>
                <td className="value">{settings?.grailsVersion}</td>
              </tr>
              <tr className="prop">
                <td className="name">
                  <Translate id="react.admin.date.label" defaultMessage="Date" />
                </td>
                <td className="value">{settings?.currentDate}</td>
              </tr>
              <tr className="prop">
                <td className="name">
                  <Translate id="react.admin.locale.label" defaultMessage="Locale" />
                </td>
                <td className="value">
                  <ul>
                    {settings?.supportedLocales?.map((locale) => (
                      <li key={locale.code}>
                        {locale.current
                          ? locale.displayName
                          : (
                            <a href={`${CONTEXT_PATH}/user/updateAuthUserLocale?locale=${locale.code}&returnUrl=${returnUrl}`}>
                              {locale.displayName}
                              {' ('}
                              {locale.displayLanguageInUserLocale}
                              )
                            </a>
                          )}
                      </li>
                    ))}
                  </ul>
                  {settings?.showCustomizeButton && (
                    <a
                      className="button"
                      href={`${CONTEXT_PATH}/user/updateAuthUserLocale?locale=debug&returnUrl=${returnUrl}`}
                    >
                      <Translate id="react.admin.customize.label" defaultMessage="Customize" />
                    </a>
                  )}
                </td>
              </tr>
              <tr className="prop">
                <td className="name">
                  <Translate id="react.admin.application.defaultCharset.label" defaultMessage="Default charset" />
                </td>
                <td>{settings?.defaultCharset}</td>
              </tr>
            </tbody>
          </table>
        )}
        {activeTab === 'email' && (
          <table>
            <tbody>
              {settings?.mailSettings?.map((property) => (
                <tr className="prop" key={property.key}>
                  <td className="name">{property.key}</td>
                  <td>{property.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {activeTab === 'externalConfig' && (
          <table>
            <tbody>
              <tr className="prop">
                <td className="name">
                  <Translate id="react.admin.externalConfigFile.label" defaultMessage="External configuration file" />
                </td>
                <td>{settings?.externalConfigFile}</td>
              </tr>
              {settings?.configProperties?.map((property) => (
                <tr className="prop" key={property.key}>
                  <td className="name">{property.key}</td>
                  <td className="value">{property.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {activeTab === 'systemProperties' && (
          <table>
            <tbody>
              {settings?.systemProperties?.map((property) => (
                <tr className="prop" key={property.key}>
                  <td className="name">{property.key}</td>
                  <td className="value">{property.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {activeTab === 'printers' && (
          <div>
            <h2>
              <Translate id="react.admin.printers.label" defaultMessage="Printers" />
            </h2>
            <table>
              <thead>
                <tr>
                  <th aria-label="Name"><Translate id="react.admin.name.label" defaultMessage="Name" /></th>
                  <th aria-label="Attributes"><Translate id="react.admin.printer.attributes.label" defaultMessage="Attributes" /></th>
                  <th aria-label="Doc Flavors"><Translate id="react.admin.printer.supportedDocFlavors.label" defaultMessage="Doc Flavors" /></th>
                  <th aria-label="Attribute Categories"><Translate id="react.admin.printer.supportedAttributeCategories.label" defaultMessage="Attribute Categories" /></th>
                </tr>
              </thead>
              <tbody>
                {settings?.printers?.map((printer) => (
                  <tr className="prop" key={printer.name}>
                    <td>{printer.name}</td>
                    <td>
                      <table>
                        <tbody>
                          {printer.attributes.map((attribute) => (
                            <tr key={attribute.name}>
                              <td>{attribute.name}</td>
                              <td>{attribute.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                    <td>
                      <table>
                        <tbody>
                          {printer.supportedDocFlavors.map((mimeType, index) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <tr key={`${mimeType}-${index}`}>
                              <td>{mimeType}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                    <td>
                      <table>
                        <tbody>
                          {printer.attributeCategories.map((category) => (
                            <tr key={category.name}>
                              <td>{category.name}</td>
                              <td>{category.defaultValue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'backgroundJobs' && (
          <div>
            <h2>
              {settings?.schedulerName}
              {' '}
              {settings?.schedulerInstanceId}
            </h2>
            <table>
              <tbody>
                <tr className="prop">
                  <td className="name">
                    <Translate id="react.admin.jobs.scheduler.metadata.label" defaultMessage="Scheduler Metadata" />
                  </td>
                  <td className="value">
                    <pre>{settings?.schedulerMetaData}</pre>
                  </td>
                </tr>
                <tr className="prop">
                  <td className="name">
                    <Translate
                      id="react.admin.calculateHistoricalQuantityJob.status.label"
                      defaultMessage="Calculate Historical Quantity Job Status"
                    />
                  </td>
                  <td className="value">
                    <span id="jobStatus">{jobStatus}</span>
                    <button type="button" className="button" onClick={showJobStatus}>
                      <Translate id="react.admin.showStatus.label" defaultMessage="Show Status" />
                    </button>
                    <button type="button" className="button" onClick={enableJob}>
                      <Translate id="react.admin.enable.label" defaultMessage="Enable" />
                    </button>
                    <button type="button" className="button" onClick={disableJob}>
                      <Translate id="react.admin.disable.label" defaultMessage="Disable" />
                    </button>
                  </td>
                </tr>
                <tr className="prop">
                  <td className="name">
                    <Translate id="react.admin.jobs.sendStockAlertsJob.label" defaultMessage="Send Stock Alerts Job" />
                  </td>
                  <td className="value">
                    <button type="button" className="button" onClick={triggerStockAlerts}>
                      <Translate id="react.admin.trigger.label" defaultMessage="Trigger" />
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2">
                    <a className="button" href={`${CONTEXT_PATH}/quartz/list`}>
                      <Translate id="react.admin.jobs.backgroundJobs.label" defaultMessage="Background Jobs" />
                    </a>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {activeTab === 'caches' && (
          <table>
            <thead>
              <tr>
                {CACHE_COLUMNS.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settings?.caches?.map((cache) => (
                <tr key={cache.name}>
                  {CACHE_COLUMNS.map((column) => (
                    <td key={column}>{cache[column]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageWrapper>
  );
};

export default ShowSettingsPage;
