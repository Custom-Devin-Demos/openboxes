/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { STOCK_TRANSFER_PRINT_DATA } from 'api/urls';
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
  const splitItems = item.splitItems.length ? item.splitItems : [null];
  const rowspan = splitItems.length;
  return splitItems.map((splitItem, j) => (
    // eslint-disable-next-line react/no-array-index-key
    <tr className="prop" style={{ backgroundColor }} key={`${item.id}-${j}`}>
      {j === 0 && (
        <>
          <td className="center" width="1%" rowSpan={rowspan}>{index + 1}</td>
          <td className="center" width="1%" rowSpan={rowspan}>
            <span className="binLocation">{item.originBin}</span>
          </td>
          <td className="center" width="1%" rowSpan={rowspan}>{item.productCode}</td>
          <td width="50%" rowSpan={rowspan}>{item.productName}</td>
          <td className="center" width="1%" rowSpan={rowspan}>
            <span className="lotNumber">{item.lotNumber}</span>
          </td>
          <td className="center" width="1%" rowSpan={rowspan}>{item.expirationDate}</td>
        </>
      )}
      <td className="center" width="1%">
        <span className="binLocation">{splitItem ? splitItem.destinationBin : item.destinationBin}</span>
      </td>
      <td className="center" width="1%">
        {splitItem ? splitItem.quantity : item.quantity}
      </td>
      <td className="middle" width="30%" />
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
          <th>{data.columns[3].title}</th>
          <th className="center" style={{ minWidth: '150px' }}>{data.columns[4].title}</th>
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

const StockTransferPrint = ({ match }) => {
  useTranslation('stockTransfer', 'default');
  const stockTransferId = match.params.id;

  const searchParams = new URLSearchParams(window.location.search);
  const pageBreak = searchParams.get('pageBreak') || '';
  const enablePageBreak = pageBreak === 'Enable page break';
  const [data, setData] = useState(null);

  useEffect(() => {
    apiClient.get(STOCK_TRANSFER_PRINT_DATA(stockTransferId))
      .then((response) => setData(response.data.data));
  }, [stockTransferId]);

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
      />
    </div>
  );
};

export default StockTransferPrint;

StockTransferPrint.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
};
