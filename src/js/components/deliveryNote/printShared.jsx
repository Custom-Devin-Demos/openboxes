import React from 'react';

import PropTypes from 'prop-types';

import Translate from 'utils/Translate';

export const printStyles = `
  .delivery-note-print table {
    border-collapse: collapse;
    border-spacing: 0;
    margin: 5px;
  }
  .delivery-note-print thead {
    display: table-header-group;
  }
  .delivery-note-print tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  .delivery-note-print th {
    background-color: lightgrey;
    font-weight: bold;
  }
  .delivery-note-print {
    font: 11px "lucida grande", verdana, arial, helvetica, sans-serif;
  }
  .delivery-note-print table td, .delivery-note-print table th {
    padding: 5px;
    border: 1px solid lightgrey;
    vertical-align: middle;
  }
  .delivery-note-print .no-border-table td, .delivery-note-print .no-border-table th {
    border: 0 !important;
  }
  .delivery-note-print .m-0 { margin: 0 !important; }
  .delivery-note-print .m-5 { margin: 5px !important; }
  .delivery-note-print .b-0 { border: 0 !important; }
  .delivery-note-print .w100 { width: 100% !important; }
  .delivery-note-print .no-wrap { white-space: nowrap; }
  .delivery-note-print .fixed-layout { table-layout: fixed; }
  .delivery-note-print .large { font-size: larger; }
  .delivery-note-print .signature-table {
    width: 100%;
    margin: auto;
    margin-bottom: 20px;
    margin-top: 100px;
  }
  .delivery-note-print .signature-table tr, .delivery-note-print .signature-table td {
    border: 0px solid lightgrey;
    border-top: 1px solid lightgrey;
    height: 60px;
    vertical-align: top;
  }
  .delivery-note-print .top { vertical-align: top; }
  .delivery-note-print .middle { vertical-align: middle; }
  .delivery-note-print .right { text-align: right; }
  .delivery-note-print .center { text-align: center; }
  .delivery-note-print .left { text-align: left; }
  .delivery-note-print .canceled { text-decoration: line-through; }
  .delivery-note-print .fade { opacity: 0.5; }
  .delivery-note-print h2.mt { margin-top: 20px; }
  .delivery-note-print #select-orientation {
    height: 25px;
    margin-right: 15px;
  }
  @media print {
    .delivery-note-print .print-header { display: none; }
  }
`;

export const PrintToolbar = ({ orientation, onOrientationChange }) => (
  <div className="print-header">
    <table className="w100 fixed-layout no-border-table">
      <tbody>
        <tr>
          <td>
            <h1 className="m-0">
              <Translate id="react.deliveryNote.button.print.label" defaultMessage="Print Delivery Note" />
            </h1>
          </td>
          <td className="right">
            <div className="button-container">
              <select
                id="select-orientation"
                name="orientation"
                value={orientation}
                onChange={(e) => onOrientationChange(e.target.value)}
              >
                <option value="" aria-label="none" />
                <option value="portrait">portrait</option>
                <option value="landscape">landscape</option>
              </select>
              <button
                id="print-page"
                type="button"
                className="button"
                onClick={() => window.print()}
              >
                <Translate id="react.default.button.print.label" defaultMessage="Print" />
              </button>
              <a href="#close" className="button" onClick={(e) => { e.preventDefault(); window.close(); }}>
                <Translate id="react.default.button.close.label" defaultMessage="Close" />
              </a>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <hr />
  </div>
);

PrintToolbar.propTypes = {
  orientation: PropTypes.string.isRequired,
  onOrientationChange: PropTypes.func.isRequired,
};

export const PrintHeader = ({ data }) => (
  <div id="header" className="header">
    <table className="w100 fixed-layout no-border-table">
      <tbody>
        <tr>
          <td colSpan="2" className="b-0">
            <table className="w100">
              <tbody>
                <tr>
                  <td className="left top" width="5%">
                    {data.logoUrl && (
                      <div id="logo-square">
                        <img src={data.logoUrl} alt="Openboxes" width="40" height="40" />
                      </div>
                    )}
                  </td>
                  <td className="left top">
                    <h1 className="m-5">{data.title}</h1>
                    <div className="m-5 large">
                      {data.documentNumber}
                      {' '}
                      {data.documentName}
                    </div>
                    <div className="m-0">
                      {data.documentNumber && (
                        <img src={data.barcodeUrl} alt="" />
                      )}
                    </div>
                  </td>
                  <td className="right" width="25%">
                    <table className="w100 no-wrap">
                      <tbody>
                        <tr>
                          <td>
                            <label htmlFor="origin">
                              <Translate id="react.deliveryNote.origin.label" defaultMessage="Origin" />
                              :
                            </label>
                          </td>
                          <td>{data.origin?.name}</td>
                        </tr>
                        <tr>
                          <td>
                            <label htmlFor="destination">
                              <Translate id="react.deliveryNote.destination.label" defaultMessage="Destination" />
                              :
                            </label>
                          </td>
                          <td>{data.destination?.name}</td>
                        </tr>
                        {data.requestedBy && (
                          <tr>
                            <td>
                              <label htmlFor="requestedBy">
                                <Translate id="react.deliveryNote.requestedBy.label" defaultMessage="Requested by" />
                                :
                              </label>
                            </td>
                            <td>{data.requestedBy}</td>
                          </tr>
                        )}
                        {data.dateRequested && (
                          <tr>
                            <td>
                              <label htmlFor="dateRequested">
                                <Translate id="react.deliveryNote.dateRequested.label" defaultMessage="Date requested" />
                                :
                              </label>
                            </td>
                            <td>{data.dateRequested}</td>
                          </tr>
                        )}
                        <tr>
                          <td>
                            <label htmlFor="shipDate">
                              <Translate id="react.deliveryNote.shipDate.label" defaultMessage="Ship date" />
                              :
                            </label>
                          </td>
                          <td>{data.shipDate}</td>
                        </tr>
                        <tr>
                          <td>
                            <label htmlFor="receivedDate">
                              <Translate id="react.deliveryNote.receivedDate.label" defaultMessage="Received date" />
                              :
                            </label>
                          </td>
                          <td>{data.receivedDate}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

PrintHeader.propTypes = {
  data: PropTypes.shape({}).isRequired,
};

const AddressBlock = ({ location }) => (
  <table className="no-border-table w100">
    <tbody>
      <tr>
        <td>
          <table className="w100 no-wrap">
            <tbody>
              <tr><td><strong>{location?.name}</strong></td></tr>
              <tr><td>{location?.address?.address}</td></tr>
              {location?.address?.address2 && (
                <tr><td>{location?.address?.address2}</td></tr>
              )}
              <tr>
                <td>
                  {[location?.address?.city, location?.address?.stateOrProvince,
                    location?.address?.postalCode].filter(Boolean).join(' ')}
                </td>
              </tr>
              <tr><td>{location?.address?.country}</td></tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
);

AddressBlock.propTypes = {
  location: PropTypes.shape({}),
};

AddressBlock.defaultProps = {
  location: null,
};

export const AddressSection = ({ origin, destination }) => {
  if (!origin?.address && !destination?.address) {
    return null;
  }
  return (
    <div id="address" className="page-content">
      <table className="w100 fixed-layout b-0">
        <tbody>
          <tr>
            <td className="b-0">
              <h2>
                <Translate id="react.deliveryNote.receivedFrom.label" defaultMessage="Received From" />
              </h2>
              <AddressBlock location={origin} />
            </td>
            <td className="b-0 top">
              <h2>
                <Translate id="react.deliveryNote.deliveredTo.label" defaultMessage="Delivered To" />
              </h2>
              <AddressBlock location={destination} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

AddressSection.propTypes = {
  origin: PropTypes.shape({}),
  destination: PropTypes.shape({}),
};

AddressSection.defaultProps = {
  origin: null,
  destination: null,
};

export const NotesSection = ({ notes }) => (
  <table className="w100 fixed-layout b-0" style={{ marginTop: '20px' }}>
    <tbody>
      <tr>
        <td className="b-0">
          <h2>
            <Translate id="react.deliveryNote.notes.label" defaultMessage="Notes" />
          </h2>
        </td>
      </tr>
      <tr>
        <td className="b-0">
          <label htmlFor="trackingNumber">
            <Translate id="react.deliveryNote.trackingNumber.label" defaultMessage="Tracking number" />
            :
            {' '}
          </label>
          {notes?.trackingNumber}
        </td>
      </tr>
      <tr>
        <td className="b-0">
          <label htmlFor="driverName">
            <Translate id="react.deliveryNote.driverName.label" defaultMessage="Driver name" />
            :
            {' '}
          </label>
          {notes?.driverName}
        </td>
      </tr>
      <tr>
        <td className="b-0">
          <label htmlFor="comments">
            <Translate id="react.deliveryNote.comments.label" defaultMessage="Comments" />
            :
            {' '}
          </label>
          {notes?.comments}
        </td>
      </tr>
    </tbody>
  </table>
);

NotesSection.propTypes = {
  notes: PropTypes.shape({}),
};

NotesSection.defaultProps = {
  notes: null,
};

const signatureRows = [
  { key: 'sentBy', label: 'react.deliveryNote.sentBy.label', defaultMessage: 'Sent by' },
  { key: 'approvedBy', label: 'react.deliveryNote.approvedBy.label', defaultMessage: 'Approved by' },
  { key: 'deliveredBy', label: 'react.deliveryNote.deliveredBy.label', defaultMessage: 'Delivered by' },
  { key: 'receivedBy', label: 'react.deliveryNote.receivedBy.label', defaultMessage: 'Received by' },
  { key: 'checkedBy', label: 'react.deliveryNote.checkedBy.label', defaultMessage: 'Checked by beneficiary/program' },
];

export const SignaturesSection = () => (
  <table className="signature-table w100 fixed-layout">
    <tbody>
      {signatureRows.map((row) => (
        <tr key={row.key}>
          <td width="33%" align="left">
            <Translate id={row.label} defaultMessage={row.defaultMessage} />
          </td>
          <td width="33%" align="center">
            <Translate id="react.deliveryNote.signature.label" defaultMessage="Signature" />
          </td>
          <td width="33%" align="right">
            <Translate id="react.deliveryNote.dateAndTime.label" defaultMessage="Date and time" />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
