import React, { useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { UNIT_OF_MEASURE_CONVERSION_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { UNIT_OF_MEASURE_CONVERSION_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const UnitOfMeasureConversionList = () => {
  useTranslation('unitOfMeasureConversion', 'default');
  const history = useHistory();
  const isUserAdmin = useSelector((state) => state.session.isUserAdmin);

  const [filterParams] = useState({ includeAll: true });

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
    url: UNIT_OF_MEASURE_CONVERSION_API,
    errorMessageId: 'react.unitOfMeasureConversion.error.unitOfMeasureConversionList.label',
    defaultErrorMessage: 'Unable to fetch unit of measure conversions',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.unitOfMeasureConversion.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={UNIT_OF_MEASURE_CONVERSION_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.unitOfMeasureConversion.column.active.label" defaultMessage="Active" />,
      accessor: 'active',
      minWidth: 100,
      Cell: (row) => <TableCell {...row} value={`${row.original.active}`} />,
    },
    {
      Header: <Translate id="react.unitOfMeasureConversion.fromUnitOfMeasure.label" defaultMessage="From Unit Of Measure" />,
      accessor: 'fromUnitOfMeasure',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} value={row.original.fromUnitOfMeasure?.name} />,
    },
    {
      Header: <Translate id="react.unitOfMeasureConversion.toUnitOfMeasure.label" defaultMessage="To Unit Of Measure" />,
      accessor: 'toUnitOfMeasure',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} value={row.original.toUnitOfMeasure?.name} />,
    },
    {
      Header: <Translate id="react.unitOfMeasureConversion.conversionRate.label" defaultMessage="Conversion Rate" />,
      accessor: 'conversionRate',
      minWidth: 120,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.unitOfMeasureConversion.column.dateCreated.label" defaultMessage="Date Created" />,
      accessor: 'dateCreated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
    {
      Header: <Translate id="react.unitOfMeasureConversion.column.lastUpdated.label" defaultMessage="Last Updated" />,
      accessor: 'lastUpdated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.unitOfMeasureConversion.header.label',
          defaultMessage: 'Uom Conversions List',
        }}
        />
        <HeaderButtonsWrapper>
          {isUserAdmin && (
            <Button
              label="react.unitOfMeasureConversion.addUnitOfMeasureConversion.label"
              defaultLabel="Add Uom Conversion"
              onClick={() => history.push(UNIT_OF_MEASURE_CONVERSION_URL.create())}
            />
          )}
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
          noDataText="No unit of measure conversions match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default UnitOfMeasureConversionList;
