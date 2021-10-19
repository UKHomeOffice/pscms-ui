import React from 'react';
import PropTypes from 'prop-types';

import './Pagination.scss';

// CONSTANTS
const PAGINATION_PIECE_FIRST = 'first';
const PAGINATION_PIECE_PREVIOUS = 'previous';
const PAGINATION_PIECE_ELLIPSIS = 'ellipsis';
const PAGINATION_PIECE_PAGE_NUMBER = 'page-number';
const PAGINATION_PIECE_NEXT = 'next';
const PAGINATION_PIECE_LAST = 'last';
const DEFAULT_MAX_PAGE_NUMBER_LINKS = 5;

const createPageLinks = (
  numberOfPages,
  activePage,
  maxPageNumbers = DEFAULT_MAX_PAGE_NUMBER_LINKS
) => {
  const pageLinks = [];
  let lowerLimit = activePage;
  let upperLimit = activePage;

  /* Pagination labelling
   * type: sets the visible text label
   * pageNumber calculates the related page number
   * isDisabled sets the condition when this link is not clickable
   * isActive sets the condition when this link is clickable
   */
  pageLinks.push({
    type: PAGINATION_PIECE_FIRST,
    pageNumber: 1,
    isDisabled: activePage === 1,
  });

  pageLinks.push({
    type: PAGINATION_PIECE_PREVIOUS,
    pageNumber: Math.max(1, activePage - 1),
    isDisabled: activePage === 1,
  });

  // Calculating the lowest & highest page numbers to show in the links
  for (let i = 1; i < maxPageNumbers && i < numberOfPages; ) {
    if (lowerLimit > 1) {
      lowerLimit -= 1;
      i += 1;
    }
    if (i < maxPageNumbers && upperLimit < numberOfPages) {
      upperLimit += 1;
      i += 1;
    }
  }

  if (lowerLimit > 1) {
    pageLinks.push({
      type: PAGINATION_PIECE_PAGE_NUMBER,
      pageNumber: 1,
      isActive: activePage === 1,
    });
    pageLinks.push({ type: PAGINATION_PIECE_ELLIPSIS });
  }

  for (let i = lowerLimit; i <= upperLimit; i += 1) {
    pageLinks.push({
      type: PAGINATION_PIECE_PAGE_NUMBER,
      pageNumber: i,
      isActive: activePage === i,
    });
  }

  if (activePage < numberOfPages - 2 && numberOfPages > maxPageNumbers) {
    pageLinks.push({ type: PAGINATION_PIECE_ELLIPSIS });
    pageLinks.push({
      type: PAGINATION_PIECE_PAGE_NUMBER,
      pageNumber: numberOfPages,
      isActive: activePage === numberOfPages,
    });
  }

  pageLinks.push({
    type: PAGINATION_PIECE_NEXT,
    pageNumber: Math.min(numberOfPages, activePage + 1),
    isDisabled: activePage === numberOfPages,
  });

  pageLinks.push({
    type: PAGINATION_PIECE_LAST,
    pageNumber: numberOfPages,
    isDisabled: activePage === numberOfPages,
  });

  return pageLinks;
};

/* Props to pass in for pagination
 * totalItems : total items to handle allows calculating of page numbers
 * itemsPerPage : sets number items to show on any one page
 * activePage : parent components active page number
 * handleOnPageChange : what parent component should do when a pagination link is clicked
 * updatePageNumber : passing page number back to parent component
 */

const TargetPagination = ({
  totalItems,
  itemsPerPage,
  activePage,
  handleOnPageChange,
  updatePageNumber,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const index = activePage - 1;
  const offset = index * itemsPerPage + 1;
  const limit = activePage * itemsPerPage;
  const pageLinks = createPageLinks(totalPages, activePage);

  const onPageClick = (e, pageClicked) => {
    let nextTasksToReturnIndex = 1;
    e.currentTarget.blur();
    if (pageClicked === 1) {
      nextTasksToReturnIndex = 0;
    } else {
      nextTasksToReturnIndex = pageClicked * itemsPerPage - itemsPerPage;
    }
    handleOnPageChange(nextTasksToReturnIndex);
    updatePageNumber(pageClicked);
    window.scrollTo(0, 0);
  };

  return (
    <nav className="pagination" aria-label={`pagination: total ${totalPages} pages`}>
      <div className="pagination--summary">
        <span>
          Showing {offset} - {limit <= totalItems ? limit : totalItems} of {totalItems} results
        </span>
      </div>

      <ul className="pagination--list govuk-!-margin-top-4 govuk-!-margin-bottom-4">
        {pageLinks.map(({ type, pageNumber, isActive, isDisabled }, i) => {
          const key = `${type}-${i}`;
          const isActiveClass = isActive ? 'pagination--link-active' : 'pagination--link';
          if (isDisabled) {
            return null;
          }

          return (
            <li
              className="
              pagination--list-item
              govuk-!-margin-right-4
              govuk-!-margin-bottom-1"
              key={key}
            >
              {type === PAGINATION_PIECE_FIRST && (
                <button
                  type="button"
                  role="link"
                  className="pagination--link"
                  data-test="first"
                  onClick={(e) => onPageClick(e, pageNumber)}
                >
                  <span aria-hidden="true" role="presentation">
                    «
                  </span>
                  &nbsp;First
                </button>
              )}

              {type === PAGINATION_PIECE_PREVIOUS && (
                <button
                  type="button"
                  role="link"
                  className="pagination--link"
                  data-test="prev"
                  onClick={(e) => onPageClick(e, pageNumber)}
                >
                  Previous
                </button>
              )}

              {type === PAGINATION_PIECE_ELLIPSIS && (
                <span className="pagination--ellipsis" data-test="ellipsis">
                  …
                </span>
              )}

              {type === PAGINATION_PIECE_PAGE_NUMBER && (
                <button
                  type="button"
                  role="link"
                  className={isActiveClass}
                  data-test={isActive ? 'page-number-active' : 'page-number'}
                  onClick={(e) => onPageClick(e, pageNumber)}
                >
                  {pageNumber}
                </button>
              )}

              {type === PAGINATION_PIECE_NEXT && (
                <button
                  type="button"
                  role="link"
                  className="pagination--link"
                  data-test="next"
                  onClick={(e) => onPageClick(e, pageNumber)}
                >
                  Next
                </button>
              )}

              {type === PAGINATION_PIECE_LAST && (
                <button
                  type="button"
                  role="link"
                  className="pagination--link"
                  data-test="last"
                  onClick={(e) => onPageClick(e, pageNumber)}
                >
                  Last&nbsp;
                  <span aria-hidden="true" role="presentation">
                    »
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

TargetPagination.propTypes = {
  totalItems: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  activePage: PropTypes.number.isRequired,
  handleOnPageChange: PropTypes.func.isRequired,
  updatePageNumber: PropTypes.func.isRequired,
};

export default TargetPagination;
