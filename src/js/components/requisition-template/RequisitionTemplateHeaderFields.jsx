import React from 'react';

import PropTypes from 'prop-types';

import { useRequisitionSelectFetch } from 'components/requisition/requisition-utils';
import Select from 'utils/Select';
import Translate from 'utils/Translate';

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

const RequisitionTemplateHeaderFields = ({ form, setForm, options }) => {
  const { debouncedPeopleFetch, debouncedLocationsFetch } = useRequisitionSelectFetch();

  return (
    <table className="table table-sm table-borderless w-auto">
      <tbody>
        <FieldRow label="react.requisitionTemplate.name.label" defaultMessage="Name">
          <input
            id="name"
            type="text"
            className="form-control"
            style={{ minWidth: '400px' }}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </FieldRow>
        <FieldRow label="react.requisitionTemplate.origin.label" defaultMessage="Origin">
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
        <FieldRow label="react.requisitionTemplate.destination.label" defaultMessage="Destination">
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
        <FieldRow label="react.requisitionTemplate.requestedBy.label" defaultMessage="Managed by">
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
        <FieldRow label="react.requisitionTemplate.replenishmentPeriodDays.label" defaultMessage="Replenishment period (days)">
          <input
            id="replenishmentPeriod"
            type="text"
            className="form-control"
            value={form.replenishmentPeriod}
            onChange={(event) => setForm({
              ...form, replenishmentPeriod: event.target.value.replace(/[^\d]/g, ''),
            })}
          />
        </FieldRow>
        <FieldRow label="react.requisitionTemplate.replenishmentTypeCode.label" defaultMessage="Replenishment type">
          <select
            id="replenishmentTypeCode"
            className="form-control"
            value={form.replenishmentTypeCode}
            onChange={(event) => setForm({ ...form, replenishmentTypeCode: event.target.value })}
          >
            <option value="" aria-label="None" />
            {(options.replenishmentTypeCodeOptions || []).map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="react.requisitionTemplate.sortByCode.label" defaultMessage="Sort order">
          <select
            id="sortByCode"
            className="form-control"
            value={form.sortByCode}
            onChange={(event) => setForm({ ...form, sortByCode: event.target.value })}
          >
            <option value="" aria-label="None" />
            {(options.sortByCodeOptions || []).map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="react.requisitionTemplate.description.label" defaultMessage="Description">
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
  );
};

RequisitionTemplateHeaderFields.propTypes = {
  form: PropTypes.shape({}).isRequired,
  setForm: PropTypes.func.isRequired,
  options: PropTypes.shape({
    replenishmentTypeCodeOptions: PropTypes.arrayOf(PropTypes.shape({})),
    sortByCodeOptions: PropTypes.arrayOf(PropTypes.shape({})),
  }).isRequired,
};

export default RequisitionTemplateHeaderFields;
