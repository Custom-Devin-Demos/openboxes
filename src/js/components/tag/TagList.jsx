import React, { useMemo, useState } from 'react';

import { useHistory } from 'react-router-dom';

import { TAG_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import TextInput from 'components/form-elements/v2/TextInput';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { TAG_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const TagList = () => {
  useTranslation('tag', 'default');
  const history = useHistory();

  const [searchTag, setSearchTag] = useState('');
  const [filterParams, setFilterParams] = useState({ tag: '' });

  const getParams = ({ offset, state, sortingParams }) => ({
    offset: `${offset}`,
    max: `${state.pageSize}`,
    ...sortingParams,
    ...(filterParams.tag ? { tag: filterParams.tag } : {}),
  });

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
  } = useTableData({
    filterParams,
    url: TAG_API,
    errorMessageId: 'react.tag.error.tagList.label',
    defaultErrorMessage: 'Unable to fetch tags',
    getParams,
  });

  const onSearch = (event) => {
    event.preventDefault();
    setFilterParams({ tag: searchTag });
  };

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.tag.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={TAG_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.tag.column.tag.label" defaultMessage="Tag" />,
      accessor: 'tag',
      minWidth: 150,
      Cell: (row) => (
        <TableCell
          {...row}
          link={TAG_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.tag.column.products.label" defaultMessage="Products" />,
      accessor: 'productsCount',
      sortable: false,
      minWidth: 100,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.tag.column.isActive.label" defaultMessage="Is active?" />,
      accessor: 'isActive',
      sortable: false,
      minWidth: 100,
      Cell: (row) => <TableCell {...row} value={`${row.original.isActive}`} />,
    },
    {
      Header: <Translate id="react.tag.column.updatedBy.label" defaultMessage="Updated By" />,
      accessor: 'updatedBy',
      sortable: false,
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.tag.column.createdBy.label" defaultMessage="Created By" />,
      accessor: 'createdBy',
      sortable: false,
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.tag.column.dateCreated.label" defaultMessage="Date Created" />,
      accessor: 'dateCreated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
    {
      Header: <Translate id="react.tag.column.lastUpdated.label" defaultMessage="Last Updated" />,
      accessor: 'lastUpdated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.tag.header.label',
          defaultMessage: 'Tag List',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.tag.addTag.label"
            defaultLabel="Add tag"
            onClick={() => history.push(TAG_URL.create())}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <div className="m-3">
        <form onSubmit={onSearch} className="d-flex align-items-end gap-8 w-50">
          <TextInput
            title={{ id: 'react.tag.tag.label', defaultMessage: 'Tag' }}
            name="tag"
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
          />
          <Button
            type="submit"
            label="react.default.button.search.label"
            defaultLabel="Search"
          />
        </form>
      </div>
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
          noDataText="No tags match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default TagList;
