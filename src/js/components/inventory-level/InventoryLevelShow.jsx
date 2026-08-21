import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import InventoryLevelApi from 'api/services/InventoryLevelApi';
import notification from 'components/Layout/notifications/notification';
import { formatDateTime } from 'components/stock-card/utils';
import { CONTEXT_PATH, INVENTORY_LEVEL_URL, INVENTORY_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/inventory/inventoryLegacy.scss';

const InventoryLevelShow = () => {
  useTranslation('inventoryLevel', 'default');

  const { id } = useParams();
  const history = useHistory();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (id) {
      InventoryLevelApi.getDetails(id)
        .then((response) => setData(response.data))
        .catch(() => history.push(INVENTORY_LEVEL_URL.list()));
    }
  }, [id]);

  const onDelete = async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure?')) {
      return;
    }
    try {
      const response = await InventoryLevelApi.remove(id);
      notification(NotificationType.SUCCESS)({ message: response.data?.message });
      window.location.href = `${CONTEXT_PATH}/product/edit/${response.data?.productId}`;
    } catch (error) {
      const errorMessages = error?.response?.data?.errorMessages;
      notification(NotificationType.ERROR_OUTLINED)({
        message: errorMessages?.join(', ') || 'Could not delete inventory level',
      });
    }
  };

  const inventoryLevel = data?.inventoryLevel;

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="box p-3">
        <h2>
          <Translate id="react.inventoryLevel.show.label" defaultMessage="Show Inventory Level" />
        </h2>
        <table className="table table-sm w-auto">
          <tbody>
            <tr>
              <td className="font-weight-bold"><Translate id="react.inventoryLevel.id.label" defaultMessage="Id" /></td>
              <td>{inventoryLevel?.id}</td>
            </tr>
            <tr>
              <td className="font-weight-bold"><Translate id="react.inventoryLevel.product.label" defaultMessage="Product" /></td>
              <td>
                <a href={`${CONTEXT_PATH}/product/show/${inventoryLevel?.product?.id}`}>
                  {inventoryLevel?.product?.name}
                </a>
              </td>
            </tr>
            <tr>
              <td className="font-weight-bold"><Translate id="react.inventoryLevel.supported.label" defaultMessage="Supported" /></td>
              <td>{inventoryLevel ? String(inventoryLevel.status === 'SUPPORTED') : ''}</td>
            </tr>
            <tr>
              <td className="font-weight-bold"><Translate id="react.inventoryLevel.minQuantity.label" defaultMessage="Min Quantity" /></td>
              <td>{inventoryLevel?.minQuantity}</td>
            </tr>
            <tr>
              <td className="font-weight-bold"><Translate id="react.inventoryLevel.reorderQuantity.label" defaultMessage="Reorder Quantity" /></td>
              <td>{inventoryLevel?.reorderQuantity}</td>
            </tr>
            <tr>
              <td className="font-weight-bold"><Translate id="react.inventoryLevel.dateCreated.label" defaultMessage="Date Created" /></td>
              <td>{inventoryLevel?.dateCreated && formatDateTime(inventoryLevel.dateCreated)}</td>
            </tr>
            <tr>
              <td className="font-weight-bold"><Translate id="react.inventoryLevel.inventory.label" defaultMessage="Inventory" /></td>
              <td>
                <a href={`${INVENTORY_URL.base}/show/${inventoryLevel?.inventory?.id}`}>
                  {inventoryLevel?.inventory?.name}
                </a>
              </td>
            </tr>
            <tr>
              <td className="font-weight-bold"><Translate id="react.inventoryLevel.lastUpdated.label" defaultMessage="Last Updated" /></td>
              <td>{inventoryLevel?.lastUpdated && formatDateTime(inventoryLevel.lastUpdated)}</td>
            </tr>
          </tbody>
        </table>
        <div>
          <a className="btn btn-primary btn-sm mr-2" href={INVENTORY_LEVEL_URL.edit(id)}>
            <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
          </a>
          <button type="button" className="btn btn-danger btn-sm" onClick={onDelete}>
            <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default InventoryLevelShow;
