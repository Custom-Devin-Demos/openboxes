import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_EDIT_HEADER } from 'api/urls';
import { REQUISITION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Select from 'utils/Select';
import Translate from 'utils/Translate';

import { COMMODITY_CLASSES, useRequisitionSelectFetch } from './requisition-utils';

const FieldRow = ({ label, defaultMessage, children }) => (
  <tr>
    <td className="name pr-2 text-muted" style={{ width: '220px' }}>
      <Translate id={label} defaultMessage={defaultMessage} />
    </td>
    <td className="value">{children}</td>
  </tr>
);

FieldRow.propTypes = {
  label: PropTypes.string.isRequired,
  defaultMessage: PropTypes.string.isRequired,
  children: PropTypes.node,
};

FieldRow.defaultProps = {
  children: null,
};

const personOption = (id, name) => (id ? { id, value: id, label: name } : null);

const EditRequisitionHeaderPage = ({ match }) => {
  const { debouncedPeopleFetch, debouncedLocationsFetch } = useRequisitionSelectFetch();
  const [requisition, setRequisition] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useTranslation('requisition');

  useEffect(() => {
    apiClient.get(REQUISITION_EDIT_HEADER(match.params.requisitionId))
      .then((response) => {
        const { data } = response.data;
        setRequisition(data);
        setForm({
          requestNumber: data.requestNumber || '',
          name: data.name || '',
          status: data.statusName || '',
          type: data.type || '',
          origin: data.originId
            ? { id: data.originId, value: data.originId, label: data.originName }
            : null,
          destination: data.destinationId
            ? { id: data.destinationId, value: data.destinationId, label: data.destinationName }
            : null,
          commodityClass: data.commodityClass || '',
          requestedBy: personOption(data.requestedById, data.requestedByName),
          verifiedBy: personOption(data.verifiedById, data.verifiedByName),
          picker: personOption(data.pickerId, data.pickerName),
          checkedBy: personOption(data.checkedById, data.checkedByName),
          deliveredBy: personOption(data.deliveredById, data.deliveredByName),
          receivedBy: personOption(data.receivedById, data.receivedByName),
          dateRequested: data.dateRequested || '',
          requestedDeliveryDate: data.requestedDeliveryDate || '',
          description: data.description || '',
        });
      });
  }, [match.params.requisitionId]);

  const save = () => {
    setSaving(true);
    setErrors([]);
    apiClient.post(REQUISITION_EDIT_HEADER(requisition.id), {
      requestNumber: form.requestNumber || null,
      name: form.name || null,
      status: requisition.isUserAdmin ? form.status || null : undefined,
      type: form.type || null,
      originId: form.origin?.id || null,
      destinationId: form.destination?.id || null,
      commodityClass: form.commodityClass || null,
      requestedById: form.requestedBy?.id || null,
      verifiedById: form.verifiedBy?.id || null,
      pickerId: form.picker?.id || null,
      checkedById: form.checkedBy?.id || null,
      deliveredById: form.deliveredBy?.id || null,
      receivedById: form.receivedBy?.id || null,
      dateRequested: form.dateRequested || null,
      requestedDeliveryDate: form.requestedDeliveryDate || null,
      description: form.description || null,
    }).then((response) => {
      if (response.data.success) {
        window.location.assign(REQUISITION_URL.edit(requisition.id));
      } else {
        setErrors(response.data.errors || ['An error occurred while saving the requisition']);
        setSaving(false);
      }
    }).catch(() => setSaving(false));
  };

  if (!requisition) {
    return null;
  }

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
          <Translate id="react.requisition.editHeader.label" defaultMessage="Edit requisition header" />
        </h2>
        <table className="table table-sm table-borderless w-auto">
          <tbody>
            <FieldRow label="react.requisition.requestNumber.label" defaultMessage="Request number">
              <input
                id="requestNumber"
                type="text"
                className="form-control"
                value={form.requestNumber}
                onChange={(event) => setForm({ ...form, requestNumber: event.target.value })}
              />
            </FieldRow>
            <FieldRow label="react.requisition.name.label" defaultMessage="Name">
              <input
                id="name"
                type="text"
                className="form-control"
                style={{ minWidth: '400px' }}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </FieldRow>
            {requisition.isUserAdmin && (
              <FieldRow label="react.requisition.status.label" defaultMessage="Status">
                <select
                  id="status"
                  className="form-control"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                >
                  {(requisition.statusOptions || []).map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </FieldRow>
            )}
            <FieldRow label="react.requisition.requisitionType.label" defaultMessage="Requisition type">
              <select
                id="type"
                className="form-control"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                <option value="" aria-label="None" />
                {(requisition.typeOptions || []).map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="react.requisition.origin.label" defaultMessage="Origin">
              <Select
                id="origin"
                async
                loadOptions={debouncedLocationsFetch}
                cache={false}
                options={[]}
                value={form.origin}
                onChange={(value) => setForm({ ...form, origin: value })}
              />
            </FieldRow>
            <FieldRow label="react.requisition.destination.label" defaultMessage="Destination">
              <Select
                id="destination"
                async
                loadOptions={debouncedLocationsFetch}
                cache={false}
                options={[]}
                value={form.destination}
                onChange={(value) => setForm({ ...form, destination: value })}
              />
            </FieldRow>
            <FieldRow label="react.requisition.commodityClass.label" defaultMessage="Commodity class">
              <select
                id="commodityClass"
                className="form-control"
                value={form.commodityClass}
                onChange={(event) => setForm({ ...form, commodityClass: event.target.value })}
              >
                <option value="" aria-label="None" />
                {COMMODITY_CLASSES.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="react.requisition.requestedBy.label" defaultMessage="Requested by">
              <Select
                id="requestedBy"
                async
                loadOptions={debouncedPeopleFetch}
                cache={false}
                options={[]}
                value={form.requestedBy}
                onChange={(value) => setForm({ ...form, requestedBy: value })}
              />
            </FieldRow>
            <FieldRow label="react.requisition.verifiedBy.label" defaultMessage="Verified by">
              <Select
                id="verifiedBy"
                async
                loadOptions={debouncedPeopleFetch}
                cache={false}
                options={[]}
                value={form.verifiedBy}
                onChange={(value) => setForm({ ...form, verifiedBy: value })}
              />
            </FieldRow>
            {requisition.hasPicklist && (
              <FieldRow label="react.requisition.pickedBy.label" defaultMessage="Picked by">
                <Select
                  id="picker"
                  async
                  loadOptions={debouncedPeopleFetch}
                  cache={false}
                  options={[]}
                  value={form.picker}
                  onChange={(value) => setForm({ ...form, picker: value })}
                />
              </FieldRow>
            )}
            <FieldRow label="react.requisition.checkedBy.label" defaultMessage="Checked by">
              <Select
                id="checkedBy"
                async
                loadOptions={debouncedPeopleFetch}
                cache={false}
                options={[]}
                value={form.checkedBy}
                onChange={(value) => setForm({ ...form, checkedBy: value })}
              />
            </FieldRow>
            <FieldRow label="react.requisition.deliveredBy.label" defaultMessage="Delivered by">
              <Select
                id="deliveredBy"
                async
                loadOptions={debouncedPeopleFetch}
                cache={false}
                options={[]}
                value={form.deliveredBy}
                onChange={(value) => setForm({ ...form, deliveredBy: value })}
              />
            </FieldRow>
            <FieldRow label="react.requisition.receivedBy.label" defaultMessage="Received by">
              <Select
                id="receivedBy"
                async
                loadOptions={debouncedPeopleFetch}
                cache={false}
                options={[]}
                value={form.receivedBy}
                onChange={(value) => setForm({ ...form, receivedBy: value })}
              />
            </FieldRow>
            <FieldRow label="react.requisition.createdBy.label" defaultMessage="Created by">
              {requisition.createdByName}
            </FieldRow>
            <FieldRow label="react.requisition.updatedBy.label" defaultMessage="Updated by">
              {requisition.updatedByName}
            </FieldRow>
            <FieldRow label="react.requisition.dateRequested.label" defaultMessage="Date requested">
              <input
                id="dateRequested"
                type="text"
                className="form-control"
                placeholder="MM/dd/yyyy"
                value={form.dateRequested}
                onChange={(event) => setForm({ ...form, dateRequested: event.target.value })}
              />
            </FieldRow>
            <FieldRow label="react.requisition.requestedDeliveryDate.label" defaultMessage="Requested delivery date">
              <input
                id="requestedDeliveryDate"
                type="text"
                className="form-control"
                placeholder="MM/dd/yyyy"
                value={form.requestedDeliveryDate}
                onChange={(event) => setForm({
                  ...form, requestedDeliveryDate: event.target.value,
                })}
              />
            </FieldRow>
            <FieldRow label="react.requisition.description.label" defaultMessage="Description">
              <textarea
                id="description"
                className="form-control"
                style={{ minWidth: '400px' }}
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </FieldRow>
          </tbody>
        </table>
        <div className="d-flex justify-content-center" style={{ gap: '0.5rem' }}>
          <a className="btn btn-outline-secondary" href={REQUISITION_URL.show(requisition.id)}>
            <Translate id="react.default.button.back.label" defaultMessage="Back" />
          </a>
          <button type="button" id="save-header" className="btn btn-primary" disabled={saving} onClick={save}>
            <Translate id="react.default.button.next.label" defaultMessage="Next" />
          </button>
        </div>
      </div>
    </div>
  );
};

EditRequisitionHeaderPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      requisitionId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default EditRequisitionHeaderPage;
