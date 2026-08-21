/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { BATCH_IMPORT_DATA } from 'api/urls';
import { BATCH_URL, CONTEXT_PATH } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const IMPORT_TYPES = [
  {
    value: 'category',
    labelId: 'react.batch.importType.category.label',
    labelDefault: 'Category',
    dataHref: BATCH_URL.downloadExcel('Category'),
  },
  {
    value: 'inventory',
    labelId: 'react.batch.importType.inventory.label',
    labelDefault: 'Inventory',
    dataHref: `${CONTEXT_PATH}/inventory/downloadTemplate`,
  },
  {
    value: 'inventoryLevel',
    labelId: 'react.batch.importType.inventoryLevel.label',
    labelDefault: 'Inventory levels',
    templateHref: BATCH_URL.downloadTemplate('inventoryLevels.xls'),
    dataHref: BATCH_URL.downloadExcel('InventoryLevel'),
  },
  {
    value: 'location',
    labelId: 'react.batch.importType.location.label',
    labelDefault: 'Locations',
    templateHref: BATCH_URL.downloadTemplate('locations.xls'),
    dataHref: BATCH_URL.downloadExcel('Location'),
  },
  {
    value: 'person',
    labelId: 'react.batch.importType.person.label',
    labelDefault: 'People',
    templateHref: BATCH_URL.downloadTemplate('persons.xls'),
  },
  {
    value: 'productAttribute',
    labelId: 'react.batch.importType.productAttribute.label',
    labelDefault: 'Product Attribute',
    dataHref: `${CONTEXT_PATH}/productAttributeValue/exportProductAttribute`,
  },
  {
    value: 'productCatalog',
    labelId: 'react.batch.importType.productCatalog.label',
    labelDefault: 'Product Catalog',
    dataHref: BATCH_URL.downloadExcel('ProductCatalog'),
  },
  {
    value: 'productCatalogItem',
    labelId: 'react.batch.importType.productCatalogItem.label',
    labelDefault: 'Product Catalog Item',
    dataHref: BATCH_URL.downloadExcel('ProductCatalogItem'),
  },
  {
    value: 'productSupplier',
    labelId: 'react.batch.importType.productSupplier.label',
    labelDefault: 'Product Sources',
    templateHref: BATCH_URL.downloadTemplate('ProductSuppliers.xls'),
    dataHref: `${CONTEXT_PATH}/productSupplier/export?format=xls`,
  },
  {
    value: 'productSupplierPreference',
    labelId: 'react.batch.importType.productSupplierPreference.label',
    labelDefault: 'Product Source Preference',
    dataHref: BATCH_URL.downloadExcel('ProductSupplierPreference'),
  },
  {
    value: 'productSupplierAttribute',
    labelId: 'react.batch.importType.productSupplierAttribute.label',
    labelDefault: 'Product Source Attribute',
    dataHref: `${CONTEXT_PATH}/productAttributeValue/exportProductAttribute?entityTypeCode=PRODUCT_SUPPLIER`,
  },
  {
    value: 'productPackage',
    labelId: 'react.batch.importType.productPackage.label',
    labelDefault: 'Product Packages',
    dataHref: BATCH_URL.downloadExcel('ProductPackage'),
  },
  {
    value: 'productAssociation',
    labelId: 'react.batch.importType.productAssociation.label',
    labelDefault: 'Product Associations',
    templateHref: BATCH_URL.downloadTemplate('productAssociations.xls'),
    dataHref: BATCH_URL.downloadExcel('ProductAssociation'),
  },
  {
    value: 'productSynonym',
    labelId: 'react.batch.importType.productSynonym.label',
    labelDefault: 'Product Synonyms',
    templateHref: `${CONTEXT_PATH}/product/exportSynonymTemplate`,
    dataHref: BATCH_URL.downloadExcel('Synonym'),
  },
  {
    value: 'outboundStockMovement',
    labelId: 'react.batch.importType.outboundStockMovement.label',
    labelDefault: 'Stock Movements (Outbound)',
  },
  {
    value: 'purchaseOrderActualReadyDate',
    labelId: 'react.batch.importType.purchaseOrderActualReadyDate.label',
    labelDefault: 'PO Actual Ready Date and Recipient',
    templateHref: BATCH_URL.downloadTemplate('purchaseOrderActualReadyDateAndRecipient.xls'),
  },
  {
    value: 'tag',
    labelId: 'react.batch.importType.tag.label',
    labelDefault: 'Tag',
    dataHref: BATCH_URL.downloadExcel('Tag'),
  },
  {
    value: 'user',
    labelId: 'react.batch.importType.user.label',
    labelDefault: 'Users',
    templateHref: BATCH_URL.downloadTemplate('users.xls'),
  },
  {
    value: 'userLocation',
    labelId: 'react.batch.importType.userLocation.label',
    labelDefault: 'User Locations',
    templateHref: BATCH_URL.downloadTemplate('userLocations.xls'),
  },
];

const toImportDate = (dateTimeLocalValue) =>
  (dateTimeLocalValue ? dateTimeLocalValue.replace('T', ' ') : '');

const ImportDataPage = () => {
  useTranslation('batch', 'default');

  const currentLocation = useSelector((state) => state.session.currentLocation);

  const [importType, setImportType] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const onUpload = (event) => {
    event.preventDefault();
    const formData = new FormData();
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      formData.append('importFile', file);
    }
    formData.append('importType', importType);
    formData.append('importDate', toImportDate(date));
    setLoading(true);
    apiClient.post(BATCH_IMPORT_DATA, formData)
      .then((response) => {
        const { data } = response.data;
        setMessage(data.message);
        setErrors(data.errors || []);
        setPreview(data.data ? data : null);
      })
      .finally(() => setLoading(false));
  };

  const onFinish = () => {
    const params = new URLSearchParams();
    params.append('importType', preview.importType || importType);
    params.append('importNow', 'true');
    params.append('importDate', toImportDate(date));
    setLoading(true);
    apiClient.post(BATCH_IMPORT_DATA, params)
      .then((response) => {
        const { data } = response.data;
        setMessage(data.message);
        setErrors(data.errors || []);
        if (data.imported) {
          setPreview(null);
        } else if (data.data) {
          setPreview(data);
        }
      })
      .finally(() => setLoading(false));
  };

  const onBack = () => {
    setPreview(null);
    setErrors([]);
    setMessage(null);
  };

  const columns = preview?.columnMap ? Object.entries(preview.columnMap) : [];
  const hasBlankQuantities = preview?.importType === 'inventory'
    && preview?.data?.some((row) => row.quantity === null || row.quantity === undefined);

  return (
    <PageWrapper>
      <div className="admin-page">
        {message && (
          <div className="message" role="status" aria-label="message">
            {message}
          </div>
        )}
        {errors.length > 0 && (
          <div className="errors" role="alert" aria-label="error-message">
            <ul>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        {preview && (
          <div>
            {hasBlankQuantities && (
              <div className="message" role="status" aria-label="message">
                <Translate
                  id="react.batch.blankQuantities.label"
                  defaultMessage="Rows with blank quantity are highlighted; those products will be skipped during import."
                />
              </div>
            )}
            <div className="box">
              <h2>
                <Translate id="react.batch.importProperties.label" defaultMessage="Import properties" />
              </h2>
              <table>
                <tbody>
                  <tr className="prop">
                    <td className="name">
                      <label><Translate id="react.batch.location.label" defaultMessage="Location" /></label>
                    </td>
                    <td className="value">{preview.location}</td>
                  </tr>
                  <tr className="prop">
                    <td className="name">
                      <label><Translate id="react.batch.type.label" defaultMessage="Type" /></label>
                    </td>
                    <td className="value">{preview.importType}</td>
                  </tr>
                  <tr className="prop">
                    <td className="name">
                      <label><Translate id="react.batch.filename.label" defaultMessage="Filename" /></label>
                    </td>
                    <td className="value">{preview.filename}</td>
                  </tr>
                  {preview.date && (
                    <tr className="prop">
                      <td className="name">
                        <label><Translate id="react.batch.date.label" defaultMessage="Date" /></label>
                      </td>
                      <td className="value">{preview.date}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="box">
              <h2><Translate id="react.batch.data.label" defaultMessage="Data" /></h2>
              <table id="dataTable">
                <thead>
                  <tr>
                    {columns.map(([key, label]) => (
                      <th key={key}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.data?.map((row, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <tr key={index} className={index % 2 ? 'even' : 'odd'}>
                      {columns.map(([key, label]) => (
                        <td
                          key={key}
                          style={{
                            color: (row.isNewItem && label === 'lotNumber')
                              || (row.isNewExpirationDate && label === 'expirationDate')
                              ? 'red' : 'black',
                            backgroundColor: !row.quantity && row.quantity !== 0 && label === 'quantity'
                              ? '#ffcccb' : '',
                          }}
                        >
                          {String(row[label] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="buttons">
              <button type="button" className="button" onClick={onBack}>
                <Translate id="react.default.button.back.label" defaultMessage="Back" />
              </button>
              {errors.length === 0 && (
                <button type="button" className="button" id="finish-button" onClick={onFinish} disabled={loading}>
                  <Translate id="react.default.button.finish.label" defaultMessage="Finish" />
                </button>
              )}
            </div>
          </div>
        )}
        {!preview && (
          <div className="box">
            <h2>
              <Translate id="react.batch.importData.label" defaultMessage="Import data" />
            </h2>
            <div className="dialog">
              <form onSubmit={onUpload}>
                <table>
                  <tbody>
                    <tr className="prop">
                      <td className="name">
                        <label><Translate id="react.batch.location.label" defaultMessage="Location" /></label>
                      </td>
                      <td className="value">
                        {currentLocation?.name}
                      </td>
                    </tr>
                    <tr className="prop">
                      <td className="name">
                        <label htmlFor="date"><Translate id="react.batch.date.label" defaultMessage="Date" /></label>
                      </td>
                      <td className="value">
                        <input
                          id="date"
                          name="date"
                          type="datetime-local"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr className="prop">
                      <td className="name">
                        <label htmlFor="importFile">
                          <Translate id="react.batch.uploadAFileToImport.label" defaultMessage="Upload a file to import" />
                        </label>
                      </td>
                      <td className="value">
                        <input id="importFile" name="importFile" type="file" ref={fileInputRef} />
                      </td>
                    </tr>
                    <tr className="prop">
                      <td className="name">
                        <label><Translate id="react.batch.chooseType.label" defaultMessage="Choose Type" /></label>
                      </td>
                      <td className="value">
                        <table style={{ width: 'auto' }}>
                          <thead>
                            <tr>
                              <th><Translate id="react.batch.type.label" defaultMessage="Type" /></th>
                              <th><Translate id="react.batch.downloadTemplate.label" defaultMessage="Download Template" /></th>
                              <th><Translate id="react.batch.downloadData.label" defaultMessage="Download Data" /></th>
                            </tr>
                          </thead>
                          <tbody>
                            {IMPORT_TYPES.map((type) => (
                              <tr key={type.value}>
                                <td>
                                  <label>
                                    <input
                                      type="radio"
                                      name="importType"
                                      value={type.value}
                                      checked={importType === type.value}
                                      onChange={() => setImportType(type.value)}
                                    />
                                    <Translate
                                      id={type.labelId}
                                      defaultMessage={type.labelDefault}
                                    />
                                  </label>
                                </td>
                                <td>
                                  {type.templateHref && (
                                    <a href={type.templateHref}>
                                      <Translate id="react.batch.downloadTemplate.label" defaultMessage="Download Template" />
                                    </a>
                                  )}
                                </td>
                                <td>
                                  {type.dataHref && (
                                    <a href={type.dataHref}>
                                      <Translate id="react.batch.downloadData.label" defaultMessage="Download Data" />
                                    </a>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="name" />
                      <td className="value">
                        <button type="submit" className="button" disabled={loading}>
                          <Translate id="react.default.button.upload.label" defaultMessage="Upload" />
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </form>
            </div>
          </div>
        )}
        {loading && <div className="loading"><Translate id="react.default.loading.label" defaultMessage="Loading..." /></div>}
      </div>
    </PageWrapper>
  );
};

export default ImportDataPage;
