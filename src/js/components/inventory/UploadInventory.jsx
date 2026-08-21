import React, { useState } from 'react';

import { INVENTORY_UPLOAD } from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import './inventoryLegacy.scss';

const UploadInventory = () => {
  useTranslation('inventory', 'default');

  const [file, setFile] = useState(null);
  const [inventoryList, setInventoryList] = useState(null);
  const [error, setError] = useState('');

  const onSubmit = (event) => {
    event.preventDefault();
    setError('');
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    apiClient.post(INVENTORY_UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then((response) => setInventoryList(response.data?.inventoryList || []))
      .catch((err) => {
        setInventoryList(null);
        setError(err.response?.data?.error || '');
      });
  };

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="box p-3">
        <h2>
          <Translate id="react.inventory.upload.label" defaultMessage="Upload inventory" />
        </h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <input
              type="file"
              name="file"
              id="file"
              onChange={(event) => setFile(event.target.files[0])}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            <Translate id="react.default.button.upload.label" defaultMessage="Upload" />
          </button>
        </form>
        {inventoryList && (
          <table className="table table-striped table-sm mt-3">
            <tbody>
              {inventoryList.map((row, rowIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <tr key={rowIndex}>
                  <td>
                    <table className="table table-sm mb-0">
                      <tbody>
                        {row.map((cell) => (
                          <tr key={cell.key}>
                            <td className="font-weight-bold">{cell.key}</td>
                            <td>{cell.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageWrapper>
  );
};

export default UploadInventory;
