import React from 'react';

import PropTypes from 'prop-types';

import Translate from 'utils/Translate';

export const printStyles = `
  .pick-print {
    font: 11px "lucida grande", verdana, arial, helvetica, sans-serif;
    margin: 15px;
  }
  .pick-print h1 { font-size: 17px; font-weight: bold; }
  .pick-print h4.title { font-size: 14px; font-weight: bold; margin: 5px 0; }
  .pick-print table {
    border-collapse: collapse;
    page-break-inside: auto;
  }
  .pick-print thead { display: table-header-group; }
  .pick-print tr { page-break-inside: avoid; page-break-after: auto; }
  .pick-print td { vertical-align: top; }
  .pick-print .header { margin: 10px; }
  .pick-print .canceled {
    color: lightgrey;
    text-decoration: line-through;
  }
  .pick-print .CANCELED, .pick-print .canceled div {
    color: lightgrey;
    text-decoration: line-through;
  }
  .pick-print .fade { opacity: 0.5; color: grey; }
  .pick-print .top { vertical-align: top; }
  .pick-print .middle { vertical-align: middle; }
  .pick-print .right { text-align: right; }
  .pick-print .center { text-align: center; }
  .pick-print .name { font-weight: bold; }
  .pick-print .subtitle { margin-top: 10px; }
  .pick-print .lotNumber, .pick-print .binLocation {
    font-family: ui-monospace, monospace, sans-serif;
    vertical-align: middle;
    text-transform: uppercase;
  }
  .pick-print .items-table {
    margin-bottom: 10px;
    border-top: 2px solid lightgrey;
    border-bottom: 2px solid lightgrey;
    border-left: 2px solid lightgrey;
    width: 100%;
  }
  .pick-print .items-table tr { height: 50px; }
  .pick-print .items-table td, .pick-print .items-table th {
    border-right: 2px solid lightgrey;
    border-bottom: 2px solid lightgrey;
    padding: 2px 4px;
  }
  .pick-print .items-table th { background-color: #f7f7f7; }
  .pick-print .signature-table {
    width: 100%;
    margin: auto;
    margin-bottom: 20px;
    margin-top: 100px;
  }
  .pick-print .signature-table tr, .pick-print .signature-table td {
    border-top: 1px solid lightgrey;
    height: 60px;
  }
  .pick-print #print-header .button-container {
    float: right;
  }
  .pick-print #print-header select {
    height: 25px;
    margin-right: 10px;
  }
  .pick-print #print-header .button {
    margin-left: 5px;
  }
  @media print {
    .pick-print #print-header { display: none; }
  }
`;

export const pageBreakOptions = ['', 'Disable page break', 'Enable page break'];

export const PrintToolbar = ({
  title, pageBreak, onPageBreakChange, downloadUrl,
}) => (
  <div id="print-header">
    <div className="right button-container">
      <select
        id="select-page-break"
        name="pageBreak"
        value={pageBreak}
        onChange={(e) => onPageBreakChange(e.target.value)}
      >
        {pageBreakOptions.map((option) => (
          <option key={option || 'none'} value={option}>{option}</option>
        ))}
      </select>
      <div className="button-group">
        <a href="#print" id="print-button" className="button" onClick={(e) => { e.preventDefault(); window.print(); }}>
          <Translate id="react.default.button.print.label" defaultMessage="Print" />
        </a>
        {downloadUrl && (
          <a href={downloadUrl} className="button">
            <Translate id="react.default.button.download.label" defaultMessage="Download" />
          </a>
        )}
        <a href="#close" className="button" onClick={(e) => { e.preventDefault(); window.close(); }}>
          <Translate id="react.default.button.close.label" defaultMessage="Close" />
        </a>
      </div>
    </div>
    <h1 className="title">{title}</h1>
    <hr />
  </div>
);

PrintToolbar.propTypes = {
  title: PropTypes.string,
  pageBreak: PropTypes.string.isRequired,
  onPageBreakChange: PropTypes.func.isRequired,
  downloadUrl: PropTypes.string,
};

PrintToolbar.defaultProps = {
  title: null,
  downloadUrl: null,
};

export const PrintDocumentHeader = ({ data }) => (
  <table border="0">
    <tbody>
      <tr>
        <td width="1%">
          <div className="requisition-header cf-header" style={{ marginBottom: '20px' }}>
            {data.logoUrl && (
              <img id="logo" src={data.logoUrl} alt="" style={{ width: '80px' }} />
            )}
          </div>
        </td>
        <td>
          <div className="header">
            <h1>{data.heading}</h1>
          </div>
          {(data.documentNumber || data.documentName) && (
            <div className="header">
              {data.documentNumber}
              {' - '}
              {data.documentName}
            </div>
          )}
          <div className="header">
            {data.documentNumber && data.barcodeUrl && (
              <img src={data.barcodeUrl} alt="" />
            )}
          </div>
        </td>
        <td className="top">
          <table border="0">
            <tbody>
              {data.headerRows.map((row) => (
                <tr className="header" key={row.label}>
                  <td className="name right">
                    <label htmlFor="header">
                      {row.label}
                      :
                    </label>
                  </td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
);

PrintDocumentHeader.propTypes = {
  data: PropTypes.shape({}).isRequired,
};

export const SignatureTable = ({ signatureColumns, signatures, showTime }) => (
  <table className="signature-table" style={{ border: '0px solid lightgrey' }}>
    <tbody>
      <tr className="theader">
        <th width="15%" aria-label="signature-role" />
        <th width="20%">{signatureColumns.name}</th>
        <th width="40%">{signatureColumns.signature}</th>
        <th width="15%" className="center">{signatureColumns.date}</th>
        {showTime && (
          <th width="10%" className="center">{signatureColumns.time}</th>
        )}
      </tr>
      {signatures.map((signature) => (
        <tr key={signature.label}>
          <td className="middle">
            <label htmlFor="signature" className="name">{signature.label}</label>
          </td>
          <td className="middle">{signature.name}</td>
          <td />
          <td className="middle center">{signature.date}</td>
          {showTime && (
            <td className="middle center">{signature.time}</td>
          )}
        </tr>
      ))}
    </tbody>
  </table>
);

SignatureTable.propTypes = {
  signatureColumns: PropTypes.shape({}).isRequired,
  signatures: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  showTime: PropTypes.bool,
};

SignatureTable.defaultProps = {
  showTime: false,
};

export const changePageBreakParam = (value) => {
  if ('URLSearchParams' in window) {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('pageBreak', value);
    window.location.search = searchParams.toString();
  }
};

export default {
  printStyles, PrintToolbar, PrintDocumentHeader, SignatureTable,
};
