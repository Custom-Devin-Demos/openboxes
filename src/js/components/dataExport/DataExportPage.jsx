import React, { useEffect, useState } from 'react';

import { DATA_EXPORTS } from 'api/urls';
import { DATA_EXPORT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const DataExportPage = () => {
  useTranslation('dataExport', 'default');

  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    apiClient.get(DATA_EXPORTS)
      .then((response) => setDocuments(response.data.data));
  }, []);

  return (
    <PageWrapper>
      <div className="admin-page box">
        <h2>
          <Translate id="react.dataExport.label" defaultMessage="Data Exports" />
        </h2>
        <table>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id}>
                <td className="middle">
                  {document.name}
                </td>
                <td className="right">
                  <a href={DATA_EXPORT_URL.render(document.id, 'csv')} className="button">
                    CSV
                  </a>
                  <a href={DATA_EXPORT_URL.render(document.id, 'json')} className="button">
                    JSON
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};

export default DataExportPage;
