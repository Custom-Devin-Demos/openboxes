import React, { useCallback, useEffect, useState } from 'react';

import { RiDeleteBinLine, RiPencilLine } from 'react-icons/ri';
import { useHistory } from 'react-router-dom';

import categoryApi from 'api/services/CategoryApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { CATEGORY_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import RoleType from 'consts/roleType';
import useQueryParams from 'hooks/useQueryParams';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import useUserHasPermissions from 'hooks/useUserHasPermissions';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const CategoryTree = () => {
  useTranslation('category', 'default');
  const history = useHistory();
  const spinner = useSpinner();
  const { id: selectedCategoryId } = useQueryParams();
  const [treeData, setTreeData] = useState(null);
  const [draggedCategoryId, setDraggedCategoryId] = useState(null);

  const isUserAdmin = useUserHasPermissions({
    minRequiredRole: RoleType.ROLE_ADMIN,
  });
  const isUserSuperuser = useUserHasPermissions({
    minRequiredRole: RoleType.ROLE_SUPERUSER,
  });

  const fetchTree = useCallback(() => {
    spinner.show();
    categoryApi.getTree({ params: { categoryId: selectedCategoryId } })
      .then((response) => setTreeData(response.data))
      .finally(() => spinner.hide());
  }, [selectedCategoryId]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const deleteCategory = async (onClose, categoryId) => {
    try {
      await categoryApi.deleteCategory(categoryId);
      notification(NotificationType.SUCCESS)({
        message: translate({
          id: 'react.category.deleted.label',
          defaultMessage: 'Category deleted',
        }),
      });
      fetchTree();
    } finally {
      onClose?.();
    }
  };

  const deleteConfirmationModalButtons = (categoryId) => (onClose) => ([
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
      onClick: () => deleteCategory(onClose, categoryId),
    },
  ]);

  const openDeleteConfirmationModal = (categoryId) => {
    confirmationModal({
      buttons: deleteConfirmationModalButtons(categoryId),
      title: {
        label: 'react.category.deleteConfirmation.title.label',
        default: 'Are you sure?',
      },
      content: {
        label: 'react.category.deleteConfirmation.content.label',
        default: 'Are you sure you want to delete this Category?',
      },
    });
  };

  const moveCategory = async (childId, newParentId) => {
    if (!childId || childId === newParentId) {
      return;
    }
    spinner.show();
    try {
      const response = await categoryApi.moveCategory({
        child: childId,
        newParent: newParentId,
      });
      notification(NotificationType.SUCCESS)({
        message: response.data?.message ?? translate({
          id: 'react.default.success.label',
          defaultMessage: 'Success',
        }),
      });
      fetchTree();
    } finally {
      spinner.hide();
    }
  };

  const toggleAssigningParentToProduct = async () => {
    spinner.show();
    try {
      await categoryApi.updateAssigningParentToProduct({
        assigningParentToProductEnabled: !treeData?.assigningParentToProductEnabled,
      });
      fetchTree();
    } finally {
      spinner.hide();
    }
  };

  const renderTreeNode = (category) => (
    <li key={category.id}>
      <div
        className="d-flex align-items-center gap-8 py-1"
        draggable
        onDragStart={(event) => {
          event.stopPropagation();
          setDraggedCategoryId(category.id);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          moveCategory(draggedCategoryId, category.id);
        }}
      >
        <span>{category.name}</span>
        <a href={CATEGORY_URL.edit(category.id)} aria-label="Edit category">
          <RiPencilLine />
        </a>
        <button
          type="button"
          className="btn btn-link p-0"
          aria-label="Delete category"
          onClick={() => openDeleteConfirmationModal(category.id)}
        >
          <RiDeleteBinLine />
        </button>
      </div>
      {category.categories?.length > 0 && (
        <ul>
          {category.categories.map((child) => renderTreeNode(child))}
        </ul>
      )}
    </li>
  );

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.category.manageCategories.label',
          defaultMessage: 'Manage Categories',
        }}
        />
        <HeaderButtonsWrapper>
          {isUserSuperuser && (
            <Button
              variant="secondary"
              label={treeData?.assigningParentToProductEnabled
                ? 'react.category.disableAssigningParentCategoryToProduct.label'
                : 'react.category.enableAssigningParentCategoryToProduct.label'}
              defaultLabel={treeData?.assigningParentToProductEnabled
                ? 'Disable assigning parent category to product'
                : 'Enable assigning parent category to product'}
              onClick={toggleAssigningParentToProduct}
            />
          )}
          {isUserAdmin && (
            <Button
              label="react.category.createCategory.label"
              defaultLabel="Add Category"
              onClick={() => history.push(CATEGORY_URL.create())}
            />
          )}
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <div className="p-3">
        <div className="d-flex flex-column w-25">
          <label htmlFor="root-category-select">
            {translate({ id: 'react.category.rootCategory.label', defaultMessage: 'Root Category' })}
          </label>
          <select
            id="root-category-select"
            className="form-control"
            value={selectedCategoryId ?? treeData?.selectedCategory?.id ?? ''}
            onChange={(event) => history.push(CATEGORY_URL.tree(event.target.value))}
          >
            {(treeData?.categoriesWithoutParent ?? []).map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        {treeData?.selectedCategory && (
          <ul className="pt-3 list-unstyled">
            {renderTreeNode(treeData.selectedCategory)}
          </ul>
        )}
      </div>
    </PageWrapper>
  );
};

export default CategoryTree;
