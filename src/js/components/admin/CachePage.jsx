import React, { useCallback, useEffect, useState } from 'react';

import { useHistory } from 'react-router-dom';

import { ADMIN_CACHE, ADMIN_EVICT_DOMAIN_CACHE, ADMIN_EVICT_QUERY_CACHE } from 'api/urls';
import notification from 'components/Layout/notifications/notification';
import { ADMIN_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const CachePage = () => {
  useTranslation('admin', 'default');

  const history = useHistory();
  const [cacheData, setCacheData] = useState(null);

  const fetchCache = useCallback(() => {
    apiClient.get(ADMIN_CACHE)
      .then((response) => setCacheData(response.data.data));
  }, []);

  useEffect(() => {
    fetchCache();
  }, [fetchCache]);

  const evictDomainCache = (name) => {
    apiClient.post(ADMIN_EVICT_DOMAIN_CACHE, null, { params: { name } })
      .then((response) => {
        notification(NotificationType.SUCCESS)({ message: response.data.data.message });
        history.push(ADMIN_URL.showSettings());
      });
  };

  const evictQueryCache = (name) => {
    apiClient.post(ADMIN_EVICT_QUERY_CACHE, null, { params: name ? { name } : {} })
      .then((response) => {
        notification(NotificationType.SUCCESS)({ message: response.data.data.message });
        history.push(ADMIN_URL.showSettings());
      });
  };

  return (
    <PageWrapper>
      <div className="admin-page box">
        <h2>
          <Translate id="react.admin.cacheSettings.header.label" defaultMessage="Cache settings" />
        </h2>
        <table>
          <tbody>
            <tr className="prop">
              <td className="name">
                <Translate id="react.admin.cacheEnabled.label" defaultMessage="Cached enabled?" />
              </td>
              <td>{cacheData?.hibernateConfig}</td>
            </tr>
            <tr className="prop">
              <td className="name">
                <Translate id="react.admin.cacheStatistics.label" defaultMessage="Cache statistics" />
              </td>
              <td>{cacheData?.cacheStatistics}</td>
            </tr>
            <tr className="prop">
              <td className="name">
                <Translate id="react.admin.secondLevelCacheStatistics.label" defaultMessage="Second-level cache statistics" />
              </td>
              <td>
                <table>
                  <thead>
                    <tr>
                      <th aria-label="Region name"><Translate id="react.admin.cache.regionName.label" defaultMessage="Region name" /></th>
                      <th aria-label="Hit count"><Translate id="react.admin.cache.hitCount.label" defaultMessage="Hit count" /></th>
                      <th aria-label="Miss count"><Translate id="react.admin.cache.missCount.label" defaultMessage="Miss count" /></th>
                      <th aria-label="Put count"><Translate id="react.admin.cache.putCount.label" defaultMessage="Put count" /></th>
                      <th aria-label="Element Count In Memory"><Translate id="react.admin.cache.elementCountInMemory.label" defaultMessage="Element Count In Memory" /></th>
                      <th aria-label="Element Count On Disk"><Translate id="react.admin.cache.elementCountOnDisk.label" defaultMessage="Element Count On Disk" /></th>
                      <th aria-label="Size In Memory"><Translate id="react.admin.cache.sizeInMemory.label" defaultMessage="Size In Memory" /></th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {cacheData?.secondLevelCacheStatistics?.map((statistics) => (
                      <tr key={statistics.regionName}>
                        <td>{statistics.regionName}</td>
                        <td className="center">{statistics.hitCount}</td>
                        <td className="center">{statistics.missCount}</td>
                        <td className="center">{statistics.putCount}</td>
                        <td className="center">{statistics.elementCountInMemory}</td>
                        <td className="center">{statistics.elementCountOnDisk}</td>
                        <td className="center">{statistics.sizeInMemory}</td>
                        <td>
                          <button
                            type="button"
                            className="button"
                            onClick={() => evictDomainCache(statistics.regionName)}
                          >
                            <Translate id="react.admin.evict.label" defaultMessage="Evict" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
            <tr className="prop">
              <td className="name">
                <Translate id="react.admin.queryCacheStatistics.label" defaultMessage="Query cache statistics" />
              </td>
              <td>
                <button
                  type="button"
                  className="button"
                  onClick={() => evictQueryCache()}
                >
                  <Translate id="react.admin.evictAll.label" defaultMessage="Evict all" />
                </button>
                <table>
                  <thead>
                    <tr>
                      <th aria-label="Region"><Translate id="react.admin.cache.queryName.label" defaultMessage="Region" /></th>
                      <th aria-label="Hits"><Translate id="react.admin.cache.hits.label" defaultMessage="Hits" /></th>
                      <th aria-label="Misses"><Translate id="react.admin.cache.misses.label" defaultMessage="Misses" /></th>
                      <th aria-label="Puts"><Translate id="react.admin.cache.puts.label" defaultMessage="Puts" /></th>
                      <th aria-label="Count"><Translate id="react.admin.cache.executionCount.label" defaultMessage="Count" /></th>
                      <th aria-label="Min Time"><Translate id="react.admin.cache.executionMinTime.label" defaultMessage="Min Time" /></th>
                      <th aria-label="Max Time"><Translate id="react.admin.cache.executionMaxTime.label" defaultMessage="Max Time" /></th>
                      <th aria-label="Avg Time"><Translate id="react.admin.cache.executionAvgTime.label" defaultMessage="Avg Time" /></th>
                      <th aria-label="Row Count"><Translate id="react.admin.cache.executionRowCount.label" defaultMessage="Row Count" /></th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {cacheData?.queryCacheStatistics?.map((statistics) => (
                      <tr key={statistics.queryName}>
                        <td>{statistics.queryName}</td>
                        <td className="center">{statistics.cacheHitCount}</td>
                        <td className="center">{statistics.cacheMissCount}</td>
                        <td className="center">{statistics.cachePutCount}</td>
                        <td className="center">{statistics.executionCount}</td>
                        <td className="center">{statistics.executionMinTime}</td>
                        <td className="center">{statistics.executionMaxTime}</td>
                        <td className="center">{statistics.executionAvgTime}</td>
                        <td className="center">{statistics.executionRowCount}</td>
                        <td>
                          <button
                            type="button"
                            className="button"
                            onClick={() => evictQueryCache(statistics.queryName)}
                          >
                            <Translate id="react.admin.evict.label" defaultMessage="Evict" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
            <tr className="prop">
              <td className="name">
                <Translate id="react.admin.entityCacheStatistics.label" defaultMessage="Entity cache statistics" />
              </td>
              <td>
                <table>
                  <thead>
                    <tr>
                      <th aria-label="Entity"><Translate id="react.admin.cache.entityName.label" defaultMessage="Entity" /></th>
                      <th aria-label="Loads"><Translate id="react.admin.cache.loadCount.label" defaultMessage="Loads" /></th>
                      <th aria-label="Deletes"><Translate id="react.admin.cache.deleteCount.label" defaultMessage="Deletes" /></th>
                      <th aria-label="Fetches"><Translate id="react.admin.cache.fetchCount.label" defaultMessage="Fetches" /></th>
                      <th aria-label="Inserts"><Translate id="react.admin.cache.insertCount.label" defaultMessage="Inserts" /></th>
                      <th aria-label="Updates"><Translate id="react.admin.cache.updateCount.label" defaultMessage="Updates" /></th>
                      <th aria-label="Optimistic failures"><Translate id="react.admin.cache.optimisticFailureCount.label" defaultMessage="Optimistic failures" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cacheData?.entityCacheStatistics?.map((statistics) => (
                      <tr key={statistics.entityName}>
                        <td>{statistics.entityName}</td>
                        <td className="center">{statistics.loadCount}</td>
                        <td className="center">{statistics.deleteCount}</td>
                        <td className="center">{statistics.fetchCount}</td>
                        <td className="center">{statistics.insertCount}</td>
                        <td className="center">{statistics.optimisticFailureCount}</td>
                        <td className="center">{statistics.updateCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};

export default CachePage;
