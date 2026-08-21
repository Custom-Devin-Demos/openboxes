import React, { useEffect, useState } from 'react';

import mobileApi from 'api/services/MobileApi';
import notification from 'components/Layout/notifications/notification';
import MobileMenuBar from 'components/mobile/MobileMenuBar';
import MobilePagination from 'components/mobile/MobilePagination';
import { MOBILE_URL, STOCK_MOVEMENT_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const PAGE_SIZE = 10;

const MobileOutboundList = () => {
  useTranslation('mobile', 'stockMovement', 'default');
  const spinner = useSpinner();
  const [offset, setOffset] = useState(0);
  const [stockMovements, setStockMovements] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    spinner.show();
    mobileApi.getOutboundItems({ max: PAGE_SIZE, offset })
      .then((response) => {
        setStockMovements(response.data.data);
        setTotalCount(response.data.totalCount);
      })
      .catch(() => {
        notification(NotificationType.ERROR)({
          message: 'Unable to fetch outbound stock movements',
        });
      })
      .finally(() => spinner.hide());
  }, [offset]);

  return (
    <PageWrapper>
      <MobileMenuBar />
      <div className="row g-0">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>
                <Translate id="react.mobile.stockMovement.status.label" defaultMessage="Status" />
              </th>
              <th>
                <Translate id="react.mobile.stockMovement.identifier.label" defaultMessage="Identifier" />
              </th>
              <th>
                <Translate id="react.mobile.stockMovement.destination.label" defaultMessage="Destination" />
              </th>
              <th>
                <Translate id="react.mobile.stockMovement.requestedDeliveryDate.label" defaultMessage="Requested Delivery Date" />
              </th>
              <th>
                <Translate id="react.default.actions.label" defaultMessage="Actions" />
              </th>
            </tr>
          </thead>
          <tbody>
            {stockMovements.map((stockMovement) => (
              <tr key={stockMovement.id}>
                <td>
                  <a
                    href={STOCK_MOVEMENT_URL.show(stockMovement.id)}
                    className="text-decoration-none text-reset"
                  >
                    {stockMovement.status}
                  </a>
                </td>
                <td>
                  <a
                    href={MOBILE_URL.stockMovementDetails(stockMovement.id)}
                    className="text-decoration-none text-reset"
                  >
                    {stockMovement.identifier}
                  </a>
                </td>
                <td>
                  {stockMovement.destination?.name}
                  {' '}
                  {stockMovement.destination?.locationNumber}
                </td>
                <td>
                  {stockMovement.requestedDeliveryDate}
                </td>
                <td>
                  <a href={STOCK_MOVEMENT_URL.show(stockMovement.id)} className="btn btn-link">
                    <button type="button" className="btn btn-primary">
                      <Translate id="react.mobile.button.view.label" defaultMessage="View" />
                      {' '}
                      <i className="fa fa-chevron-right" />
                    </button>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <MobilePagination
          offset={offset}
          max={PAGE_SIZE}
          totalCount={totalCount}
          onPageChange={setOffset}
        />
      </div>
    </PageWrapper>
  );
};

export default MobileOutboundList;
