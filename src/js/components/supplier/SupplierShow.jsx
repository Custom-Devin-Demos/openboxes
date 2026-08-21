import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { SUPPLIER_DETAILS } from 'api/urls';
import Tabs from 'components/listPagesUtils/Tabs';
import SupplierDocuments from 'components/supplier/SupplierDocuments';
import SupplierPriceHistory from 'components/supplier/SupplierPriceHistory';
import { LOCATION_URL } from 'consts/applicationUrls';
import useQueryParams from 'hooks/useQueryParams';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const TAB = {
  PRICE_HISTORY: 'priceHistory',
  DOCUMENTS: 'documents',
};

const SupplierShow = ({ match, history }) => {
  useTranslation('supplierShow', 'default');
  const supplierId = match.params.id;
  const queryParams = useQueryParams();
  const activeTab = queryParams?.tab === TAB.DOCUMENTS ? TAB.DOCUMENTS : TAB.PRICE_HISTORY;

  const [supplier, setSupplier] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiClient.get(SUPPLIER_DETAILS(supplierId))
      .then((response) => {
        setSupplier(response.data.data);
        setLoaded(true);
      });
  }, [supplierId]);

  const switchTab = (tab) => {
    history.push({ search: `?tab=${tab}` });
  };

  const tabsConfig = {
    [TAB.PRICE_HISTORY]: {
      label: {
        id: 'react.supplierShow.priceHistory.label',
        defaultMessage: 'Price History',
      },
      onClick: switchTab,
    },
    [TAB.DOCUMENTS]: {
      label: {
        id: 'react.supplierShow.documents.label',
        defaultMessage: 'Documents',
      },
      onClick: switchTab,
    },
  };

  if (!loaded) {
    return (
      <PageWrapper>
        <Translate id="react.default.loading.label" defaultMessage="Loading..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <HeaderWrapper>
        <div className="d-flex flex-column w-100">
          <h3 className="mb-1">{supplier?.displayName}</h3>
          <div>
            {supplier?.locations?.map((location, index) => (
              <span key={location.id}>
                {index > 0 && ', '}
                <a href={LOCATION_URL.show(location.id)}>{location.name}</a>
              </span>
            ))}
          </div>
        </div>
      </HeaderWrapper>
      <Tabs config={tabsConfig} className="p-2" />
      {activeTab === TAB.PRICE_HISTORY
        ? <SupplierPriceHistory supplierId={supplierId} />
        : <SupplierDocuments documents={supplier?.documents} />}
    </PageWrapper>
  );
};

export default SupplierShow;

SupplierShow.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired,
};
