import React from 'react';

import { MIGRATION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const MigrationIndexPage = () => {
  useTranslation('default');

  return (
    <PageWrapper>
      <div className="admin-page">
        <div className="box m-3">
          <h2>
            <Translate id="react.migration.index.label" defaultMessage="Migrations" />
          </h2>
          <ul>
            <li>
              <a href={MIGRATION_URL.dataQuality()}>
                <Translate id="react.migration.dataQuality.label" defaultMessage="Quality" />
              </a>
            </li>
            <li>
              <a href={MIGRATION_URL.dataMigration()}>
                <Translate id="react.migration.dataMigration.label" defaultMessage="Migration" />
              </a>
            </li>
            <li>
              <a href={MIGRATION_URL.dimensionTables()}>
                <Translate id="react.migration.dimensionTables.label" defaultMessage="Dimensions" />
              </a>
            </li>
            <li>
              <a href={MIGRATION_URL.factTables()}>
                <Translate id="react.migration.factTables.label" defaultMessage="Facts" />
              </a>
            </li>
            <li>
              <a href={MIGRATION_URL.materializedViews()}>
                <Translate id="react.migration.materializedViews.label" defaultMessage="Materialized Views" />
              </a>
            </li>
            <li>
              <a href={MIGRATION_URL.productAvailability()}>
                <Translate id="react.migration.productAvailability.label" defaultMessage="Product Availability" />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </PageWrapper>
  );
};

export default MigrationIndexPage;
