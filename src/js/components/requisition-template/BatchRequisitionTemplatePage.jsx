import React, { useState } from 'react';

import PropTypes from 'prop-types';

import {
  REQUISITION_TEMPLATE_ADD_ITEMS,
  REQUISITION_TEMPLATE_DO_IMPORT,
  REQUISITION_TEMPLATE_IMPORT_DATA,
} from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

import { useTemplateDetails } from './requisition-template-utils';
import RequisitionTemplateHeaderPanel from './RequisitionTemplateHeaderPanel';
import RequisitionTemplateSummary from './RequisitionTemplateSummary';

const duplicateRowStyle = { backgroundColor: 'rgba(255, 0, 0, 0.31)' };

const DelimiterAndSkipFields = ({
  delimiter, setDelimiter, skipLines, setSkipLines, idPrefix,
}) => (
  <>
    <div className="form-group row">
      <span className="col-sm-3 col-form-label text-muted">
        <Translate id="react.requisitionTemplate.delimiter.label" defaultMessage="Column delimiter" />
      </span>
      <div className="col-sm-9 d-flex align-items-center" style={{ gap: '1rem' }}>
        <label htmlFor={`${idPrefix}-delimiter-comma`} className="mb-0">
          <input
            id={`${idPrefix}-delimiter-comma`}
            type="radio"
            name={`${idPrefix}-delimiter`}
            checked={delimiter === ','}
            onChange={() => setDelimiter(',')}
          />
          {' Comma'}
        </label>
        <label htmlFor={`${idPrefix}-delimiter-tab`} className="mb-0">
          <input
            id={`${idPrefix}-delimiter-tab`}
            type="radio"
            name={`${idPrefix}-delimiter`}
            checked={delimiter === '\t'}
            onChange={() => setDelimiter('\t')}
          />
          {' Tab'}
        </label>
      </div>
    </div>
    <div className="form-group row">
      <span className="col-sm-3 col-form-label text-muted">
        <Translate id="react.requisitionTemplate.skipLines.label" defaultMessage="Skip lines" />
      </span>
      <div className="col-sm-9">
        <input
          id={`${idPrefix}-skipLines`}
          type="text"
          className="form-control w-auto"
          value={skipLines}
          onChange={(event) => setSkipLines(event.target.value.replace(/[^\d]/g, ''))}
        />
      </div>
    </div>
  </>
);

DelimiterAndSkipFields.propTypes = {
  delimiter: PropTypes.string.isRequired,
  setDelimiter: PropTypes.func.isRequired,
  skipLines: PropTypes.string.isRequired,
  setSkipLines: PropTypes.func.isRequired,
  idPrefix: PropTypes.string.isRequired,
};

const BatchRequisitionTemplatePage = ({ match }) => {
  const { template, refetchTemplate } = useTemplateDetails(match.params.templateId);
  const [activeTab, setActiveTab] = useState('importAsFile');
  const [file, setFile] = useState(null);
  const [fileDelimiter, setFileDelimiter] = useState(',');
  const [fileSkipLines, setFileSkipLines] = useState('1');
  const [csv, setCsv] = useState('Product Code,Product Name,Quantity,Unit of Measure');
  const [csvDelimiter, setCsvDelimiter] = useState(',');
  const [csvSkipLines, setCsvSkipLines] = useState('1');
  const [productCodes, setProductCodes] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState([]);

  useTranslation('requisitionTemplate');

  if (!template) {
    return null;
  }

  const handleResponse = (response) => {
    setPreviewData(response.data.data || []);
    setErrors(response.data.errors || []);
    setMessage(null);
  };

  const handleError = (error) => {
    setErrors(error.response?.data?.errors
      || [error.response?.data?.errorMessage || 'An error occurred while importing data']);
  };

  const uploadFile = () => {
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('delimiter', fileDelimiter);
    formData.append('skipLines', fileSkipLines || '0');
    apiClient.post(REQUISITION_TEMPLATE_IMPORT_DATA(template.id), formData)
      .then(handleResponse)
      .catch(handleError);
  };

  const importCsv = () => {
    const formData = new FormData();
    formData.append('csv', csv);
    formData.append('delimiter', csvDelimiter);
    formData.append('skipLines', csvSkipLines || '0');
    apiClient.post(REQUISITION_TEMPLATE_IMPORT_DATA(template.id), formData)
      .then(handleResponse)
      .catch(handleError);
  };

  const addProductCodes = () => {
    apiClient.post(REQUISITION_TEMPLATE_ADD_ITEMS(template.id), {
      multipleProductCodes: productCodes,
    }).then((response) => {
      setMessage(response.data.message);
      setErrors([]);
      setProductCodes('');
      refetchTemplate();
    }).catch(handleError);
  };

  const doImport = () => {
    apiClient.post(REQUISITION_TEMPLATE_DO_IMPORT(template.id))
      .then((response) => {
        setMessage(response.data.message);
        setErrors(response.data.errors || []);
        setPreviewData(null);
        refetchTemplate();
      })
      .catch(handleError);
  };

  const productCountMap = (previewData || []).reduce((acc, row) => ({
    ...acc, [row[0]]: (acc[row[0]] || 0) + 1,
  }), {});
  const hasDuplicates = Object.values(productCountMap).some((count) => count > 1);

  const tabs = [
    { id: 'importAsFile', label: 'Import as file', translateId: 'react.requisitionTemplate.importAsFile.label' },
    { id: 'importAsString', label: 'Import as string', translateId: 'react.requisitionTemplate.importAsString.label' },
    { id: 'addToRequisitionItems', label: 'Bulk add by product codes', translateId: 'react.requisitionTemplate.bulkAddByProductCodes.label' },
  ];

  return (
    <div className="d-flex flex-column list-page-main p-3">
      {message && <div className="alert alert-success" role="alert">{message}</div>}
      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert" aria-label="error-message">
          <ul className="mb-0">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <RequisitionTemplateSummary template={template} />
      <div className="d-flex flex-wrap" style={{ gap: '1rem' }}>
        <div style={{ minWidth: '320px' }}>
          <RequisitionTemplateHeaderPanel template={template} />
        </div>
        <div className="flex-grow-1">
          <ul className="nav nav-tabs">
            {tabs.map((tab) => (
              <li key={tab.id} className="nav-item">
                <button
                  type="button"
                  className={`nav-link btn btn-link ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Translate id={tab.translateId} defaultMessage={tab.label} />
                </button>
              </li>
            ))}
          </ul>
          {activeTab === 'importAsFile' && (
            <div id="importAsFile" className="box p-3 border rounded bg-white mb-3">
              <h2>
                <Translate id="react.requisitionTemplate.uploadCsv.label" defaultMessage="Upload CSV/TSV" />
              </h2>
              <div className="form-group row">
                <span className="col-sm-3 col-form-label text-muted">
                  <Translate id="react.requisitionTemplate.selectFile.label" defaultMessage="Select file" />
                </span>
                <div className="col-sm-9">
                  <input
                    id="file"
                    name="file"
                    type="file"
                    onChange={(event) => setFile(event.target.files[0] || null)}
                  />
                </div>
              </div>
              <DelimiterAndSkipFields
                delimiter={fileDelimiter}
                setDelimiter={setFileDelimiter}
                skipLines={fileSkipLines}
                setSkipLines={setFileSkipLines}
                idPrefix="file"
              />
              <button type="button" className="btn btn-primary" onClick={uploadFile}>
                <Translate id="react.default.button.upload.label" defaultMessage="Upload" />
              </button>
            </div>
          )}
          {activeTab === 'importAsString' && (
            <div id="importAsString" className="box p-3 border rounded bg-white mb-3">
              <h2>
                <Translate id="react.requisitionTemplate.pasteCsv.label" defaultMessage="Copy-and-paste CSV/TSV" />
              </h2>
              <DelimiterAndSkipFields
                delimiter={csvDelimiter}
                setDelimiter={setCsvDelimiter}
                skipLines={csvSkipLines}
                setSkipLines={setCsvSkipLines}
                idPrefix="csv"
              />
              <div className="form-group row">
                <span className="col-sm-3 col-form-label text-muted">
                  <Translate id="react.requisitionTemplate.data.label" defaultMessage="Data" />
                </span>
                <div className="col-sm-9">
                  <textarea
                    id="csv"
                    className="form-control"
                    rows={10}
                    value={csv}
                    onChange={(event) => setCsv(event.target.value)}
                  />
                </div>
              </div>
              <button type="button" className="btn btn-primary" onClick={importCsv}>
                <Translate id="react.requisitionTemplate.process.label" defaultMessage="Import" />
              </button>
            </div>
          )}
          {activeTab === 'addToRequisitionItems' && (
            <div id="addToRequisitionItems" className="box p-3 border rounded bg-white mb-3">
              <h2>
                <Translate id="react.requisitionTemplate.bulkAddByProductCodes.label" defaultMessage="Bulk add by product codes" />
              </h2>
              <div className="d-flex" style={{ gap: '0.5rem' }}>
                <input
                  id="productCodesInput"
                  type="text"
                  className="form-control"
                  placeholder="..."
                  value={productCodes}
                  onChange={(event) => setProductCodes(event.target.value)}
                />
                <button type="button" className="btn btn-primary text-nowrap" onClick={addProductCodes}>
                  <Translate id="react.requisitionTemplate.addToProducts.label" defaultMessage="Add to products" />
                </button>
              </div>
            </div>
          )}
          {previewData && previewData.length > 0 && (
            <div className="box p-3 border rounded bg-white">
              <h2>
                <Translate id="react.requisitionTemplate.importData.label" defaultMessage="Import data" />
              </h2>
              <table className="table table-sm table-striped">
                <thead>
                  <tr>
                    <th aria-label="Row"><Translate id="react.requisitionTemplate.row.label" defaultMessage="Row" /></th>
                    <th aria-label="Product code"><Translate id="react.requisitionTemplate.productCode.label" defaultMessage="Product code" /></th>
                    <th aria-label="Product"><Translate id="react.requisitionTemplate.product.label" defaultMessage="Product" /></th>
                    <th aria-label="Qty"><Translate id="react.requisitionTemplate.qty.label" defaultMessage="Qty" /></th>
                    <th aria-label="UOM"><Translate id="react.requisitionTemplate.uom.label" defaultMessage="UOM" /></th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr
                      // eslint-disable-next-line react/no-array-index-key
                      key={`row-${index}`}
                      style={productCountMap[row[0]] > 1 ? duplicateRowStyle : undefined}
                    >
                      <td>{index + 1}</td>
                      {row.map((column, columnIndex) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <td key={`col-${columnIndex}`}>{column}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn btn-primary submit-import-button"
                  disabled={hasDuplicates}
                  onClick={doImport}
                >
                  <Translate id="react.default.button.save.label" defaultMessage="Save" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

BatchRequisitionTemplatePage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      templateId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default BatchRequisitionTemplatePage;
