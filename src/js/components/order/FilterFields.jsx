import DateFilter from 'components/form-elements/DateFilter/DateFilter';
import FilterSelectField from 'components/form-elements/FilterSelectField';

export default {
  orderType: {
    type: FilterSelectField,
    attributes: {
      valueKey: 'value',
      filterElement: true,
      disabled: true,
      placeholder: 'react.order.filters.orderType.placeholder.label',
      defaultPlaceholder: 'Order Type',
      showLabelTooltip: true,
    },
    getDynamicAttr: ({ orderTypes }) => ({
      options: orderTypes,
    }),
  },
  status: {
    type: FilterSelectField,
    attributes: {
      valueKey: 'value',
      filterElement: true,
      placeholder: 'react.order.filters.status.placeholder.label',
      defaultPlaceholder: 'Status',
      showLabelTooltip: true,
    },
    getDynamicAttr: ({ statuses }) => ({
      options: statuses,
    }),
  },
  origin: {
    type: FilterSelectField,
    attributes: {
      async: true,
      openOnClick: false,
      autoload: false,
      cache: false,
      valueKey: 'id',
      labelKey: 'name',
      options: [],
      filterOptions: (options) => options,
      filterElement: true,
      placeholder: 'react.order.filters.origin.placeholder.label',
      defaultPlaceholder: 'Origin',
      showLabelTooltip: true,
    },
    getDynamicAttr: ({
      debouncedOriginLocationsFetch,
    }) => ({
      loadOptions: debouncedOriginLocationsFetch,
    }),
  },
  destination: {
    type: FilterSelectField,
    attributes: {
      async: true,
      openOnClick: false,
      autoload: false,
      cache: false,
      valueKey: 'id',
      labelKey: 'name',
      options: [],
      filterOptions: (options) => options,
      filterElement: true,
      placeholder: 'react.order.filters.destination.placeholder.label',
      defaultPlaceholder: 'Destination',
      showLabelTooltip: true,
    },
    getDynamicAttr: ({
      debouncedDestinationLocationsFetch,
    }) => ({
      loadOptions: debouncedDestinationLocationsFetch,
    }),
  },
  destinationParty: {
    type: FilterSelectField,
    attributes: {
      valueKey: 'id',
      filterElement: true,
      placeholder: 'react.order.filters.destinationParty.placeholder.label',
      defaultPlaceholder: 'Destination party',
      showLabelTooltip: true,
    },
    getDynamicAttr: ({ buyers, isCentralPurchasingEnabled }) => ({
      options: buyers,
      disabled: isCentralPurchasingEnabled,
    }),
  },
  orderedBy: {
    type: FilterSelectField,
    attributes: {
      async: true,
      openOnClick: false,
      autoload: false,
      cache: false,
      valueKey: 'id',
      labelKey: 'name',
      options: [],
      filterOptions: (options) => options,
      filterElement: true,
      placeholder: 'react.order.filters.orderedBy.placeholder.label',
      defaultPlaceholder: 'Ordered by',
      showLabelTooltip: true,
    },
    getDynamicAttr: ({
      debouncedPeopleFetch,
    }) => ({
      loadOptions: debouncedPeopleFetch,
    }),
  },
  createdBy: {
    type: FilterSelectField,
    attributes: {
      async: true,
      openOnClick: false,
      autoload: false,
      cache: false,
      valueKey: 'id',
      labelKey: 'name',
      options: [],
      filterOptions: (options) => options,
      filterElement: true,
      placeholder: 'react.order.filters.createdBy.placeholder.label',
      defaultPlaceholder: 'Created by',
      showLabelTooltip: true,
    },
    getDynamicAttr: ({
      debouncedPeopleFetch,
    }) => ({
      loadOptions: debouncedPeopleFetch,
    }),
  },
  statusStartDate: {
    type: DateFilter,
    attributes: {
      label: 'react.order.lastUpdateAfter.label',
      defaultMessage: 'Last updated after',
      dateFormat: 'MM/DD/YYYY',
      filterElement: true,
    },
  },
  statusEndDate: {
    type: DateFilter,
    attributes: {
      label: 'react.order.lastUpdateBefore.label',
      defaultMessage: 'Last updated before',
      dateFormat: 'MM/DD/YYYY',
      filterElement: true,
    },
  },
};
