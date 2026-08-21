/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useEffect, useState } from 'react';

import { ADMIN_UPGRADE, ADMIN_UPGRADE_DEPLOY, ADMIN_UPGRADE_DOWNLOAD } from 'api/urls';
import notification from 'components/Layout/notifications/notification';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const UpgradePage = () => {
  useTranslation('admin', 'default');

  const [upgrade, setUpgrade] = useState(null);
  const [remoteWebArchiveUrl, setRemoteWebArchiveUrl] = useState('');
  const [localWebArchivePath, setLocalWebArchivePath] = useState('');

  const fetchUpgrade = () => {
    apiClient.get(ADMIN_UPGRADE)
      .then((response) => {
        const { data } = response.data;
        setUpgrade(data);
        setRemoteWebArchiveUrl(data.remoteWebArchiveUrl || '');
        setLocalWebArchivePath(data.localWebArchivePath || '');
      });
  };

  useEffect(() => {
    fetchUpgrade();
  }, []);

  const onDownload = (event) => {
    event.preventDefault();
    apiClient.post(ADMIN_UPGRADE_DOWNLOAD, { remoteWebArchiveUrl })
      .then((response) => {
        notification(NotificationType.SUCCESS)({ message: response.data.data.message });
        fetchUpgrade();
      });
  };

  const onDeploy = (event) => {
    event.preventDefault();
    apiClient.post(ADMIN_UPGRADE_DEPLOY, { localWebArchivePath })
      .then((response) => {
        notification(NotificationType.SUCCESS)({ message: response.data.data.message });
        fetchUpgrade();
      });
  };

  const downloadDone = Boolean(upgrade?.downloadDone);

  return (
    <PageWrapper>
      <div className="admin-page box">
        <div className="dialog">
          <form>
            <fieldset>
              <table>
                <tbody>
                  <tr>
                    <td colSpan="2">
                      <h1>
                        <Translate id="react.admin.upgrade.step1.label" defaultMessage="Step 1. Download web archive" />
                      </h1>
                    </td>
                  </tr>
                  <tr className="prop">
                    <td className="name">
                      <label htmlFor="remoteWebArchiveUrl">
                        <Translate id="react.admin.upgrade.remoteWebArchiveUrl.label" defaultMessage="Remote web archive URL" />
                      </label>
                    </td>
                    <td className="value">
                      <input
                        id="remoteWebArchiveUrl"
                        name="remoteWebArchiveUrl"
                        type="text"
                        size="80"
                        value={remoteWebArchiveUrl}
                        onChange={(e) => setRemoteWebArchiveUrl(e.target.value)}
                      />
                      <button type="submit" className="positive button" onClick={onDownload}>
                        <Translate id="react.admin.upgrade.download.label" defaultMessage="Download" />
                      </button>
                      <br />
                      <span className="fade">(e.g. http://ci.pih-emr.org/downloads/openboxes.war)</span>
                    </td>
                  </tr>
                  <tr className="prop">
                    <td className="name">
                      <label>
                        <Translate id="react.admin.upgrade.progress.label" defaultMessage="Progress" />
                      </label>
                    </td>
                    <td className="value">
                      <div>
                        <label>
                          <Translate id="react.admin.upgrade.downloadingFile.label" defaultMessage="Downloading file" />
                          {': '}
                        </label>
                        <b>{upgrade?.remoteWebArchiveUrl}</b>
                      </div>
                      <div>
                        <label>
                          <Translate id="react.admin.upgrade.remoteFileSize.label" defaultMessage="Remote file size" />
                          {': '}
                        </label>
                        <b>{upgrade?.remoteFileSize}</b>
                      </div>
                      <div>
                        <label>
                          <Translate id="react.admin.upgrade.localFileSize.label" defaultMessage="Local file size" />
                          {': '}
                        </label>
                        <b>{upgrade?.localFileSize}</b>
                      </div>
                      <div>
                        {upgrade?.downloadCancelled && (
                          <Translate id="react.admin.upgrade.downloadCancelled.label" defaultMessage="Download was canceled." />
                        )}
                        {!upgrade?.downloadCancelled && downloadDone && (
                          <Translate id="react.admin.upgrade.downloadCompleted.label" defaultMessage="Download has been completed!!!" />
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="2">
                      <h1>
                        <Translate id="react.admin.upgrade.step2.label" defaultMessage="Step 2. Deploy web archive" />
                      </h1>
                    </td>
                  </tr>
                  <tr className="prop">
                    <td className="name">
                      <label>
                        <Translate id="react.admin.upgrade.localWebArchive.label" defaultMessage="Local web archive" />
                      </label>
                    </td>
                    <td className="value">
                      {upgrade?.localWebArchive}
                      {' - '}
                      <b>
                        {downloadDone
                          ? <Translate id="react.admin.upgrade.ready.label" defaultMessage="Ready" />
                          : <Translate id="react.admin.upgrade.notReady.label" defaultMessage="Not ready" />}
                      </b>
                    </td>
                  </tr>
                  <tr className="prop">
                    <td className="name">
                      <label htmlFor="localWebArchivePath">
                        <Translate id="react.admin.upgrade.localWebArchivePath.label" defaultMessage="Local web archive path" />
                      </label>
                    </td>
                    <td className="value">
                      <input
                        id="localWebArchivePath"
                        name="localWebArchivePath"
                        type="text"
                        size="80"
                        value={localWebArchivePath}
                        onChange={(e) => setLocalWebArchivePath(e.target.value)}
                      />
                      {upgrade?.localWebArchive && (
                        downloadDone ? (
                          <button type="submit" className="positive button" onClick={onDeploy}>
                            <Translate id="react.admin.upgrade.deploy.label" defaultMessage="Deploy" />
                          </button>
                        ) : (
                          <span>
                            <button type="submit" className="button" disabled>
                              <Translate id="react.admin.upgrade.deploy.label" defaultMessage="Deploy" />
                            </button>
                            <Translate id="react.admin.upgrade.waitForDownload.label" defaultMessage="(Please wait for download to complete)" />
                          </span>
                        )
                      )}
                      <br />
                      <span className="fade">(e.g. file:///var/lib/tomcat6/webapps/openboxes.war)</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </fieldset>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
};

export default UpgradePage;
