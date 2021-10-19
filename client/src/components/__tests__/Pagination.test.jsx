import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Pagination from '../Pagination';

describe('Pagination', () => {
  const mockSetPage = jest.fn();
  window.scrollTo = jest.fn();

  it('can render without error', () => {
    render(<Pagination setPage={mockSetPage} page={0} maxResults={10} taskCount={100} />);
  });

  it('can disable pagination buttons', () => {
    // On first page with 10 results per page and 100 tasks overall
    const { rerender } = render(
      <Pagination setPage={mockSetPage} page={0} maxResults={10} taskCount={100} />
    );

    fireEvent.click(screen.getByText('« First'));

    expect(mockSetPage).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('‹ Previous'));

    expect(mockSetPage).not.toHaveBeenCalled();

    // On last page with 10 results per page and 100 tasks overall
    rerender(<Pagination setPage={mockSetPage} page={90} maxResults={10} taskCount={100} />);

    fireEvent.click(screen.getByText('Next ›'));

    expect(mockSetPage).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Last »'));

    expect(mockSetPage).not.toHaveBeenCalled();
  });

  it('can click on pagination buttons successfully', () => {
    const { rerender } = render(
      <Pagination setPage={mockSetPage} page={0} maxResults={10} taskCount={100} />
    );

    fireEvent.click(screen.getByText('Next ›'));

    expect(mockSetPage).toHaveBeenCalled();

    // Need to clear mockSetPage to prevent each time to prevent false positives
    mockSetPage.mockClear();
    fireEvent.click(screen.getByText('Last »'));

    expect(mockSetPage).toHaveBeenCalled();

    rerender(<Pagination setPage={mockSetPage} page={90} maxResults={10} taskCount={100} />);

    mockSetPage.mockClear();
    fireEvent.click(screen.getByText('« First'));

    expect(mockSetPage).toHaveBeenCalled();

    mockSetPage.mockClear();
    fireEvent.click(screen.getByText('‹ Previous'));

    expect(mockSetPage).toHaveBeenCalled();
  });
});
