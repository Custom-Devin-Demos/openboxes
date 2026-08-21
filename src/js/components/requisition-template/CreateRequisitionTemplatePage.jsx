import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';

import { REQUISITION_TEMPLATE_API, REQUISITION_TEMPLATE_CREATE_CONTEXT } from 'api/urls';
import { REQUISITION_TEMPLATE_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

import RequisitionTemplateHeaderFields from './RequisitionTemplateHeaderFields';

const CreateRequisitionTemplatePage = ({ location }) => {
  const [context, setContext] = useState(null);
  const [form, setForm] = useState({
    name: '',
    origin: null,
    destination: null,
    requestedBy: null,
    replenishmentPeriod: '',
    replenishmentTypeCode: 'PUSH',
    sortByCode: '',
    description: '',
  });
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useTranslation('requisitionTemplate');

  const { type } = queryString.parse(location.search);

  useEffect(() => {
    apiClient.get(REQUISITION_TEMPLATE_CREATE_CONTEXT)
      .then((response) => {
        const { data } = response.data;
        setContext(data);
        setForm((prevForm) => ({
          ...prevForm,
          origin: data.originId
            ? { id: data.originId, value: data.originId, label: data.originName }
            : null,
        }));
      });
  }, []);

  const save = () => {
    setSaving(true);
    setErrors([]);
    apiClient.post(REQUISITION_TEMPLATE_API, {
      type: type || null,
      createdById: context.createdById || null,
      name: form.name || null,
      originId: form.origin?.id || null,
      destinationId: form.destination?.id || null,
      requestedById: form.requestedBy?.id || null,
      replenishmentPeriod: form.replenishmentPeriod || null,
      replenishmentTypeCode: form.replenishmentTypeCode || null,
      sortByCode: form.sortByCode || null,
      description: form.description || null,
    }).then((response) => {
      if (response.data.success) {
        window.location.assign(REQUISITION_TEMPLATE_URL.edit(response.data.data.id));
      } else {
        setErrors(response.data.errors || ['An error occurred while saving the stocklist']);
        setSaving(false);
      }
    }).catch((error) => {
      setErrors(error.response?.data?.errors || []);
      setSaving(false);
    });
  };

  if (!context) {
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
      <div className="box p-3 border rounded bg-white mb-3">
        <h2 id="new-requisition-template" className="mb-0">
          <Translate id="react.requisitionTemplate.new.label" defaultMessage="New stocklist" />
        </h2>
      </div>
      <div className="box p-3 border rounded bg-white">
        <h2>
          <Translate id="react.requisitionTemplate.label" defaultMessage="Stock list" />
        </h2>
        <RequisitionTemplateHeaderFields form={form} setForm={setForm} options={context} />
        <div className="d-flex justify-content-center" style={{ gap: '0.5rem' }}>
          <button type="button" id="save-template" className="btn btn-primary" disabled={saving} onClick={save}>
            <Translate id="react.default.button.save.label" defaultMessage="Save" />
          </button>
          <a className="btn btn-outline-secondary" href={REQUISITION_TEMPLATE_URL.list()}>
            <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
          </a>
        </div>
      </div>
    </div>
  );
};

CreateRequisitionTemplatePage.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};

export default CreateRequisitionTemplatePage;
