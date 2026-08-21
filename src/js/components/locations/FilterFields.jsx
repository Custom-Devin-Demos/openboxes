import FilterSelectField from 'components/form-elements/FilterSelectField';

export default {
  organization: {
    type: FilterSelectField,
    attributes: {
      valueKey: 'id',
      filterElement: true,
      placeholder: 'react.locationsList.filters.organization.label',
      defaultPlaceholder: 'Organization',
      showLabelTooltip: true,
    },
    getDynamicAttr: ({ organizations }) => ({
      options: organizations,
    }),
  },
  locationType: {
    type: FilterSelectField,
    attributes: {
      valueKey: 'id',
      filterElement: true,
      placeholder: 'react.locationsList.filters.locationType.label',
      defaultPlaceholder: 'Location Type',
      showLabelTooltip: true,
    },
    getDynamicAttr: ({ locationTypes }) => ({
      options: locationTypes,
    }),
  },
  locationGroup: {
    type: FilterSelectField,
    attributes: {
      valueKey: 'id',
      filterElement: true,
      placeholder: 'react.locationsList.filters.locationGroup.label',
      defaultPlaceholder: 'Location Group',
      showLabelTooltip: true,
    },
    getDynamicAttr: ({ locationGroups }) => ({
      options: locationGroups,
    }),
  },
};
