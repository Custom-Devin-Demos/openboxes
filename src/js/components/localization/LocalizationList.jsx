/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useMemo, useState } from 'react';

import localizationApi from 'api/services/LocalizationApi';
import { LOCALIZATION_SEARCH } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { LOCALIZATION_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const LocalizationList = () => {
  useTranslation('localization', 'default');

  const [localeOptions, setLocaleOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocale, setSelectedLocale] = useState('');
  const [filterParams, setFilterParams] = useState({ q: '', locale: '' });
  const [showUpload, setShowUpload] = useState(false);
  const [uploadLocale, setUploadLocale] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    localizationApi.getLocaleOptions()
      .then((response) => setLocaleOptions(response.data.data));
  }, []);

  const getParams = ({ offset, state, sortingParams }) => ({
    offset: `${offset}`,
    max: `${state.pageSize}`,
    ...sortingParams,
    ...(filterParams.q ? { q: filterParams.q } : {}),
    ...(filterParams.locale ? { locale: filterParams.locale } : {}),
  });

  const {
    tableRef,
    fireFetchData,
    loading,
    onFetchHandler,
    tableData,
  } = useTableData({
    filterParams,
    url: LOCALIZATION_SEARCH,
    errorMessageId: 'react.localization.error.localizationList.label',
    defaultErrorMessage: 'Unable to fetch localizations',
    getParams,
  });

  const onSearch = (event) => {
    event.preventDefault();
    setFilterParams({ q: searchQuery, locale: selectedLocale });
  };

  const onClear = () => {
    setSearchQuery('');
    setSelectedLocale('');
    setFilterParams({ q: '', locale: '' });
  };

  const deleteLocalization = async (id, onClose) => {
    try {
      await localizationApi.deleteLocalization(id);
      notification(NotificationType.SUCCESS)({
        message: `Localization ${id} deleted`,
      });
      fireFetchData();
    } finally {
      onClose?.();
    }
  };

  const deleteConfirmationModalButtons = (id) => (onClose) => ([
    {
      variant: 'transparent',
      defaultLabel: 'No',
      label: 'react.default.no.label',
      onClick: () => onClose?.(),
    },
    {
      variant: 'primary',
      defaultLabel: 'Yes',
      label: 'react.default.yes.label',
      onClick: () => deleteLocalization(id, onClose),
    },
  ]);

  const onDelete = (id) => confirmationModal({
    buttons: deleteConfirmationModalButtons(id),
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  const onUpload = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('locale', uploadLocale);
    formData.append('messageProperties', uploadFile);
    const response = await localizationApi.uploadLocalizations(formData);
    notification(NotificationType.SUCCESS)({ message: response.data.data.message });
    setShowUpload(false);
    setUploadFile(null);
    fireFetchData();
  };

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.localization.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 150,
      Cell: (row) => (
        <TableCell
          {...row}
          link={LOCALIZATION_URL.show(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.localization.code.label" defaultMessage="Code" />,
      accessor: 'code',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={LOCALIZATION_URL.edit(row.original.id)}
          tooltip
        />
      ),
    },
    {
      Header: <Translate id="react.localization.locale.label" defaultMessage="Locale" />,
      accessor: 'locale',
      minWidth: 80,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.localization.text.label" defaultMessage="Text" />,
      accessor: 'text',
      minWidth: 250,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.localization.column.dateCreated.label" defaultMessage="Date Created" />,
      accessor: 'dateCreated',
      minWidth: 130,
      Cell: (row) => <DateCell {...row} />,
    },
    {
      Header: <Translate id="react.localization.column.lastUpdated.label" defaultMessage="Last Updated" />,
      accessor: 'lastUpdated',
      minWidth: 130,
      Cell: (row) => <DateCell {...row} />,
    },
    {
      Header: <Translate id="react.default.actions.label" defaultMessage="Actions" />,
      accessor: 'actions',
      sortable: false,
      minWidth: 100,
      Cell: (row) => (
        <div className="d-flex">
          <Button
            variant="danger"
            label="react.default.button.delete.label"
            defaultLabel="Delete"
            onClick={() => onDelete(row.original.id)}
          />
        </div>
      ),
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.localization.header.label',
          defaultMessage: 'Localizations',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.localization.create.label"
            defaultLabel="Add Localization"
            onClick={() => {
              window.location = LOCALIZATION_URL.create();
            }}
          />
          <Button
            variant="secondary"
            label="react.default.button.export.label"
            defaultLabel="Export"
            onClick={() => {
              window.location = LOCALIZATION_URL.export(filterParams.locale);
            }}
          />
          <Button
            variant="secondary"
            label="react.default.button.import.label"
            defaultLabel="Import"
            onClick={() => setShowUpload((prev) => !prev)}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {showUpload && (
        <form className="d-flex align-items-center m-3" onSubmit={onUpload}>
          <select
            name="locale"
            className="mr-2"
            value={uploadLocale}
            onChange={(event) => setUploadLocale(event.target.value)}
          >
            <option value="" />
            {localeOptions.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            name="messageProperties"
            type="file"
            className="mr-2"
            onChange={(event) => setUploadFile(event.target.files[0])}
          />
          <Button
            type="submit"
            label="react.default.button.upload.label"
            defaultLabel="Upload"
            disabled={!uploadLocale || !uploadFile}
          />
        </form>
      )}
      <form className="d-flex align-items-center m-3" onSubmit={onSearch}>
        <input
          name="q"
          type="text"
          className="form-control w-25 mr-2"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <select
          name="locale"
          className="mr-2"
          value={selectedLocale}
          onChange={(event) => setSelectedLocale(event.target.value)}
        >
          <option value="" />
          {localeOptions.map((option) => (
            <option key={option.id} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          label="react.default.button.search.label"
          defaultLabel="Search"
        />
        <Button
          type="button"
          variant="secondary"
          label="react.default.button.clear.label"
          defaultLabel="Clear"
          onClick={onClear}
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
          noDataText="No localizations match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default LocalizationList;
