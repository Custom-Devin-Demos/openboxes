import React, { useEffect, useState } from 'react';

import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { RiAddLine, RiCloseLine } from 'react-icons/ri';
import { useHistory, useParams } from 'react-router-dom';

import attributeApi from 'api/services/AttributeApi';
import Button from 'components/form-elements/Button';
import Checkbox from 'components/form-elements/v2/Checkbox';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { ATTRIBUTE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import RoleType from 'consts/roleType';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import useUserHasPermissions from 'hooks/useUserHasPermissions';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ENTITY_TYPE_CODES = ['PRODUCT', 'PRODUCT_SUPPLIER'];

const AttributeForm = () => {
  useTranslation('attribute', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [uomClassOptions, setUomClassOptions] = useState([]);
  const [version, setVersion] = useState(null);

  const isUserAdmin = useUserHasPermissions({
    minRequiredRole: RoleType.ROLE_ADMIN,
  });

  const {
    control,
    handleSubmit,
    reset,
    getValues,
  } = useForm({
    defaultValues: {
      entityTypeCode: null,
      code: '',
      name: '',
      description: '',
      unitOfMeasureClass: null,
      options: [],
      active: true,
      required: false,
      allowOther: false,
    },
  });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
    insert: insertOption,
  } = useFieldArray({ control, name: 'options' });

  const entityTypeOptions = ENTITY_TYPE_CODES.map((code) => ({
    id: code,
    value: code,
    label: translate({
      id: `react.attribute.entityTypeCode.${code}.label`,
      defaultMessage: code,
    }),
  }));

  useEffect(() => {
    attributeApi.getUnitOfMeasureClassOptions()
      .then((response) => {
        setUomClassOptions((response.data?.data ?? []).map((option) => ({
          ...option,
          value: option.id,
        })));
      });
  }, []);

  useEffect(() => {
    if (id) {
      spinner.show();
      attributeApi.getAttribute(id)
        .then((response) => {
          const attribute = response.data;
          setVersion(attribute.version);
          reset({
            entityTypeCode: attribute.entityTypeCode ? {
              id: attribute.entityTypeCode,
              value: attribute.entityTypeCode,
              label: translate({
                id: `react.attribute.entityTypeCode.${attribute.entityTypeCode}.label`,
                defaultMessage: attribute.entityTypeCode,
              }),
            } : null,
            code: attribute.code ?? '',
            name: attribute.name ?? '',
            description: attribute.description ?? '',
            unitOfMeasureClass: attribute.unitOfMeasureClass ? {
              id: attribute.unitOfMeasureClass.id,
              value: attribute.unitOfMeasureClass.id,
              label: attribute.unitOfMeasureClass.name,
            } : null,
            options: (attribute.options ?? []).map((option) => ({ value: option })),
            active: Boolean(attribute.active),
            required: Boolean(attribute.required),
            allowOther: Boolean(attribute.allowOther),
          });
        })
        .catch(() => history.push(ATTRIBUTE_URL.list()))
        .finally(() => spinner.hide());
    }
  }, [id]);

  const onSubmit = async (values) => {
    const payload = {
      entityTypeCode: values.entityTypeCode?.id ?? '',
      code: values.code,
      name: values.name,
      description: values.description,
      unitOfMeasureClass: { id: values.unitOfMeasureClass?.id ?? '' },
      option: values.options.map((option) => option.value),
      active: values.active,
      required: values.required,
      allowOther: values.allowOther,
      version,
    };
    spinner.show();
    try {
      const response = id
        ? await attributeApi.updateAttribute(id, payload)
        : await attributeApi.createAttribute(payload);
      const savedId = response.data?.id;
      notification(NotificationType.SUCCESS)({
        message: translate({
          id: 'react.attribute.saved.label',
          defaultMessage: `Attribute ${savedId} saved`,
          data: { id: savedId },
        }),
      });
      history.push(ATTRIBUTE_URL.edit(savedId));
    } finally {
      spinner.hide();
    }
  };

  const deleteAttribute = async (onClose) => {
    try {
      await attributeApi.deleteAttribute(id);
      notification(NotificationType.SUCCESS)({
        message: translate({
          id: 'react.attribute.deleted.label',
          defaultMessage: `Attribute ${id} deleted`,
          data: { id },
        }),
      });
      history.push(ATTRIBUTE_URL.list());
    } finally {
      onClose?.();
    }
  };

  const deleteConfirmationModalButtons = (onClose) => ([
    {
      variant: 'transparent',
      defaultLabel: 'Cancel',
      label: 'react.default.button.cancel.label',
      onClick: onClose,
    },
    {
      variant: 'danger',
      defaultLabel: 'Delete',
      label: 'react.default.button.delete.label',
      onClick: () => deleteAttribute(onClose),
    },
  ]);

  const openDeleteConfirmationModal = () => {
    confirmationModal({
      buttons: deleteConfirmationModalButtons,
      title: {
        label: 'react.attribute.deleteConfirmation.title.label',
        default: 'Are you sure?',
      },
      content: {
        label: 'react.attribute.deleteConfirmation.content.label',
        default: 'Are you sure you want to delete this Attribute?',
      },
    });
  };

  const onOptionPaste = (index) => (event) => {
    event.preventDefault();
    const pasteData = event.clipboardData.getData('text');
    const lines = pasteData.split(/\r\n|\r|\n/).filter((line) => line !== '');
    lines.forEach((line, lineIndex) => {
      insertOption(index + 1 + lineIndex, { value: line });
    });
    // Remove blank options after pasting multiple lines
    const currentOptions = getValues('options');
    if (currentOptions[index]?.value === '') {
      removeOption(index);
    }
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={id
          ? { id: 'react.attribute.editAttribute.label', defaultMessage: 'Edit Attribute' }
          : { id: 'react.attribute.createAttribute.header.label', defaultMessage: 'Create Attribute' }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.attribute.listAttributes.label"
            defaultLabel="List attributes"
            variant="secondary"
            onClick={() => history.push(ATTRIBUTE_URL.list())}
          />
          {isUserAdmin && (
            <Button
              label="react.attribute.createAttribute.label"
              defaultLabel="Add attribute"
              onClick={() => history.push(ATTRIBUTE_URL.create())}
            />
          )}
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <form className="p-3 w-50" onSubmit={handleSubmit(onSubmit)}>
        <div className="pt-2">
          <Controller
            name="entityTypeCode"
            control={control}
            render={({ field }) => (
              <SelectField
                title={{ id: 'react.attribute.entityTypeCode.label', defaultMessage: 'Entity Type' }}
                options={entityTypeOptions}
                {...field}
                value={entityTypeOptions.find((option) =>
                  option.id === field.value?.id) ?? field.value}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <TextInput
                title={{ id: 'react.attribute.code.label', defaultMessage: 'Code' }}
                placeholder="Unique code used to identify attribute (e.g. COLOR)"
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextInput
                title={{ id: 'react.attribute.name.label', defaultMessage: 'Name' }}
                placeholder="Display Name (e.g. Color)"
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextInput
                title={{ id: 'react.attribute.description.label', defaultMessage: 'Description' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="unitOfMeasureClass"
            control={control}
            render={({ field }) => (
              <SelectField
                title={{ id: 'react.attribute.unitOfMeasureClass.label', defaultMessage: 'Unit of Measure Class' }}
                options={uomClassOptions}
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <span className="font-weight-bold">
            {translate({ id: 'react.attribute.options.label', defaultMessage: 'Options' })}
          </span>
          {optionFields.map((optionField, index) => (
            <div className="d-flex align-items-center pt-1" key={optionField.id}>
              <Controller
                name={`options.${index}.value`}
                control={control}
                render={({ field }) => (
                  <TextInput
                    hideErrorMessageWrapper
                    ariaLabel="option"
                    {...field}
                    onPaste={onOptionPaste(index)}
                  />
                )}
              />
              <Button
                variant="transparent"
                type="button"
                label="react.default.button.delete.label"
                defaultLabel="Delete"
                StartIcon={<RiCloseLine />}
                onClick={() => removeOption(index)}
              />
            </div>
          ))}
          <div className="pt-1">
            <Button
              variant="secondary"
              type="button"
              label="react.attribute.addOption.label"
              defaultLabel="Add another option"
              StartIcon={<RiAddLine />}
              onClick={() => appendOption({ value: '' })}
            />
          </div>
        </div>
        <div className="pt-2">
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <Checkbox
                title={{ id: 'react.attribute.active.label', defaultMessage: 'Active' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="required"
            control={control}
            render={({ field }) => (
              <Checkbox
                title={{ id: 'react.attribute.required.label', defaultMessage: 'Required' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="allowOther"
            control={control}
            render={({ field }) => (
              <Checkbox
                title={{ id: 'react.attribute.allowOther.label', defaultMessage: 'Allow Free-Text' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="d-flex pt-3">
          <Button
            type="submit"
            label="react.default.button.save.label"
            defaultLabel="Save"
          />
          {id && (
            <Button
              type="button"
              variant="danger"
              label="react.default.button.delete.label"
              defaultLabel="Delete"
              onClick={openDeleteConfirmationModal}
            />
          )}
          <Button
            type="button"
            variant="transparent"
            label="react.default.button.cancel.label"
            defaultLabel="Cancel"
            onClick={() => history.push(ATTRIBUTE_URL.list())}
          />
        </div>
      </form>
    </PageWrapper>
  );
};

export default AttributeForm;
