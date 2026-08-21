import React, { useState } from 'react';

import ProductScreenApi from 'api/services/ProductScreenApi';
import notification from 'components/Layout/notifications/notification';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const ImportProductsPage = () => {
  useTranslation('product', 'default');

  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [tagsToBeAdded, setTagsToBeAdded] = useState('');
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleUpload = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('importType', 'product');
      if (file) {
        formData.append('importFile', file);
      }
      const response = await ProductScreenApi.importUpload(formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult(response.data);
      setTagsToBeAdded(response.data.tag || '');
    } catch (err) {
      setUploadResult(null);
      setErrors(err?.response?.data?.errorMessages || ['Unable to upload file']);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async () => {
    setSubmitting(true);
    setErrors([]);
    try {
      const body = new URLSearchParams();
      body.append('type', 'product');
      body.append('importNow', 'true');
      body.append('tagsToBeAdded', tagsToBeAdded);
      const response = await ProductScreenApi.importConfirm(body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      notification(NotificationType.SUCCESS)({ message: response.data.message });
      setImportResult(response.data);
    } catch (err) {
      setErrors(err?.response?.data?.errorMessages || ['Unable to import products']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="p-3">
        <h1>
          <Translate id="react.product.importAsCsv.label" defaultMessage="Import products" />
        </h1>
        {errors.length > 0 && (
          <div className="alert alert-danger">
            <ul className="m-0">
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        )}
        <div className="box mb-3">
          <h2 className="h5">
            1.
            {' '}
            <Translate id="react.product.uploadDataFile.label" defaultMessage="Upload data file" />
          </h2>
          <div className="mb-2">
            <a href={`${window.CONTEXT_PATH}/batch/downloadCsvTemplate?template=products.csv`}>
              <Translate id="react.product.downloadTemplate.label" defaultMessage="Download template" />
            </a>
            {' | '}
            <a href={`${window.CONTEXT_PATH}/product/exportAsCsv`}>
              <Translate id="react.product.exportProducts.label" defaultMessage="Export products" />
            </a>
          </div>
          <form onSubmit={handleUpload}>
            <input
              className="form-control-file d-inline-block w-auto mr-2"
              type="file"
              accept=".csv"
              onChange={(event) => setFile(event.target.files[0])}
            />
            <button type="submit" className="btn btn-primary" disabled={submitting || !file}>
              <Translate id="react.default.button.upload.label" defaultMessage="Upload" />
            </button>
          </form>
        </div>
        {uploadResult && (
          <div className="box mb-3">
            <h2 className="h5">
              2.
              {' '}
              <Translate id="react.product.verifyProducts.label" defaultMessage="Verify products" />
            </h2>
            <p>{uploadResult.message}</p>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th aria-label="Status"><Translate id="react.product.status.label" defaultMessage="Status" /></th>
                    <th aria-label="Code"><Translate id="react.product.productCode.label" defaultMessage="Code" /></th>
                    <th aria-label="Name"><Translate id="react.product.name.label" defaultMessage="Name" /></th>
                    <th aria-label="Category"><Translate id="react.product.category.label" defaultMessage="Category" /></th>
                    <th aria-label="Unit of measure"><Translate id="react.product.unitOfMeasure.label" defaultMessage="Unit of measure" /></th>
                    <th aria-label="Tags"><Translate id="react.product.tags.label" defaultMessage="Tags" /></th>
                  </tr>
                </thead>
                <tbody>
                  {uploadResult.products?.map((product) => (
                    <tr key={`${product.productCode}-${product.name}`}>
                      <td>
                        {product.isNew
                          ? <span className="badge badge-success">New</span>
                          : <span className="badge badge-secondary">Existing</span>}
                      </td>
                      <td>{product.productCode}</td>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>{product.unitOfMeasure}</td>
                      <td>{product.tags?.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {uploadResult && (
          <div className="box">
            <h2 className="h5">
              3.
              {' '}
              <Translate id="react.product.importProducts.label" defaultMessage="Import products" />
            </h2>
            <div className="form-group w-50">
              <label htmlFor="tags-to-be-added">
                <Translate id="react.product.tags.label" defaultMessage="Tags" />
              </label>
              <input
                id="tags-to-be-added"
                className="form-control"
                type="text"
                value={tagsToBeAdded}
                onChange={(event) => setTagsToBeAdded(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={submitting || !!importResult}
              onClick={handleImport}
            >
              <Translate id="react.product.importProducts.label" defaultMessage="Import products" />
            </button>
            {importResult && <p className="mt-2 text-success">{importResult.message}</p>}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default ImportProductsPage;
