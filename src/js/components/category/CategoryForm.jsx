import React, { useEffect, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';
import { useHistory, useParams } from 'react-router-dom';

import categoryApi from 'api/services/CategoryApi';
import Button from 'components/form-elements/Button';
import Checkbox from 'components/form-elements/v2/Checkbox';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { CATEGORY_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import RoleType from 'consts/roleType';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import useUserHasPermissions from 'hooks/useUserHasPermissions';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const CategoryForm = () => {
  useTranslation('category', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoryDetails, setCategoryDetails] = useState(null);

  const isUserAdmin = useUserHasPermissions({
    minRequiredRole: RoleType.ROLE_ADMIN,
  });

  const {
    control,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      parentCategory: null,
      name: '',
      isRoot: false,
      sortOrder: '',
    },
  });

  useEffect(() => {
    categoryApi.getCategoryOptions()
      .then((response) => {
        setCategoryOptions((response.data?.data ?? []).map((option) => ({
          ...option,
          value: option.id,
        })));
      });
  }, []);

  useEffect(() => {
    if (id) {
      spinner.show();
      categoryApi.getCategoryDetails(id)
        .then((response) => {
          const category = response.data;
          setCategoryDetails(category);
          reset({
            parentCategory: category.parentCategory ? {
              id: category.parentCategory.id,
              value: category.parentCategory.id,
              label: category.parentCategory.name,
            } : null,
            name: category.name ?? '',
            isRoot: Boolean(category.isRoot),
            sortOrder: category.sortOrder ?? '',
          });
        })
        .catch(() => history.push(CATEGORY_URL.tree()))
        .finally(() => spinner.hide());
    }
  }, [id]);

  const onSubmit = async (values) => {
    const payload = {
      id: id ?? null,
      name: values.name,
      'parentCategory.id': values.parentCategory?.id ?? 'null',
      version: categoryDetails?.version,
      ...(id ? { isRoot: values.isRoot, sortOrder: values.sortOrder } : {}),
    };
    spinner.show();
    try {
      const response = await categoryApi.saveCategory(payload);
      notification(NotificationType.SUCCESS)({
        message: response.data?.message ?? translate({
          id: 'react.category.saved.label',
          defaultMessage: 'Category saved',
        }),
      });
      history.push(CATEGORY_URL.tree(response.data?.id));
    } finally {
      spinner.hide();
    }
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={id
          ? { id: 'react.category.editCategory.label', defaultMessage: 'Edit Category' }
          : { id: 'react.category.createCategory.label', defaultMessage: 'Add Category' }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.category.manageCategories.label"
            defaultLabel="Manage Categories"
            variant="secondary"
            onClick={() => history.push(CATEGORY_URL.tree())}
          />
          {isUserAdmin && (
            <Button
              label="react.category.createCategory.label"
              defaultLabel="Add Category"
              onClick={() => history.push(CATEGORY_URL.create())}
            />
          )}
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <form className="p-3 w-50" onSubmit={handleSubmit(onSubmit)}>
        <div className="pt-2">
          <Controller
            name="parentCategory"
            control={control}
            render={({ field }) => (
              <SelectField
                title={{ id: 'react.category.parentCategory.label', defaultMessage: 'Parent' }}
                options={categoryOptions}
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
                title={{ id: 'react.category.name.label', defaultMessage: 'Name' }}
                {...field}
              />
            )}
          />
        </div>
        {id && categoryDetails && (
          <div className="pt-3">
            <div className="pt-2">
              <Controller
                name="isRoot"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    title={{ id: 'react.category.isRoot.label', defaultMessage: 'Is root node?' }}
                    {...field}
                  />
                )}
              />
            </div>
            <div className="pt-2">
              <Controller
                name="sortOrder"
                control={control}
                render={({ field }) => (
                  <TextInput
                    title={{ id: 'react.category.sortOrder.label', defaultMessage: 'Sort order' }}
                    {...field}
                  />
                )}
              />
            </div>
            <div className="pt-2">
              <span className="font-weight-bold">
                {translate({ id: 'react.category.children.label', defaultMessage: 'Children' })}
              </span>
              <ul>
                {(categoryDetails.categories ?? []).map((child) => (
                  <li key={child.id}>
                    <a href={CATEGORY_URL.edit(child.id)}>{child.name}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-2">
              <span className="font-weight-bold">
                {translate({ id: 'react.category.products.label', defaultMessage: 'Products' })}
              </span>
              <ul>
                {(categoryDetails.products ?? []).map((product) => (
                  <li key={product.id}>
                    {product.productCode}
                    {' '}
                    {product.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div className="d-flex pt-3">
          <Button
            type="submit"
            label={id ? 'react.default.button.save.label' : 'react.default.button.create.label'}
            defaultLabel={id ? 'Save' : 'Create'}
          />
          <Button
            type="button"
            variant="transparent"
            label="react.default.button.cancel.label"
            defaultLabel="Cancel"
            onClick={() => history.push(CATEGORY_URL.tree())}
          />
        </div>
      </form>
    </PageWrapper>
  );
};

export default CategoryForm;
