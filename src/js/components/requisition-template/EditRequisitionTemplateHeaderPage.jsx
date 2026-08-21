import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_TEMPLATE_HEADER } from 'api/urls';
import { REQUISITION_TEMPLATE_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

import { useTemplateDetails } from './requisition-template-utils';
import RequisitionTemplateHeaderFields from './RequisitionTemplateHeaderFields';
import RequisitionTemplateHeaderPanel from './RequisitionTemplateHeaderPanel';
import RequisitionTemplateSummary from './RequisitionTemplateSummary';

const personOption = (id, name) => (id ? { id, value: id, label: name } : null);

const EditRequisitionTemplateHeaderPage = ({ match }) => {
  const { template } = useTemplateDetails(match.params.templateId);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useTranslation('requisitionTemplate');

  useEffect(() => {
    if (template) {
      setForm({
        name: template.name || '',
        origin: template.originId
          ? { id: template.originId, value: template.originId, label: template.originName }
          : null,
        destination: template.destinationId
          ? {
            id: template.destinationId,
            value: template.destinationId,
            label: template.destinationName,
          }
          : null,
        requestedBy: personOption(template.requestedById, template.requestedByName),
        replenishmentPeriod: template.replenishmentPeriod != null
          ? String(template.replenishmentPeriod) : '',
        replenishmentTypeCode: template.replenishmentTypeCode || '',
        sortByCode: template.sortByCode || '',
        description: template.description || '',
      });
    }
  }, [template]);

  const save = () => {
    setSaving(true);
    setErrors([]);
    apiClient.post(REQUISITION_TEMPLATE_HEADER(template.id), {
      version: template.version,
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
        window.location.assign(REQUISITION_TEMPLATE_URL.show(template.id));
      } else {
        setErrors(response.data.errors || ['An error occurred while saving the stocklist']);
        setSaving(false);
      }
    }).catch((error) => {
      setErrors(error.response?.data?.errors || []);
      setSaving(false);
    });
  };

  if (!template || !form) {
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
      <RequisitionTemplateSummary template={template} />
      <div className="d-flex flex-wrap" style={{ gap: '1rem' }}>
        <div style={{ minWidth: '320px' }}>
          <RequisitionTemplateHeaderPanel template={template} />
        </div>
        <div className="flex-grow-1">
          <div className="box p-3 border rounded bg-white">
            <h2>
              <Translate id="react.requisitionTemplate.label" defaultMessage="Stock list" />
            </h2>
            <RequisitionTemplateHeaderFields form={form} setForm={setForm} options={template} />
            <div className="d-flex" style={{ gap: '0.5rem' }}>
              <button type="button" id="save-template-header" className="btn btn-primary" disabled={saving} onClick={save}>
                <Translate id="react.default.button.save.label" defaultMessage="Save" />
              </button>
              <a className="btn btn-outline-secondary" href={REQUISITION_TEMPLATE_URL.list()}>
                <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

EditRequisitionTemplateHeaderPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      templateId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default EditRequisitionTemplateHeaderPage;
