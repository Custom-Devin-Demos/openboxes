import React, { useMemo, useState } from 'react';

import personApi from 'api/services/PersonApi';
import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PERSON_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import usePersonListTableData from 'hooks/list-pages/person/usePersonListTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableTitleWrapper from 'wrappers/ListTableTitleWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const PersonList = () => {
  useTranslation('person', 'default');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParams, setFilterParams] = useState({ q: '' });

  const {
    tableRef,
    tableData,
    onFetchHandler,
    loading,
    fireFetchData,
  } = usePersonListTableData(filterParams);

  const onSearch = (event) => {
    event.preventDefault();
    setFilterParams({ q: searchTerm });
  };

  const deletePerson = async (id) => {
    try {
      await personApi.deletePerson(id);
      notification(NotificationType.SUCCESS)({
        message: Translate({
          id: 'react.person.deleted.label',
          defaultMessage: `Person ${id} deleted`,
          data: { id },
        }),
      });
    } finally {
      fireFetchData();
    }
  };

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.person.column.active.label" defaultMessage="Active" />,
      accessor: 'active',
      Cell: (row) => (row.value
        ? <Translate id="react.default.yes.label" defaultMessage="Yes" />
        : <Translate id="react.default.no.label" defaultMessage="No" />),
    },
    {
      Header: <Translate id="react.person.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      sortable: false,
      Cell: (row) => (
        <TableCell
          {...row}
          link={PERSON_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.person.column.type.label" defaultMessage="Type" />,
      accessor: 'type',
      sortable: false,
      Cell: (row) => (row.value
        ? (
          <Translate
            id={`react.person.type.${row.value}.label`}
            defaultMessage={row.value}
          />
        )
        : null),
    },
    {
      Header: <Translate id="react.person.column.email.label" defaultMessage="Email" />,
      accessor: 'email',
    },
    {
      Header: <Translate id="react.person.column.phoneNumber.label" defaultMessage="Phone Number" />,
      accessor: 'phoneNumber',
    },
    {
      Header: <Translate id="react.default.actions.label" defaultMessage="Actions" />,
      accessor: 'id',
      sortable: false,
      Cell: (row) => (
        <Button
          variant="transparent"
          label="react.default.button.delete.label"
          defaultLabel="Delete"
          onClick={() => deletePerson(row.original.id)}
        />
      ),
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.person.header.label',
          defaultMessage: 'People',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.person.createPerson.label"
            defaultLabel="Add person"
            onClick={() => {
              window.location = PERSON_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <form className="d-flex align-items-end p-2" onSubmit={onSearch}>
        <div className="d-flex flex-column mr-2">
          <label htmlFor="person-search">
            <Translate id="react.default.search.label" defaultMessage="Search" />
          </label>
          <input
            id="person-search"
            data-testid="person-search-field"
            type="text"
            className="form-control"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          label="react.default.button.find.label"
          defaultLabel="Find"
        />
      </form>
      <ListTableWrapper>
        <ListTableTitleWrapper>
          <span>
            <Translate id="react.person.header.label" defaultMessage="People" />
            &nbsp;
            (
            {tableData?.totalCount}
            )
          </span>
        </ListTableTitleWrapper>
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
          noDataText="No people match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default PersonList;
