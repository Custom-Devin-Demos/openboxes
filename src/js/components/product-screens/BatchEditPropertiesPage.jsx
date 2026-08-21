import React from 'react';

import { PRODUCT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const BatchEditPropertiesPage = () => {
  useTranslation('product', 'default');

  return (
    <PageWrapper>
      <div className="p-3">
        <h1>
          <Translate id="react.product.batchEdit.label" defaultMessage="Batch edit product" />
        </h1>
        <div className="box">
          <h2 className="h5">
            <Translate id="react.default.results.label" defaultMessage="Results" />
          </h2>
          <p>
            <Translate id="react.default.noResults.message" defaultMessage="No results" />
          </p>
          <a className="btn btn-primary" href={PRODUCT_URL.batchEdit()}>
            <Translate id="react.product.batchEdit.label" defaultMessage="Batch edit product" />
          </a>
        </div>
      </div>
    </PageWrapper>
  );
};

export default BatchEditPropertiesPage;
