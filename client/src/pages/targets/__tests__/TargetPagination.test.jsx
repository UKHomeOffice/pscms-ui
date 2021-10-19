import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TargetPagination from '../__components__/TargetPagination';

describe('TargetPagination', () => {
  const mockHandleOnPageChange = jest.fn();
  const mockUpdatePageNumber = jest.fn();
  window.scrollTo = jest.fn();

  it('should render without crashing', () => {
    render(
      <TargetPagination
        totalItems={79}
        itemsPerPage={10}
        activePage={1}
        handleOnPageChange={mockHandleOnPageChange}
        updatePageNumber={mockUpdatePageNumber}
      />
    );
  });

  it('should show the task numbers displayed and the total results', async () => {
    await waitFor(() =>
      render(
        <TargetPagination
          totalItems={79}
          itemsPerPage={10}
          activePage={1}
          handleOnPageChange={mockHandleOnPageChange}
          updatePageNumber={mockUpdatePageNumber}
        />
      )
    );
    expect(screen.getByText('Showing 1 - 10 of 79 results')).toBeInTheDocument();
  });

  it('should not show first and previous when on page 1, and it should only show five page links', async () => {
    await waitFor(() =>
      render(
        <TargetPagination
          totalItems={79}
          itemsPerPage={10}
          activePage={1}
          handleOnPageChange={mockHandleOnPageChange}
          updatePageNumber={mockUpdatePageNumber}
        />
      )
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('…')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Last')).toBeInTheDocument();
    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
  });

  it('should update the page when a pagelink is clicked', async () => {
    await waitFor(() =>
      render(
        <TargetPagination
          totalItems={79}
          itemsPerPage={10}
          activePage={1}
          handleOnPageChange={mockHandleOnPageChange}
          updatePageNumber={mockUpdatePageNumber}
        />
      )
    );

    fireEvent.click(screen.getByText('Next'));
    expect(mockHandleOnPageChange).toHaveBeenCalled();
    expect(mockUpdatePageNumber).toHaveBeenCalled();

    await waitFor(() =>
      render(
        <TargetPagination
          totalItems={79}
          itemsPerPage={10}
          activePage={2}
          handleOnPageChange={mockHandleOnPageChange}
          updatePageNumber={mockUpdatePageNumber}
        />
      )
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Showing 11 - 20 of 79 results')).toBeInTheDocument();
  });

  it('should not show first and previous when on the last page, and it should only show five page links', async () => {
    await waitFor(() =>
      render(
        <TargetPagination
          totalItems={79}
          itemsPerPage={10}
          activePage={8}
          handleOnPageChange={mockHandleOnPageChange}
          updatePageNumber={mockUpdatePageNumber}
        />
      )
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('…')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Showing 71 - 79 of 79 results')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
    expect(screen.queryByText('Last')).not.toBeInTheDocument();
  });
});
