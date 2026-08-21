import React, { useCallback, useEffect, useState } from 'react';

import queryString from 'query-string';

import { INVENTORY_LIST_BIN_LOCATIONS } from 'api/urls';
import { INVENTORY_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import './inventoryLegacy.scss';

const ManageInventory = () => {
  useTranslation('inventory', 'default');

  const [data, setData] = useState(null);

  const fetchData = useCallback(() => {
    apiClient.get(INVENTORY_LIST_BIN_LOCATIONS)
      .then((response) => setData(response.data));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRowClick = (row) => {
    const search = queryString.stringify({
      productCode: row.productCode,
      binLocation: row.binLocation || '',
      lotNumber: row.lotNumber || '',
    });
    window.location.href = `${INVENTORY_URL.editBinLocation()}?${search}`;
  };

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="box p-3">
        <h2>
          <Translate id="react.inventory.manageInventory.label" defaultMessage="Manage Inventory" />
        </h2>
        <table className="table table-striped table-sm">
          <thead>
            <tr>
              <th>
                <Translate id="react.inventory.productCode.label" defaultMessage="Code" />
              </th>
              <th>
                <Translate id="react.inventory.product.label" defaultMessage="Product" />
              </th>
              <th>
                <Translate id="react.inventory.binLocation.label" defaultMessage="Bin location" />
              </th>
              <th>
                <Translate id="react.inventory.lotNumber.label" defaultMessage="Lot number" />
              </th>
              <th>
                <Translate id="react.inventory.expirationDate.label" defaultMessage="Expiration date" />
              </th>
              <th className="text-right">
                <Translate id="react.inventory.quantityOnHand.label" defaultMessage="Quantity on hand" />
              </th>
            </tr>
          </thead>
          <tbody>
            {data && !data.data?.length && (
              <tr>
                <td colSpan="6">
                  <Translate id="react.default.noResultsFound.label" defaultMessage="No results found" />
                </td>
              </tr>
            )}
            {data?.data?.map((row, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <tr key={index} className="cursor-pointer" onClick={() => onRowClick(row)}>
                <td>{row.productCode}</td>
                <td>{row.productName}</td>
                <td>{row.binLocation}</td>
                <td>{row.lotNumber}</td>
                <td>{row.expirationDate}</td>
                <td className="text-right">{row.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};

export default ManageInventory;
