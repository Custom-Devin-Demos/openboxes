import React, { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

import {
  QUARTZ_JOB_PAUSE,
  QUARTZ_JOB_RESUME,
  QUARTZ_JOB_RUN_NOW,
  QUARTZ_JOB_START,
  QUARTZ_JOB_STOP,
  QUARTZ_JOBS_LIST,
  QUARTZ_SCHEDULER_START,
  QUARTZ_SCHEDULER_STOP,
} from 'api/urls';
import notification from 'components/Layout/notifications/notification';
import { JOBS_URL, QUARTZ_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const jobTooltip = (job) => {
  const errorPart = job.error ? `Job threw exception: ${job.error}. ` : '';
  const durationPart = job.duration >= 0 && job.duration !== null && job.duration !== undefined
    ? `Job ran in: ${job.duration}ms`
    : '';
  return `${errorPart}${durationPart}`;
};

const QuartzJobsPage = () => {
  useTranslation('default');
  const [data, setData] = useState(null);

  const fetchJobs = () => {
    apiClient.get(QUARTZ_JOBS_LIST)
      .then((response) => setData(response.data.data));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const runAction = (url, params) => () => {
    apiClient.post(url, null, { params })
      .then((response) => {
        if (response.data.data.message && response.data.data.message !== 'null') {
          notification(NotificationType.ERROR)({ message: response.data.data.message });
        }
        fetchJobs();
      });
  };

  if (!data) {
    return <PageWrapper><div className="box m-3" /></PageWrapper>;
  }

  return (
    <PageWrapper>
      <div className="admin-page">
        <div className="box m-3">
          <h1 id="quartz-title">
            Quartz Jobs
            {data.schedulerInStandbyMode ? (
              <button type="button" className="button ml-2" title="Start scheduler" onClick={runAction(QUARTZ_SCHEDULER_START)}>
                Start scheduler
              </button>
            ) : (
              <button type="button" className="button ml-2" title="Pause scheduler" onClick={runAction(QUARTZ_SCHEDULER_STOP)}>
                Pause scheduler
              </button>
            )}
          </h1>
          <h3>{`Current Time: ${data.now}`}</h3>
          <table id="quartz-jobs">
            <thead>
              <tr>
                <th>Name</th>
                <th>Last Run</th>
                <th>Result</th>
                <th>Next Scheduled Run</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.map((job) => (
                <tr className="prop" key={`${job.name}-${job.trigger?.name || 'no-trigger'}`}>
                  <td>
                    <Link to={JOBS_URL.show(job.name)}>{job.name}</Link>
                  </td>
                  <td title={jobTooltip(job)}>{job.lastRun}</td>
                  <td>{jobTooltip(job)}</td>
                  {data.schedulerInStandbyMode || job.triggerStatus === 'PAUSED' ? (
                    <td>Paused</td>
                  ) : (
                    <td>{job.trigger?.nextFireTime}</td>
                  )}
                  <td>
                    {job.status !== 'running' && (
                      <div className="button-group">
                        {job.trigger ? (
                          <>
                            <button
                              type="button"
                              className="button mr-2"
                              title="Stop job from running again"
                              onClick={runAction(QUARTZ_JOB_STOP, {
                                jobName: job.name,
                                triggerName: job.trigger.name,
                                triggerGroup: job.trigger.group,
                              })}
                            >
                              Stop
                            </button>
                            {job.triggerStatus === 'PAUSED' && (
                              <button
                                type="button"
                                className="button mr-2"
                                title="Resume job schedule"
                                onClick={runAction(QUARTZ_JOB_RESUME, {
                                  jobName: job.name,
                                  jobGroup: job.group,
                                })}
                              >
                                Resume
                              </button>
                            )}
                            {job.triggerStatus !== 'PAUSED' && job.trigger.mayFireAgain && (
                              <button
                                type="button"
                                className="button mr-2"
                                title="Pause job schedule"
                                onClick={runAction(QUARTZ_JOB_PAUSE, {
                                  jobName: job.name,
                                  jobGroup: job.group,
                                })}
                              >
                                Pause
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            className="button mr-2"
                            title="Start job schedule"
                            onClick={runAction(QUARTZ_JOB_START, {
                              jobName: job.name,
                              jobGroup: job.group,
                            })}
                          >
                            Start
                          </button>
                        )}
                        <button
                          type="button"
                          className="button mr-2"
                          title="Run now"
                          onClick={runAction(QUARTZ_JOB_RUN_NOW, {
                            jobName: job.name,
                            jobGroup: job.group,
                          })}
                        >
                          Run now
                        </button>
                        {job.trigger?.isCronTrigger && (
                          <a
                            className="button"
                            title="Reschedule"
                            href={QUARTZ_URL.editCronTrigger(job.trigger.name, job.trigger.group)}
                          >
                            Reschedule
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};

export default QuartzJobsPage;
