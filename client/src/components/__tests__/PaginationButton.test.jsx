import React from 'react';
import { render } from '@testing-library/react';
import PaginationButton from '../PaginationButton';

describe('PaginationButton', () => {
  const mockSetPage = jest.fn();
  it('can render without error', () => {
    render(
      <PaginationButton
        isButtonDisabled={false}
        setPage={mockSetPage}
        newPageValue={20}
        text="test"
      />
    );
  });
});
