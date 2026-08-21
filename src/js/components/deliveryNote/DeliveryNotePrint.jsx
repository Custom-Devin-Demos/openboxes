/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { DELIVERY_NOTE_PRINT_DATA } from 'api/urls';
import {
  AddressSection,
  NotesSection,
  PrintHeader,
  printStyles,
  PrintToolbar,
  SignaturesSection,
} from 'components/deliveryNote/printShared';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const CancelReasonCell = ({ item }) => (
  <>
    {item.cancelReasonParent && (
      <>
        {item.cancelReasonParent.typeLabel}
        <i>{item.cancelReasonParent.reason}</i>
        {item.cancelReasonParent.comments && (
          <blockquote>{item.cancelReasonParent.comments}</blockquote>
        )}
      </>
    )}
    {item.cancelReasonOwn && (
      <>
        {item.cancelReasonOwn.canceledLabel}
        <i>{item.cancelReasonOwn.reason}</i>
        {item.cancelReasonOwn.comments && (
          <blockquote>{item.cancelReasonOwn.comments}</blockquote>
        )}
      </>
    )}
    {item.pickReason && <div>{item.pickReason}</div>}
  </>
);

CancelReasonCell.propTypes = {
  item: PropTypes.shape({}).isRequired,
};

const SectionTable = ({ data, section }) => (
  <div className="page-content" style={{ pageBreakAfter: section.pageBreakAfter }}>
    <table className="w100">
      <thead>
        <tr>
          <th><Translate id="react.deliveryNote.number.label" defaultMessage="No." /></th>
          {data.showPackLevel1Header && (
            <th><Translate id="react.deliveryNote.packLevel1.label" defaultMessage="Pack level 1" /></th>
          )}
          {data.showPackLevel2Header && (
            <th><Translate id="react.deliveryNote.packLevel2.label" defaultMessage="Pack level 2" /></th>
          )}
          <th><Translate id="react.deliveryNote.productCode.label" defaultMessage="Code" /></th>
          <th className="left"><Translate id="react.deliveryNote.product.label" defaultMessage="Product" /></th>
          <th><Translate id="react.deliveryNote.totalRequested.label" defaultMessage="Total Requested" /></th>
          <th><Translate id="react.deliveryNote.totalDelivered.label" defaultMessage="Total Delivered" /></th>
          <th><Translate id="react.deliveryNote.lotNumber.label" defaultMessage="Serial / Lot Number" /></th>
          <th><Translate id="react.deliveryNote.expirationDate.label" defaultMessage="Expiration date" /></th>
          <th><Translate id="react.deliveryNote.splitQuantity.label" defaultMessage="Split Quantity" /></th>
          <th><Translate id="react.deliveryNote.cancelReasonCode.label" defaultMessage="Reason code" /></th>
          <th><Translate id="react.deliveryNote.received.label" defaultMessage="Received" /></th>
          <th><Translate id="react.deliveryNote.comment.label" defaultMessage="Comment" /></th>
        </tr>
      </thead>
      <tbody>
        {!section.items.length && (
          <tr>
            <td colSpan="8" className="middle center">
              <span className="fade">
                <Translate id="react.default.none.label" defaultMessage="None" />
              </span>
            </td>
          </tr>
        )}
        {section.items.map((item, i) => {
          const backgroundColor = (i % 2) === 0 ? '#fff' : '#f7f7f7';
          const rowspan = item.lines.length;
          return item.lines.map((line, j) => (
            // eslint-disable-next-line react/no-array-index-key
            <tr className="prop" style={{ backgroundColor }} key={`${item.id}-${j}`}>
              {j === 0 && (
                <td className="center middle" rowSpan={rowspan}>{i + 1}</td>
              )}
              {data.showPackLevel1Cell && (
                <td className="middle center">{line.packLevel1}</td>
              )}
              {data.showPackLevel2Cell && (
                <td className="center middle">{line.packLevel2}</td>
              )}
              {j === 0 && (
                <>
                  <td className="center middle" rowSpan={rowspan}>
                    {item.substitutedParent && (
                      <div className="canceled">{item.substitutedParent.productCode}</div>
                    )}
                    {item.productCode}
                  </td>
                  <td className="middle" rowSpan={rowspan}>
                    {item.substitutedParent && (
                      <div className="canceled">{item.substitutedParent.productName}</div>
                    )}
                    {item.productName}
                  </td>
                  <td className="center middle" rowSpan={rowspan}>
                    {item.parentChanged ? (
                      <div>
                        {item.parentQuantity}
                        {' '}
                        {item.parentUnitOfMeasure}
                      </div>
                    ) : (
                      <div className={item.status}>
                        {item.quantity}
                        {' '}
                        {item.unitOfMeasure}
                      </div>
                    )}
                  </td>
                  <td className="center middle" rowSpan={rowspan}>
                    <div className={item.status}>
                      {item.totalQuantityPicked}
                      {' '}
                      {item.unitOfMeasure}
                    </div>
                  </td>
                </>
              )}
              <td className="middle center">{line.lotNumber}</td>
              <td className="middle center">{line.expirationDate}</td>
              <td className="center middle">
                {line.quantity != null && (
                  <>
                    {line.quantity}
                    {' '}
                    {item.unitOfMeasure}
                  </>
                )}
              </td>
              {j === 0 && (
                <td className="middle" rowSpan={rowspan}>
                  <CancelReasonCell item={item} />
                </td>
              )}
              <td className="middle">{line.quantityReceived || null}</td>
              <td>{line.comments}</td>
            </tr>
          ));
        })}
      </tbody>
    </table>
  </div>
);

SectionTable.propTypes = {
  data: PropTypes.shape({}).isRequired,
  section: PropTypes.shape({}).isRequired,
};

const DeliveryNotePrint = ({ match }) => {
  useTranslation('deliveryNote', 'default');
  const requisitionId = match.params.id;

  const searchParams = new URLSearchParams(window.location.search);
  const [data, setData] = useState(null);
  const [orientation, setOrientation] = useState(searchParams.get('orientation') || '');

  useEffect(() => {
    const sortOrder = searchParams.get('sortOrder');
    apiClient.get(DELIVERY_NOTE_PRINT_DATA(requisitionId), { params: { sortOrder } })
      .then((response) => setData(response.data.data));
  }, [requisitionId]);

  if (!data) {
    return (
      <div className="p-3">
        <Translate id="react.default.loading.label" defaultMessage="Loading..." />
      </div>
    );
  }

  return (
    <div className="delivery-note-print m-3">
      <style>
        {printStyles}
        {`@page { size: ${orientation || 'portrait'}; margin: .25in; }`}
      </style>
      <PrintToolbar orientation={orientation} onOrientationChange={setOrientation} />
      <PrintHeader data={data} />
      <AddressSection origin={data.origin} destination={data.destination} />
      <div className="content">
        {data.sections.map((section) => (
          <React.Fragment key={section.key}>
            <h2 className={section.headerMt ? 'mt' : ''}>{section.title}</h2>
            <SectionTable data={data} section={section} />
          </React.Fragment>
        ))}
        <NotesSection notes={data.notes} />
        <SignaturesSection />
      </div>
    </div>
  );
};

export default DeliveryNotePrint;

DeliveryNotePrint.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
};
