/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { PICKLIST_RETURN_PRINT_DATA } from 'api/urls';
import {
  changePageBreakParam,
  PrintDocumentHeader,
  printStyles,
  PrintToolbar,
  SignatureTable,
} from 'components/picklist/printShared';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const ItemRows = ({ item, index }) => {
  const backgroundColor = (index % 2) === 0 ? '#fff' : '#f7f7f7';
  const lines = item.lines.length ? item.lines : [null];
  const rowspan = lines.length;
  return lines.map((line, j) => (
    // eslint-disable-next-line react/no-array-index-key
    <tr className="prop" style={{ backgroundColor }} key={`${item.id}-${j}`}>
      {j === 0 && (
        <>
          <td className="center" rowSpan={rowspan}>{index + 1}</td>
          <td className="center" rowSpan={rowspan}>{item.productCode}</td>
          <td className="center" rowSpan={rowspan}>{item.productName}</td>
        </>
      )}
      <td className="middle center">
        {line && <span className="lotNumber">{line.lotNumber}</span>}
      </td>
      <td className="middle center">
        {line && line.expirationDate}
      </td>
      <td className="center middle">
        {line && <div className="binLocation">{line.binLocation}</div>}
      </td>
      <td className="middle center">
        {line && (
          <>
            {line.quantity}
            {' '}
            {line.unitOfMeasure}
          </>
        )}
      </td>
      <td className="center middle" />
      <td className="middle" />
    </tr>
  ));
};

const GroupTable = ({ data, group, pageBreakAfter }) => (
  <div className="page" style={{ pageBreakAfter }}>
    <table className="items-table fs-repeat-header" border="0">
      <thead style={{ display: 'table-row-group' }}>
        <tr>
          <td colSpan="10">
            <h4 className="title">{group.title}</h4>
          </td>
        </tr>
        <tr className="theader">
          <th>{data.columns[0].title}</th>
          <th className="center">{data.columns[1].title}</th>
          <th>{data.columns[2].title}</th>
          <th className="center" style={{ minWidth: '150px' }}>{data.columns[3].title}</th>
          <th className="center">{data.columns[4].title}</th>
          <th className="center">{data.columns[5].title}</th>
          <th className="center">{data.columns[6].title}</th>
          <th className="center">{data.columns[7].title}</th>
          <th className="center" style={{ minWidth: '100px' }}>{data.columns[8].title}</th>
        </tr>
      </thead>
      <tbody>
        {!group.items.length && (
          <tr>
            <td colSpan="10" className="middle center">
              <span className="fade">
                <Translate id="react.default.none.label" defaultMessage="None" />
              </span>
            </td>
          </tr>
        )}
        {group.items.map((item, i) => (
          <ItemRows key={item.id} item={item} index={i} />
        ))}
      </tbody>
    </table>
  </div>
);

GroupTable.propTypes = {
  data: PropTypes.shape({}).isRequired,
  group: PropTypes.shape({}).isRequired,
  pageBreakAfter: PropTypes.string.isRequired,
};

const ReturnPicklistPrint = ({ match }) => {
  useTranslation('picklist', 'default');
  const orderId = match.params.id;

  const searchParams = new URLSearchParams(window.location.search);
  const pageBreak = searchParams.get('pageBreak') || '';
  const enablePageBreak = pageBreak !== 'Disable page break';
  const [data, setData] = useState(null);

  useEffect(() => {
    const sorted = searchParams.get('sorted');
    apiClient.get(PICKLIST_RETURN_PRINT_DATA(orderId), { params: { sorted } })
      .then((response) => setData(response.data.data));
  }, [orderId]);

  if (!data) {
    return (
      <div className="p-3">
        <Translate id="react.default.loading.label" defaultMessage="Loading..." />
      </div>
    );
  }

  return (
    <div className="pick-print">
      <style>{printStyles}</style>
      <PrintToolbar
        title={data.title}
        pageBreak={pageBreak}
        onPageBreakChange={changePageBreakParam}
        downloadUrl={data.downloadUrl}
      />
      <PrintDocumentHeader data={data} />
      {data.zones.map((zone, i) => (
        <div
          key={zone.name || 'no-zone'}
          className="page"
          style={{
            pageBreakAfter: enablePageBreak && zone.showName && i < data.zones.length - 1 ? 'always' : 'avoid',
          }}
        >
          {zone.showName && (
            <h1 className="subtitle">{zone.title}</h1>
          )}
          {zone.groups.map((group) => (
            <GroupTable
              key={group.key}
              data={data}
              group={group}
              pageBreakAfter={enablePageBreak && !zone.showName && group.hasFollowing ? 'always' : 'avoid'}
            />
          ))}
        </div>
      ))}
      <SignatureTable
        signatureColumns={data.signatureColumns}
        signatures={data.signatures}
        showTime
      />
    </div>
  );
};

export default ReturnPicklistPrint;

ReturnPicklistPrint.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
};
