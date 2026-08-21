import React, { useEffect, useState } from 'react';

import queryString from 'query-string';
import { Line } from 'react-chartjs-2';
import { useLocation, useParams } from 'react-router-dom';

import StockCardApi from 'api/services/StockCardApi';
import { INVENTORY_ITEM_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/stock-card/stockCard.scss';

// Same hard-coded sample series rendered by the legacy Flot graph
const GRAPH_DATA = [
  [1167692400000, 61.05],
  [1167778800000, 58.32],
  [1167865200000, 57.35],
];

const GraphPage = () => {
  useTranslation('stockCard', 'default');

  const params = useParams();
  const location = useLocation();
  const parsedQuery = queryString.parse(location.search);
  const productId = params.id || parsedQuery['product.id'];

  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (productId) {
      StockCardApi.getDetails(productId)
        .then((response) => setDetails(response.data));
    }
  }, [productId]);

  const chartData = {
    labels: GRAPH_DATA.map(([timestamp]) => new Date(timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'Consumption',
        data: GRAPH_DATA.map(([, value]) => value),
        fill: false,
        borderColor: '#4bc0c0',
        pointBackgroundColor: '#4bc0c0',
      },
    ],
  };

  const chartOptions = {
    legend: { display: false },
    scales: {
      yAxes: [{ ticks: { min: 0 } }],
    },
    maintainAspectRatio: false,
  };

  return (
    <PageWrapper>
      <div className="stock-card-page">
        <div className="d-flex justify-content-between align-items-center p-2">
          <h2>
            <Translate id="react.stockCard.showGraph.label" defaultMessage="Show graph" />
            {details?.product && ` › ${details.product.productCode} ${details.product.displayName || details.product.name}`}
          </h2>
          <a className="btn btn-outline-secondary" href={INVENTORY_ITEM_URL.showStockCard(productId)}>
            <Translate id="react.stockCard.backToStockCard.label" defaultMessage="Back to stock card" />
          </a>
        </div>
        <div className="text-center p-3">
          <div style={{ width: '400px', height: '300px', margin: '0 auto' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default GraphPage;
