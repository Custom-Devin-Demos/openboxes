import React, { useEffect, useMemo, useState } from 'react';

import { useHistory } from 'react-router-dom';

import { DOCUMENT_API, DOCUMENT_TYPE_OPTIONS } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { DOCUMENT_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const DocumentList = () => {
  useTranslation('document', 'default');
  const history = useHistory();

  const [documentTypeOptions, setDocumentTypeOptions] = useState([]);
  const [q, setQ] = useState('');
  const [documentType, setDocumentType] = useState(null);
  const [filterParams, setFilterParams] = useState({ initialized: true });

  useEffect(() => {
    apiClient.get(DOCUMENT_TYPE_OPTIONS)
      .then((response) => {
        setDocumentTypeOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.name,
        })));
      });
  }, []);

  const getParams = ({ offset, state, sortingParams }) => ({
    offset: `${offset}`,
    max: `${state.pageSize}`,
    ...sortingParams,
    ...(filterParams.q ? { q: filterParams.q } : {}),
    ...(filterParams.documentTypeId ? { 'documentType.id': filterParams.documentTypeId } : {}),
  });

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
  } = useTableData({
    filterParams,
    url: DOCUMENT_API,
    errorMessageId: 'react.document.error.documentList.label',
    defaultErrorMessage: 'Unable to fetch documents',
    getParams,
  });

  const onSearch = (event) => {
    event.preventDefault();
    setFilterParams({
      initialized: true,
      q,
      documentTypeId: documentType?.id,
    });
  };

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.document.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 200,
      Cell: (row) => (
        <TableCell
          {...row}
          link={DOCUMENT_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.document.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 200,
      Cell: (row) => (
        <TableCell
          {...row}
          link={DOCUMENT_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.document.documentType.label" defaultMessage="Document Type" />,
      accessor: 'documentType.name',
      sortable: false,
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.document.filename.label" defaultMessage="Filename" />,
      accessor: 'filename',
      minWidth: 200,
      Cell: (row) => (
        <TableCell
          {...row}
          link={DOCUMENT_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.document.extension.label" defaultMessage="Extension" />,
      accessor: 'extension',
      minWidth: 100,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.document.contentType.label" defaultMessage="Content type" />,
      accessor: 'contentType',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.document.listDocuments.header.label',
          defaultMessage: 'List Documents',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.document.list.label"
            defaultLabel="List documents"
            variant="secondary"
            onClick={() => history.push(DOCUMENT_URL.list())}
          />
          <Button
            label="react.document.add.label"
            defaultLabel="Add document"
            onClick={() => history.push(DOCUMENT_URL.create())}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <form onSubmit={onSearch} className="d-flex align-items-end gap-8 p-3">
        <div style={{ minWidth: '200px' }}>
          <TextInput
            title={{ id: 'react.document.name.label', defaultMessage: 'Name' }}
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div style={{ minWidth: '200px' }}>
          <SelectField
            title={{ id: 'react.document.documentType.label', defaultMessage: 'Document Type' }}
            name="documentType"
            options={documentTypeOptions}
            defaultValue={documentType}
            onChange={setDocumentType}
          />
        </div>
        <Button
          type="submit"
          label="react.default.button.find.label"
          defaultLabel="Find"
        />
      </form>
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
          noDataText="No documents match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default DocumentList;
