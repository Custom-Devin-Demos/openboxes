import React, { useMemo, useState } from 'react';

import DataTable from 'components/DataTable';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import useProductMergeLogsTableData from 'hooks/list-pages/product/useProductMergeLogsTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ProductMergeLogsList = () => {
  useTranslation('productMergeLogs', 'default');
  const [primaryProductCode, setPrimaryProductCode] = useState('');
  const [obsoleteProductCode, setObsoleteProductCode] = useState('');
  const [filterParams, setFilterParams] = useState({
    primaryProductCode: '',
    obsoleteProductCode: '',
  });

  const {
    tableRef,
    tableData,
    onFetchHandler,
    loading,
  } = useProductMergeLogsTableData(filterParams);

  const onSearch = (event) => {
    event.preventDefault();
    setFilterParams({ primaryProductCode, obsoleteProductCode });
  };

  const onCancel = () => {
    setPrimaryProductCode('');
    setObsoleteProductCode('');
    setFilterParams({ primaryProductCode: '', obsoleteProductCode: '' });
  };

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.productMergeLogs.column.id.label" defaultMessage="Log ID" />,
      accessor: 'id',
      minWidth: 150,
    },
    {
      Header: <Translate id="react.productMergeLogs.column.primaryProduct.label" defaultMessage="Primary Product" />,
      accessor: 'primaryProductCode',
      minWidth: 120,
    },
    {
      Header: <Translate id="react.productMergeLogs.column.obsoleteProduct.label" defaultMessage="Obsolete Product" />,
      accessor: 'obsoleteProductCode',
      minWidth: 120,
    },
    {
      Header: <Translate id="react.productMergeLogs.column.relatedObjectId.label" defaultMessage="Related Object ID" />,
      accessor: 'relatedObjectId',
      minWidth: 150,
    },
    {
      Header: <Translate id="react.productMergeLogs.column.relatedObjectClassName.label" defaultMessage="Related Object class name" />,
      accessor: 'relatedObjectClassName',
      minWidth: 180,
    },
    {
      Header: <Translate id="react.productMergeLogs.column.dateMerged.label" defaultMessage="Date Merged" />,
      accessor: 'dateMerged',
      minWidth: 150,
    },
    {
      Header: <Translate id="react.productMergeLogs.column.createdBy.label" defaultMessage="Created By" />,
      accessor: 'createdBy',
      minWidth: 120,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.productMergeLogs.header.label',
          defaultMessage: 'List Product Merge Logs',
        }}
        />
      </HeaderWrapper>
      <ListTableWrapper>
        <form
          className="d-flex align-items-center gap-8 p-2"
          onSubmit={onSearch}
        >
          <label htmlFor="primaryProductCode" className="mb-0 mr-2">
            <Translate id="react.productMergeLogs.primaryProduct.label" defaultMessage="Primary Product" />
          </label>
          <input
            id="primaryProductCode"
            type="text"
            name="primaryProductCode"
            className="form-control w-25 mr-2"
            placeholder="Search by primary product code"
            value={primaryProductCode}
            onChange={(e) => setPrimaryProductCode(e.target.value)}
          />
          <label htmlFor="obsoleteProductCode" className="mb-0 mr-2">
            <Translate id="react.productMergeLogs.obsoleteProduct.label" defaultMessage="Obsolete Product" />
          </label>
          <input
            id="obsoleteProductCode"
            type="text"
            name="obsoleteProductCode"
            className="form-control w-25 mr-2"
            placeholder="Search by obsolete product code"
            value={obsoleteProductCode}
            onChange={(e) => setObsoleteProductCode(e.target.value)}
          />
          <Button
            type="submit"
            label="react.default.button.search.label"
            defaultLabel="Search"
          />
          <Button
            type="button"
            variant="secondary"
            label="react.default.button.cancel.label"
            defaultLabel="Cancel"
            onClick={onCancel}
          />
        </form>
        <DataTable
          manual
          sortable
          ref={tableRef}
          columns={columns}
          data={tableData.data}
          loading={loading}
          defaultPageSize={10}
          pages={tableData.pages}
          totalData={tableData.totalCount}
          onFetchData={onFetchHandler}
          noDataText="None"
          footerComponent={() => (
            <span className="title-text p-1 d-flex flex-1 justify-content-end" />
          )}
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default ProductMergeLogsList;
