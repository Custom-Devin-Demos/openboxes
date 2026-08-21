import React from 'react';

import PropTypes from 'prop-types';

import Translate from 'utils/Translate';

const MobilePagination = ({
  offset, max, totalCount, onPageChange,
}) => {
  const totalPages = Math.ceil(totalCount / max);
  const currentPage = Math.floor(offset / max);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="paginateButtons d-flex gap-8 p-2">
      <button
        type="button"
        className="btn btn-outline-primary btn-sm"
        disabled={currentPage === 0}
        onClick={() => onPageChange((currentPage - 1) * max)}
      >
        <Translate id="react.default.button.previous.label" defaultMessage="Previous" />
      </button>
      {Array.from({ length: totalPages }, (_, page) => (
        <button
          type="button"
          // eslint-disable-next-line react/no-array-index-key
          key={page}
          className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => onPageChange(page * max)}
        >
          {page + 1}
        </button>
      ))}
      <button
        type="button"
        className="btn btn-outline-primary btn-sm"
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange((currentPage + 1) * max)}
      >
        <Translate id="react.default.button.next.label" defaultMessage="Next" />
      </button>
    </div>
  );
};

MobilePagination.propTypes = {
  offset: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default MobilePagination;
