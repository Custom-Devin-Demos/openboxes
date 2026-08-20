import moment from 'moment';

export const formatDate = (date, format = 'MM/DD/YYYY') => (date ? moment(date).format(format) : '');

export const formatDateTime = (date) => formatDate(date, 'MM/DD/YYYY HH:mm');

export default formatDate;
