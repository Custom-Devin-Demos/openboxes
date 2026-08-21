import React, { useMemo, useState } from 'react';

import { SHIPMENT_WORKFLOW_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { SHIPMENT_WORKFLOW_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ShipmentWorkflowList = () => {
  useTranslation('shipmentWorkflow', 'default');
  const [filterParams] = useState({ q: '' });

  const getParams = ({ offset, state, sortingParams }) => ({
    offset: `${offset}`,
    max: `${state.pageSize}`,
    ...sortingParams,
  });

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
  } = useTableData({
    filterParams,
    url: SHIPMENT_WORKFLOW_API,
    errorMessageId: 'react.shipmentWorkflow.error.shipmentWorkflowList.label',
    defaultErrorMessage: 'Unable to fetch shipment workflows',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.shipmentWorkflow.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={SHIPMENT_WORKFLOW_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.shipmentWorkflow.column.shipmentType.label" defaultMessage="Shipment Type" />,
      accessor: 'shipmentType.name',
      sortable: false,
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.shipmentWorkflow.column.excludedFields.label" defaultMessage="Excluded Fields" />,
      accessor: 'excludedFields',
      minWidth: 250,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.shipmentWorkflow.column.documentTemplate.label" defaultMessage="Document Template" />,
      accessor: 'documentTemplate',
      minWidth: 200,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.shipmentWorkflow.column.dateCreated.label" defaultMessage="Date Created" />,
      accessor: 'dateCreated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.shipmentWorkflow.header.label',
          defaultMessage: 'Shipment Workflows',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.shipmentWorkflow.createShipmentWorkflow.label"
            defaultLabel="Add Shipment Workflow"
            onClick={() => {
              window.location = SHIPMENT_WORKFLOW_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <ListTableWrapper>
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
          noDataText="No shipment workflows match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default ShipmentWorkflowList;
