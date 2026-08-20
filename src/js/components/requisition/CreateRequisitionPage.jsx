import React, { useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';

import { REQUISITION_API } from 'api/urls';
import { REQUISITION_TEMPLATE_URL, REQUISITION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Select from 'utils/Select';
import Translate from 'utils/Translate';

import {
  COMMODITY_CLASSES,
  REQUISITION_TYPE_LABELS,
  useRequisitionSelectFetch,
} from './requisition-utils';

const CreateRequisitionPage = ({ history, location }) => {
  const { type } = queryString.parse(location.search);
  const {
    currentLocation, user, debouncedPeopleFetch, debouncedLocationsFetch,
  } = useRequisitionSelectFetch();

  const [destination, setDestination] = useState(null);
  const [commodityClass, setCommodityClass] = useState(null);
  const [requestedBy, setRequestedBy] = useState(null);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useTranslation('requisition');

  const save = () => {
    setSaving(true);
    apiClient.post(REQUISITION_API, {
      status: 'CREATED',
      type: type || null,
      originId: currentLocation?.id,
      destinationId: destination?.id || null,
      commodityClass: commodityClass?.value || null,
      requestedById: requestedBy?.id || null,
      createdById: user?.id,
      description: description || null,
    }).then((response) => {
      if (response.data.success) {
        history.push(REQUISITION_URL.edit(response.data.data.id));
      } else {
        setErrors(response.data.errors || []);
        setSaving(false);
      }
    }).catch(() => setSaving(false));
  };

  return (
    <div className="d-flex flex-column list-page-main p-3">
      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert" aria-label="error-message">
          <ul className="mb-0">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <div className="box p-3 border rounded bg-white">
        <h2>
          <Translate id="react.requisition.new.label" defaultMessage="New requisition" />
        </h2>
        <table className="table table-sm mt-3">
          <tbody>
            <tr>
              <td className="name">
                <Translate id="react.requisition.requisitionType.label" defaultMessage="Requisition type" />
              </td>
              <td className="value">
                {REQUISITION_TYPE_LABELS[type] || type || ''}
              </td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.origin.label" defaultMessage="Origin" />
              </td>
              <td className="value">{currentLocation?.name}</td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.destination.label" defaultMessage="Destination" />
              </td>
              <td className="value">
                <Select
                  id="destination"
                  async
                  loadOptions={debouncedLocationsFetch}
                  cache={false}
                  options={[]}
                  value={destination}
                  onChange={setDestination}
                />
              </td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.commodityClass.label" defaultMessage="Commodity class" />
              </td>
              <td className="value">
                <Select
                  id="commodityClass"
                  options={COMMODITY_CLASSES}
                  value={commodityClass}
                  onChange={setCommodityClass}
                />
              </td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.requestedBy.label" defaultMessage="Requested by" />
              </td>
              <td className="value">
                <Select
                  id="requestedBy"
                  async
                  loadOptions={debouncedPeopleFetch}
                  cache={false}
                  options={[]}
                  value={requestedBy}
                  onChange={setRequestedBy}
                />
              </td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.description.label" defaultMessage="Comments" />
              </td>
              <td className="value">
                <textarea
                  id="description"
                  className="form-control"
                  rows="2"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <div className="d-flex justify-content-center" style={{ gap: '0.5rem' }}>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>
            <Translate id="react.default.button.save.label" defaultMessage="Save" />
          </button>
          <a className="btn btn-outline-secondary" href={`${REQUISITION_TEMPLATE_URL.base}/list`}>
            <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
          </a>
        </div>
      </div>
    </div>
  );
};

CreateRequisitionPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};

export default CreateRequisitionPage;
