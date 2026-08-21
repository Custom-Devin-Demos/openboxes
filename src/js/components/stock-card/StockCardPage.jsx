import React, { useEffect, useState } from 'react';

import queryString from 'query-string';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import StockCardApi from 'api/services/StockCardApi';
import StockCardHeader from 'components/stock-card/StockCardHeader';
import AllLocationsTab from 'components/stock-card/tabs/AllLocationsTab';
import AssociationsTab from 'components/stock-card/tabs/AssociationsTab';
import CurrentStockTab from 'components/stock-card/tabs/CurrentStockTab';
import DemandTab from 'components/stock-card/tabs/DemandTab';
import DocumentsTab from 'components/stock-card/tabs/DocumentsTab';
import PendingInboundTab from 'components/stock-card/tabs/PendingInboundTab';
import PendingOutboundTab from 'components/stock-card/tabs/PendingOutboundTab';
import SnapshotTab from 'components/stock-card/tabs/SnapshotTab';
import StockHistoryTab from 'components/stock-card/tabs/StockHistoryTab';
import SuppliersTab from 'components/stock-card/tabs/SuppliersTab';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/stock-card/stockCard.scss';

const TABS = [
  { key: 'inStock', labelCode: 'react.stockCard.tab.inStock.label', defaultLabel: 'In stock' },
  { key: 'stockHistory', labelCode: 'react.stockCard.tab.stockHistory.label', defaultLabel: 'Stock History' },
  { key: 'allLocations', labelCode: 'react.stockCard.tab.allLocations.label', defaultLabel: 'All Locations' },
  { key: 'suppliers', labelCode: 'react.stockCard.tab.productSources.label', defaultLabel: 'Product Sources' },
  { key: 'associations', labelCode: 'react.stockCard.tab.productAssociations.label', defaultLabel: 'Product Associations' },
  { key: 'pendingInbound', labelCode: 'react.stockCard.tab.pendingInbound.label', defaultLabel: 'Pending Inbound' },
  { key: 'pendingOutbound', labelCode: 'react.stockCard.tab.pendingOutbound.label', defaultLabel: 'Pending Outbound' },
  { key: 'demand', labelCode: 'react.stockCard.tab.demand.label', defaultLabel: 'Demand' },
  { key: 'snapshot', labelCode: 'react.stockCard.tab.snapshot.label', defaultLabel: 'Snapshot' },
  { key: 'documents', labelCode: 'react.stockCard.tab.documents.label', defaultLabel: 'Documents' },
];

const TAB_COMPONENTS = {
  inStock: CurrentStockTab,
  stockHistory: StockHistoryTab,
  allLocations: AllLocationsTab,
  suppliers: SuppliersTab,
  associations: AssociationsTab,
  pendingInbound: PendingInboundTab,
  pendingOutbound: PendingOutboundTab,
  demand: DemandTab,
  snapshot: SnapshotTab,
  documents: DocumentsTab,
};

const StockCardPage = () => {
  useTranslation('stockCard', 'default');

  const params = useParams();
  const location = useLocation();
  const history = useHistory();
  const parsedQuery = queryString.parse(location.search);
  const productId = params.id || parsedQuery['product.id'];
  const activeTab = parsedQuery.tab || 'inStock';

  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  const fetchDetails = () => {
    StockCardApi.getDetails(productId)
      .then((response) => setDetails(response.data))
      .catch((err) => setError(err?.response?.data?.errorMessage || err.message));
  };

  useEffect(() => {
    if (productId) {
      fetchDetails();
    }
  }, [productId]);

  const setTab = (tab) => {
    history.replace({
      search: queryString.stringify({ ...parsedQuery, tab }),
    });
  };

  if (error) {
    return (
      <PageWrapper>
        <div className="alert alert-danger m-3">{error}</div>
      </PageWrapper>
    );
  }

  const ActiveTabComponent = TAB_COMPONENTS[activeTab] || CurrentStockTab;

  return (
    <PageWrapper>
      <StockCardHeader details={details} productId={productId} onRefresh={fetchDetails} />
      <div className="stock-card-tabs">
        <ul className="nav nav-tabs">
          {TABS.map((tab) => (
            <li className="nav-item" key={tab.key}>
              <button
                type="button"
                className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setTab(tab.key)}
              >
                <Translate id={tab.labelCode} defaultMessage={tab.defaultLabel} />
              </button>
            </li>
          ))}
        </ul>
        <div className="stock-card-tab-content">
          <ActiveTabComponent
            productId={productId}
            details={details}
            onRefresh={fetchDetails}
          />
        </div>
      </div>
    </PageWrapper>
  );
};

export default StockCardPage;

StockCardPage.propTypes = {};
