import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_TEMPLATES } from 'api/urls';
import { REQUISITION_TEMPLATE_URL, REQUISITION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Select from 'utils/Select';
import Translate from 'utils/Translate';

const templateLabel = (template) =>
  `${template.name} - ${template.originName} - ${template.destinationName} (${template.commodityClass || ''})`;

const ChooseTemplatePage = ({ history }) => {
  const [templates, setTemplates] = useState([]);

  useTranslation('requisition');

  useEffect(() => {
    apiClient.get(REQUISITION_TEMPLATES).then((response) => {
      setTemplates(response.data.data.map((template) => ({
        ...template,
        value: template.id,
        label: templateLabel(template),
      })));
    });
  }, []);

  return (
    <div className="d-flex flex-column list-page-main p-3">
      <div className="buttonBar d-flex mb-3" style={{ gap: '0.5rem' }}>
        <a className="btn btn-outline-primary" href={`${REQUISITION_TEMPLATE_URL.base}/list`}>
          <Translate id="react.requisition.listStockLists.label" defaultMessage="List stock lists" />
        </a>
        <a className="btn btn-outline-primary" href={`${REQUISITION_TEMPLATE_URL.create()}?type=STOCK`}>
          <Translate id="react.requisition.addStockList.label" defaultMessage="Add stock list" />
        </a>
      </div>
      <div className="box p-3 border rounded bg-white">
        <h2>
          <Translate
            id="react.requisition.chooseTemplate.label"
            defaultMessage="Choose stock requisition template"
          />
        </h2>
        <div className="form-group row mt-3">
          <label htmlFor="requisitionTemplate" className="col-sm-3 col-form-label">
            <Translate id="react.requisition.template.label" defaultMessage="Stocklist" />
          </label>
          <div className="col-sm-9">
            <Select
              id="requisitionTemplate"
              name="requisitionTemplate"
              options={templates}
              onChange={(template) => {
                if (template?.id) {
                  history.push(REQUISITION_URL.createStockFromTemplate(template.id));
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

ChooseTemplatePage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

export default ChooseTemplatePage;
