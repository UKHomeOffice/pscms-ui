import React, { useContext, useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { TeamContext, TeamContextProvider } from './TeamContext';

describe('TeamContext', () => {
  it('sets its default value as expected', () => {
    const Consumer = () => {
      const { team, setTeam } = useContext(TeamContext);
      return `Default value: ${team} ${setTeam}`;
    };
    render(<Consumer />);
    expect(screen.getByText(/^Default/)).toHaveTextContent('null null');
  });

  it('can provide a custom value', () => {
    const Consumer = () => {
      const { team, setTeam } = useContext(TeamContext);
      return `Custom value: ${team} ${setTeam}`;
    };
    render(
      <TeamContextProvider>
        <Consumer />
      </TeamContextProvider>
    );
    expect(screen.getByText(/^Custom/)).toHaveTextContent('null function () { [native code] }');
  });

  it('can have its value updated', () => {
    const Consumer = () => {
      const { team, setTeam } = useContext(TeamContext);
      useEffect(() => {
        setTeam({
          branchid: '23',
        });
      }, []);
      return `Team branchid: ${team?.branchid}`;
    };
    render(
      <TeamContextProvider>
        <Consumer />
      </TeamContextProvider>
    );
    expect(screen.getByText(/branchid/)).toHaveTextContent('23');
  });
});
