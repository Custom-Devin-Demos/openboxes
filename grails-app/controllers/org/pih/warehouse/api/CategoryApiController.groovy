/**
 * Copyright (c) 2012 Partners In Health.  All rights reserved.
 * The use and distribution terms for this software are covered by the
 * Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
 * which can be found in the file epl-v10.html at the root of this distribution.
 * By using this software in any fashion, you are agreeing to be bound by
 * the terms of this license.
 * You must not remove this notice, or any other, from this software.
 **/
package org.pih.warehouse.api

import grails.converters.JSON
import grails.gorm.transactions.Transactional
import grails.validation.ValidationException
import org.hibernate.ObjectNotFoundException
import org.pih.warehouse.product.Category

@Transactional
class CategoryApiController {

    def productService
    def categoryService
    def categoryGormService

    def list() {
        log.debug "List products " + params
        def categories = productService.getCategoryTree()
        categories = categories.collect { it.toJson() }
        render([data: categories] as JSON)
    }

    def read() {
        Category category = Category.get(params.id)
        if (!category) {
            throw new ObjectNotFoundException(params.id, "Category")
        }
        render category.toJson() as JSON
    }

    def save() {
        log.debug "Save category " + params
        def category = Category.get(params.id)
        if (!category) {
            category = new Category(request.JSON)
        } else {
            category.properties = params
        }

        if (!category.hasErrors() && category.save()) {
            render category.toJson() as JSON
        } else {
            throw new ValidationException("Unable to save category due to errors", category.errors)
        }
    }

    def delete() {
        def category = Category.get(params.id)
        if (!category) {
            throw new ObjectNotFoundException(params.id, "Category")
        } else {
            category.delete(flush: true)
            render status: 204
        }
    }

    def details() {
        Category category = Category.get(params.id)
        if (!category) {
            throw new ObjectNotFoundException(params.id, "Category")
        }
        render([
                id            : category.id,
                name          : category.name,
                version       : category.version,
                sortOrder     : category.sortOrder,
                isRoot        : category.isRoot,
                parentCategory: category.parentCategory ? [
                        id  : category.parentCategory.id,
                        name: category.parentCategory.name,
                ] : null,
                categories    : category.categories ? category.categories.collect {
                    [id: it.id, name: it.name]
                } : [],
                products      : category.products ? category.products.collect {
                    [id: it.id, productCode: it.productCode, name: it.name]
                } : [],
        ] as JSON)
    }

    def treeData() {
        Category selectedCategory = (params.categoryId ? Category.get(params.categoryId) : null)
                ?: productService.getRootCategory()
        List<Category> categoriesWithoutParent = productService.getCategoriesWithoutParent()
        boolean assigningParentToProductEnabled = categoryService.isAssigningParentToProductEnabled()
        render([
                selectedCategory               : selectedCategory?.toJson(),
                categoriesWithoutParent        : categoriesWithoutParent.collect {
                    [id: it.id, name: it.name]
                },
                assigningParentToProductEnabled: assigningParentToProductEnabled,
        ] as JSON)
    }

    def move() {
        def data = request.JSON ?: params
        Category parent = Category.get(data.newParent)
        Category child = Category.get(data.child)
        if (!child) {
            throw new ObjectNotFoundException(data.child as String, "Category")
        }
        child.parentCategory = parent
        if (!child.hasErrors()) {
            categoryGormService.save(child)
            render([message: "${warehouse.message(code: 'default.success.message')}"] as JSON)
        } else {
            throw new ValidationException("Unable to move category due to errors", child.errors)
        }
    }

    def saveCategory() {
        def data = request.JSON ?: params
        Category categoryInstance = data.id ? Category.get(data.id) : null
        if (data.id && !categoryInstance) {
            throw new ObjectNotFoundException(data.id as String, "Category")
        }
        if (!categoryInstance) {
            categoryInstance = new Category()
        } else if (data.version != null) {
            def version = data.version.toString().toLong()
            if (categoryInstance.version > version) {
                categoryInstance.errors.rejectValue("version", "default.optimistic.locking.failure",
                        [warehouse.message(code: 'category.label', default: 'Category')] as Object[],
                        "Another user has updated this Category while you were editing")
                throw new ValidationException("Unable to save category due to errors", categoryInstance.errors)
            }
        }

        categoryInstance.name = data.name
        def parentCategoryId = data['parentCategory.id'] != null ? data['parentCategory.id'] : data.parentCategory?.id
        categoryInstance.parentCategory = (parentCategoryId && parentCategoryId != 'null') ?
                Category.get(parentCategoryId) : null
        if (data.containsKey("isRoot")) {
            categoryInstance.isRoot = data.isRoot as boolean
        }
        if (data.containsKey("sortOrder")) {
            categoryInstance.sortOrder = data.sortOrder ? data.sortOrder.toString().toInteger() : null
        }

        if (!categoryInstance.hasErrors()) {
            categoryGormService.save(categoryInstance)
            render([
                    id     : categoryInstance.id,
                    name   : categoryInstance.name,
                    message: "${warehouse.message(code: 'category.saved.message', args: [categoryInstance.name])}",
            ] as JSON)
        } else {
            throw new ValidationException("Unable to save category due to errors", categoryInstance.errors)
        }
    }

    def deleteCategory() {
        Category categoryInstance = categoryGormService.get(params.id)
        if (categoryInstance) {
            try {
                categoryGormService.delete(params.id)
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                response.status = 400
                render([
                        errorCode   : 400,
                        errorMessage: "${warehouse.message(code: 'default.not.deleted.message', args: [warehouse.message(code: 'category.label', default: 'Category'), params.id])}",
                ] as JSON)
                return
            }
        }
        render(status: 204)
    }

    def updateAssigningParentToProduct() {
        def data = request.JSON ?: params
        categoryService.updateAssigningParentToProduct(data.assigningParentToProductEnabled as boolean)
        render(status: 204)
    }
}
