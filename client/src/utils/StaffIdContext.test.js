import React, { useContext, useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { StaffIdContext, StaffIdContextProvider } from './StaffIdContext';

describe('StaffIdContext', () => {
  it('sets its default value as expected', () => {
    const Consumer = () => {
      const { staffId, setStaffId } = useContext(StaffIdContext);
      return `Default value: ${staffId} ${setStaffId}`;
    };
    render(<Consumer />);
    expect(screen.getByText(/^Default/)).toHaveTextContent('null null');
  });

  it('can provide a custom value', () => {
    const Consumer = () => {
      const { staffId, setStaffId } = useContext(StaffIdContext);
      return `Custom value: ${staffId} ${setStaffId}`;
    };
    render(
      <StaffIdContextProvider>
        <Consumer />
      </StaffIdContextProvider>
    );
    expect(screen.getByText(/^Custom/)).toHaveTextContent('null function () { [native code] }');
  });

  it('can have its value updated', () => {
    const Consumer = () => {
      const { staffId, setStaffId } = useContext(StaffIdContext);
      useEffect(() => {
        setStaffId('1234');
      }, []);
      return `Updated value: ${staffId}`;
    };
    render(
      <StaffIdContextProvider>
        <Consumer />
      </StaffIdContextProvider>
    );
    expect(screen.getByText(/^Updated/)).toHaveTextContent('1234');
  });
});
