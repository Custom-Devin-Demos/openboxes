/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import { JOB_BY_ID, JOB_SCHEDULE, JOB_TRIGGER_BY_ID } from 'api/urls';
import notification from 'components/Layout/notifications/notification';
import { ADMIN_URL, QUARTZ_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const JobDetailsPage = ({ match }) => {
  useTranslation('admin', 'default');

  const { jobId } = match.params;
  const [job, setJob] = useState(null);
  const [triggerId, setTriggerId] = useState('');
  const [cronExpression, setCronExpression] = useState('');

  const fetchJob = () => {
    apiClient.get(JOB_BY_ID(jobId))
      .then((response) => {
        setJob(response.data.data);
        setTriggerId(response.data.data.name || '');
      });
  };

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const onDeleteTrigger = (trigger) => {
    apiClient.delete(JOB_TRIGGER_BY_ID(trigger.name))
      .then((response) => {
        if (response.data.data.message) {
          notification(NotificationType.ERROR)({ message: response.data.data.message });
        }
        fetchJob();
      });
  };

  const onScheduleJob = (event) => {
    event.preventDefault();
    apiClient.post(JOB_SCHEDULE(triggerId), { cronExpression })
      .then((response) => {
        if (response.data.data.message) {
          notification(NotificationType.SUCCESS)({ message: response.data.data.message });
        }
        fetchJob();
      });
  };

  return (
    <PageWrapper>
      <div className="admin-page">
        <div className="buttonBar d-flex gap-8 m-2">
          <a className="button" href={`${ADMIN_URL.showSettings()}#tab-5`}>
            <Translate id="react.admin.backToSettings.label" defaultMessage="Back to Settings" />
          </a>
          <a className="button" href={QUARTZ_URL.list()}>
            <Translate id="react.admin.jobs.list.label" defaultMessage="List Jobs" />
          </a>
        </div>
        <div className="box dialog">
          <h2>{job?.key}</h2>
          <table>
            <tbody>
              {job?.properties?.map((property) => (
                <tr className="prop" key={property.key}>
                  <td className="name">{property.key}</td>
                  <td className="value">{property.value}</td>
                </tr>
              ))}
              <tr className="prop">
                <td className="name">
                  <Translate id="react.admin.jobs.triggers.label" defaultMessage="Triggers" />
                </td>
                <td className="value">
                  <table>
                    <thead>
                      <tr>
                        <th><Translate id="react.admin.jobs.trigger.id.label" defaultMessage="ID" /></th>
                        <th><Translate id="react.admin.jobs.trigger.summary.label" defaultMessage="Summary" /></th>
                        <th><Translate id="react.admin.jobs.trigger.previousFireTime.label" defaultMessage="Previous fire time" /></th>
                        <th><Translate id="react.admin.jobs.trigger.nextFireTime.label" defaultMessage="Next fire time" /></th>
                        <th><Translate id="react.default.actions.label" defaultMessage="Actions" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {job?.triggers?.map((trigger) => (
                        <tr key={trigger.id}>
                          <td>{trigger.id}</td>
                          <td>{trigger.summary}</td>
                          <td>{trigger.previousFireTime}</td>
                          <td>{trigger.nextFireTime}</td>
                          <td>
                            <button type="button" className="button" onClick={() => onDeleteTrigger(trigger)}>
                              <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {job && !job.triggers?.length && (
                        <tr>
                          <td colSpan="6">
                            <Translate id="react.admin.jobs.noTriggers.label" defaultMessage="There are no triggers for job" />
                            {' '}
                            {job.key}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="button-bar">
                    <form onSubmit={onScheduleJob}>
                      <input
                        name="id"
                        className="text"
                        size="40"
                        value={triggerId}
                        onChange={(e) => setTriggerId(e.target.value)}
                      />
                      <input
                        name="cronExpression"
                        className="text"
                        size="20"
                        placeholder="0 0 22 * * ?"
                        value={cronExpression}
                        onChange={(e) => setCronExpression(e.target.value)}
                      />
                      <button type="submit" className="button">
                        <Translate id="react.admin.jobs.addTrigger.label" defaultMessage="Add trigger" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};

export default withRouter(JobDetailsPage);

JobDetailsPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      jobId: PropTypes.string,
    }),
  }).isRequired,
};
