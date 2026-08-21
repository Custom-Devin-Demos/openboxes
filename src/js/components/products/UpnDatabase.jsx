import React, { useEffect, useState } from 'react';

import productScreenApi from 'api/services/ProductScreenApi';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import PageWrapper from 'wrappers/PageWrapper';

const COLUMNS = [
  { key: 'upn', header: 'upn' },
  { key: 'supplier', header: 'supplier' },
  { key: 'division', header: 'division' },
  { key: 'tradeName', header: 'tradeName' },
  { key: 'description', header: 'description' },
  { key: 'uom', header: 'uom' },
  { key: 'qty', header: 'qty' },
  { key: 'partno', header: 'partno' },
  { key: 'saleable', header: 'saleable' },
  { key: 'upnQualifierCode', header: 'upnQualifier' },
  { key: 'srcCode', header: 'srcCode' },
  { key: 'trackingRequired', header: 'trackingRequired' },
  { key: 'upnCreateDate', header: 'upnCreateDate' },
  { key: 'upnEditDate', header: 'upnEditDate' },
  { key: 'statusCode', header: 'statusCode' },
  { key: 'actionCode', header: 'actionCode' },
  { key: 'reference', header: 'reference' },
  { key: 'referenceQualifierCode', header: 'referenceQualifier' },
];

const UpnDatabase = () => {
  useTranslation('default');
  const spinner = useSpinner();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    spinner.show();
    productScreenApi.getUpnDatabase()
      .then((response) => setRows(response.data?.data ?? []))
      .finally(() => spinner.hide());
  }, []);

  return (
    <PageWrapper>
      <div className="p-3" style={{ fontSize: '9px' }}>
        <table className="table table-sm table-bordered">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <tr key={index}>
                {COLUMNS.map((column) => (
                  <td key={column.key}>{row[column.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};

export default UpnDatabase;
