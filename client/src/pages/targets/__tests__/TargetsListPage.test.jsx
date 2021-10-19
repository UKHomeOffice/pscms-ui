import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import TargetsListPage from '../TargetsListPage';
import { GroupsContext } from '../../../utils/GroupsContext';
import mockTargetListData from '../__fixtures__/mockTargetListData.json';
import mockTargetVariableData from '../__fixtures__/mockTargetVariableData.json';

// eslint-disable-next-line react/prop-types
const MockGroupContext = ({ children }) => (
  <GroupsContext.Provider
    value={{
      nonRoleGroups: [
        {
          code: 'COP_ADMIN',
          displayname: 'Border Systems - COP Admins',
          grouptypeid: 1,
        },
      ],
    }}
  >
    {children}
  </GroupsContext.Provider>
);
// eslint-disable-next-line react/prop-types
const MockMultipleGroupContext = ({ children }) => (
  <GroupsContext.Provider
    value={{
      nonRoleGroups: [
        {
          code: 'COP_ADMIN',
          displayname: 'Border Systems - COP Admins',
          grouptypeid: 1,
        },
        {
          code: 'Test_One',
          displayname: 'Test Group One',
          grouptypeid: 1,
        },
        {
          code: 'Test_Two',
          displayname: 'A second test group',
          grouptypeid: 1,
        },
      ],
    }}
  >
    {children}
  </GroupsContext.Provider>
);

describe('TargetInfoPage', () => {
  const mockAxios = new MockAdapter(axios);
  const mockAllCalls = () => {
    mockAxios.onPost('/camunda/engine-rest/task').reply(200, mockTargetListData);
    mockAxios.onPost('/camunda/engine-rest/task/count').reply(200, { count: 2 });
    mockAxios.onGet('/camunda/engine-rest/variable-instance').reply(200, mockTargetVariableData);
  };
  const mockListCalls = () => {
    mockAxios.onPost('/camunda/engine-rest/task').reply(200, mockTargetListData);
    mockAxios.onPost('/camunda/engine-rest/task/count').reply(200, { count: 2 });
  };

  beforeEach(() => {
    mockAxios.reset();
  });

  it('should show a count of the tasks displayed', async () => {
    mockAllCalls();
    await waitFor(() =>
      render(
        <MockGroupContext>
          <TargetsListPage />
        </MockGroupContext>
      )
    );
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
    expect(screen.getByText('2 targets')).toBeInTheDocument();
  });

  it('should show a list of target tasks', async () => {
    mockAllCalls();

    await waitFor(() =>
      render(
        <MockGroupContext>
          <TargetsListPage />
        </MockGroupContext>
      )
    );
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getAllByText('123 Test Port')).toHaveLength(2);
    expect(screen.getByText('Vessel')).toBeInTheDocument();
    expect(screen.getAllByText(/TEST VESSEL/i)).toHaveLength(2); // Vessel name
    expect(screen.getAllByText(/Test Company/i)).toHaveLength(2); // Company
    expect(screen.getByText('Due')).toBeInTheDocument();
    expect(screen.getByText('Mode')).toBeInTheDocument();
    expect(screen.getAllByText(/RoRo Freight/i)).toHaveLength(2);
    expect(screen.getAllByText(/accompanied/)).toHaveLength(2);
    expect(screen.getByText('Vehicle / Trailer registration')).toBeInTheDocument();
    expect(screen.getAllByText(/AB12 C3D/i)).toHaveLength(2);
    expect(screen.getAllByText(/AB12 CDE/i)).toHaveLength(2);
    expect(screen.getByText('Driver last name')).toBeInTheDocument();
    expect(screen.getAllByText('Smith')).toHaveLength(1);
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getAllByText('A')).toHaveLength(2);
    expect(screen.getByText('Warnings')).toBeInTheDocument();
    expect(screen.getByText('Jones')).toBeInTheDocument();
  });

  /*
   * to get individual group counts we map over the same /count call
   * this is not easily mocked so for now all will return the same total
   * group count
   */
  it('should render a list of my groups in alphabetical order with a count of targets', async () => {
    mockAllCalls();
    await waitFor(() => {
      render(
        <MockMultipleGroupContext>
          <TargetsListPage />
        </MockMultipleGroupContext>
      );
    });

    const select = screen.getByTestId('sorted-list');
    // eslint-disable-next-line prefer-destructuring
    const children = select.children;
    expect(children.item(0)?.textContent).toEqual('A second test group 2 targets');
    expect(children.item(1)?.textContent).toEqual('Border Systems - COP Admins 2 targets');
    expect(children.item(2)?.textContent).toEqual('Test Group One 2 targets');

    expect(mockAxios.history.post[0].data).toBe(
      JSON.stringify({
        sorting: [
          {
            sortBy: 'dueDate',
            sortOrder: 'asc',
          },
        ],
        taskDefinitionKey: 'actionTarget',
        orQueries: [
          {
            candidateGroups: ['COP_ADMIN', 'Test_One', 'Test_Two'],
            includeAssignedTasks: true,
          },
        ],
      })
    );
    expect(mockAxios.history.post[1].data).toBe(
      JSON.stringify({
        taskDefinitionKey: 'actionTarget',
        orQueries: [
          {
            candidateGroups: ['COP_ADMIN'],
            includeAssignedTasks: true,
          },
        ],
      })
    );
    expect(mockAxios.history.post[2].data).toBe(
      JSON.stringify({
        taskDefinitionKey: 'actionTarget',
        orQueries: [
          {
            candidateGroups: ['Test_One'],
            includeAssignedTasks: true,
          },
        ],
      })
    );
    expect(mockAxios.history.post[3].data).toBe(
      JSON.stringify({
        taskDefinitionKey: 'actionTarget',
        orQueries: [
          {
            candidateGroups: ['Test_Two'],
            includeAssignedTasks: true,
          },
        ],
      })
    );
  });

  it('should make the call to obtain tasks for the checked groups when filter applied', async () => {
    mockListCalls();
    await waitFor(() => {
      render(
        <MockMultipleGroupContext>
          <TargetsListPage />
        </MockMultipleGroupContext>
      );
    });

    const checkbox = screen.getByTestId('checkbox-Test_One');
    const applyButton = screen.getByText('pages.filters.apply');
    expect(checkbox.checked).toEqual(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toEqual(true);
    fireEvent.click(applyButton);

    await waitFor(() => {
      render(
        <MockMultipleGroupContext>
          <TargetsListPage />
        </MockMultipleGroupContext>
      );
    });

    expect(mockAxios.history.post[6].data).toBe(
      JSON.stringify({
        sorting: [
          {
            sortBy: 'dueDate',
            sortOrder: 'asc',
          },
        ],
        taskDefinitionKey: 'actionTarget',
        orQueries: [
          {
            candidateGroups: ['Test_One'],
            includeAssignedTasks: true,
          },
        ],
      })
    );

    // clear checkbox
    fireEvent.click(checkbox, { checked: false });
    expect(checkbox.checked).toEqual(false);
    fireEvent.click(applyButton);
  });

  it('should make the call to obtain tasks for the checked groups when filter updated', async () => {
    mockListCalls();
    await waitFor(() => {
      render(
        <MockMultipleGroupContext>
          <TargetsListPage />
        </MockMultipleGroupContext>
      );
    });

    const checkbox = screen.getByTestId('checkbox-Test_One');
    const checkbox2 = screen.getByTestId('checkbox-COP_ADMIN');
    const applyButton = screen.getByText('pages.filters.apply');
    expect(checkbox.checked).toEqual(false);
    expect(checkbox2.checked).toEqual(false);
    fireEvent.click(checkbox);
    fireEvent.click(checkbox2);
    expect(checkbox.checked).toEqual(true);
    expect(checkbox2.checked).toEqual(true);
    fireEvent.click(applyButton);

    await waitFor(() => {
      render(
        <MockMultipleGroupContext>
          <TargetsListPage />
        </MockMultipleGroupContext>
      );
    });

    expect(mockAxios.history.post[6].data).toBe(
      JSON.stringify({
        sorting: [
          {
            sortBy: 'dueDate',
            sortOrder: 'asc',
          },
        ],
        taskDefinitionKey: 'actionTarget',
        orQueries: [
          {
            candidateGroups: ['Test_One', 'COP_ADMIN'],
            includeAssignedTasks: true,
          },
        ],
      })
    );

    // clear checkbox
    fireEvent.click(checkbox, { checked: false });
    expect(checkbox.checked).toEqual(false);
    fireEvent.click(applyButton);

    await waitFor(() => {
      render(
        <MockMultipleGroupContext>
          <TargetsListPage />
        </MockMultipleGroupContext>
      );
    });

    expect(mockAxios.history.post[15].data).toBe(
      JSON.stringify({
        sorting: [
          {
            sortBy: 'dueDate',
            sortOrder: 'asc',
          },
        ],
        taskDefinitionKey: 'actionTarget',
        orQueries: [
          {
            candidateGroups: ['COP_ADMIN'],
            includeAssignedTasks: true,
          },
        ],
      })
    );

    // clear checkbox2
    fireEvent.click(checkbox2, { checked: false });
    expect(checkbox2.checked).toEqual(false);
    fireEvent.click(applyButton);
  });

  it('should make the call to obtain all tasks when filters cleared', async () => {
    mockListCalls();
    await waitFor(() => {
      render(
        <MockMultipleGroupContext>
          <TargetsListPage />
        </MockMultipleGroupContext>
      );
    });

    const checkbox = screen.getByTestId('checkbox-Test_One');
    const applyButton = screen.getByText('pages.filters.apply');
    const clearButton = screen.getByText('pages.filters.clear');
    expect(checkbox.checked).toEqual(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toEqual(true);
    fireEvent.click(applyButton);
    fireEvent.click(clearButton);
    expect(checkbox.checked).toEqual(false);

    await waitFor(() => {
      render(
        <MockMultipleGroupContext>
          <TargetsListPage />
        </MockMultipleGroupContext>
      );
    });

    expect(mockAxios.history.post[12].data).toBe(
      JSON.stringify({
        sorting: [
          {
            sortBy: 'dueDate',
            sortOrder: 'asc',
          },
        ],
        taskDefinitionKey: 'actionTarget',
        orQueries: [
          {
            candidateGroups: ['COP_ADMIN', 'Test_One', 'Test_Two'],
            includeAssignedTasks: true,
          },
        ],
      })
    );
  });
});
