import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';

import moment from 'moment';
import PropTypes from 'prop-types';
import { stringifyUrl } from 'query-string';

import { SUPPLIER_PRICE_HISTORY, SUPPLIER_PRICE_HISTORY_DOWNLOAD } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import ProductSelect from 'components/product-select/ProductSelect';
import { ORDER_URL } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const SupplierPriceHistory = ({ supplierId }) => {
  const [product, setProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParams, setFilterParams] = useState({ q: '', productId: '' });
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPriceHistory = useCallback(() => {
    setLoading(true);
    apiClient.get(SUPPLIER_PRICE_HISTORY, {
      params: {
        supplierId,
        q: filterParams.q,
        productId: filterParams.productId,
      },
    })
      .then((response) => {
        setPriceHistory(response.data.aaData || []);
      })
      .finally(() => setLoading(false));
  }, [supplierId, filterParams]);

  useEffect(() => {
    fetchPriceHistory();
  }, [fetchPriceHistory]);

  const onSearch = (event) => {
    event.preventDefault();
    setFilterParams({ q: searchTerm, productId: product?.id || '' });
  };

  const onDownload = () => {
    window.location.href = stringifyUrl({
      url: SUPPLIER_PRICE_HISTORY_DOWNLOAD,
      query: {
        supplierId,
        q: filterParams.q,
        productId: filterParams.productId,
        format: 'text/csv',
      },
    });
  };

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.supplierShow.priceHistory.orderNumber.label" defaultMessage="Order Number" />,
      accessor: 'orderNumber',
      Cell: (row) => (
        <TableCell
          {...row}
          link={ORDER_URL.show(row.original.orderId)}
        />
      ),
    },
    {
      Header: <Translate id="react.supplierShow.priceHistory.dateCreated.label" defaultMessage="Date Created" />,
      accessor: 'dateCreated',
      Cell: (row) => (
        <TableCell
          {...row}
          value={row.value ? moment(row.value).format('DD/MMM/YYYY') : ''}
        />
      ),
    },
    {
      Header: <Translate id="react.supplierShow.priceHistory.description.label" defaultMessage="Description" />,
      accessor: 'description',
    },
    {
      Header: <Translate id="react.supplierShow.priceHistory.productCode.label" defaultMessage="Product Code" />,
      accessor: 'productCode',
    },
    {
      Header: <Translate id="react.supplierShow.priceHistory.product.label" defaultMessage="Product" />,
      accessor: 'productName',
    },
    {
      Header: <Translate id="react.supplierShow.priceHistory.sourceCode.label" defaultMessage="Source Code" />,
      accessor: 'sourceCode',
    },
    {
      Header: <Translate id="react.supplierShow.priceHistory.supplierCode.label" defaultMessage="Supplier Code" />,
      accessor: 'supplierCode',
    },
    {
      Header: <Translate id="react.supplierShow.priceHistory.manufacturer.label" defaultMessage="Manufacturer" />,
      accessor: 'manufacturerName',
    },
    {
      Header: <Translate id="react.supplierShow.priceHistory.manufacturerCode.label" defaultMessage="Manufacturer Code" />,
      accessor: 'manufacturerCode',
    },
    {
      Header: <Translate id="react.supplierShow.priceHistory.unitPrice.label" defaultMessage="Unit Price" />,
      accessor: 'unitPrice',
      Cell: (row) => (
        <TableCell
          {...row}
          value={row.value && row.original.quantityPerUom
            ? (row.value / row.original.quantityPerUom).toLocaleString()
            : ''}
        />
      ),
    },
  ], []);

  return (
    <div className="p-2">
      <form className="d-flex align-items-end mb-2" onSubmit={onSearch}>
        <div className="d-flex flex-column mr-2" style={{ minWidth: '300px' }}>
          <label htmlFor="price-history-product">
            <Translate id="react.supplierShow.priceHistory.product.label" defaultMessage="Product" />
          </label>
          <ProductSelect
            id="price-history-product"
            value={product}
            onChange={(value) => setProduct(value)}
          />
        </div>
        <div className="d-flex flex-column mr-2" style={{ minWidth: '250px' }}>
          <label htmlFor="price-history-search">
            <Translate id="react.supplierShow.priceHistory.search.label" defaultMessage="Search" />
          </label>
          <input
            id="price-history-search"
            type="text"
            className="form-control"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          label="react.supplierShow.priceHistory.searchButton.label"
          defaultLabel="Search"
        />
        <Button
          type="button"
          variant="secondary"
          label="react.supplierShow.priceHistory.downloadButton.label"
          defaultLabel="Download"
          onClick={onDownload}
        />
      </form>
      <DataTable
        columns={columns}
        data={priceHistory}
        loading={loading}
        defaultPageSize={10}
        totalData={priceHistory.length}
        noDataText="No records found"
      />
    </div>
  );
};

export default SupplierPriceHistory;

SupplierPriceHistory.propTypes = {
  supplierId: PropTypes.string.isRequired,
};
