import React from 'react';
import { shallow, mount } from 'enzyme';
import { render, screen, waitFor, fireEvent, queryByAttribute } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ApplicationSpinner from '../../../components/ApplicationSpinner';
import { CurrentGroupContext } from '../../../utils/CurrentGroupContext';
import TasksListPage from '../TasksListPage';

dayjs.extend(relativeTime);

// eslint-disable-next-line react/prop-types
const MockGroupContext = ({ children }) => (
  <CurrentGroupContext.Provider
    value={{
      currentGroup: {
        displayname: 'Test group',
        code: 'test',
      },
      groupLoaded: true,
      setCurrentGroup: () => {},
      setGroupLoaded: () => {},
    }}
  >
    {children}
  </CurrentGroupContext.Provider>
);

function createMockData(length) {
  const mockData = [];
  for (let i = 0; i < length; i += 1) {
    mockData.push({
      id: `id${Math.random() + Math.random()}`,
      name: 'test-name',
      processDefinitionId: 'processDefinitionId0',
      processInstanceId: 'processInstanceId0',
      due: dayjs().add(i, 'day').format(),
      created: dayjs().subtract(i, 'day').format(),
      assignee: 'john@doe.com',
      priority: 100,
    });
  }
  return mockData;
}

describe('TasksListPage', () => {
  const mockAxios = new MockAdapter(axios);
  const getById = queryByAttribute.bind(null, 'id');

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAxios.reset();
  });

  it('should render without crashing', () => {
    shallow(
      <MockGroupContext>
        <TasksListPage />
      </MockGroupContext>
    );
  });

  it('should render application spinner when getting data', async () => {
    const wrapper = await mount(
      <MockGroupContext>
        <TasksListPage />
      </MockGroupContext>
    );

    expect(wrapper.find(ApplicationSpinner).exists()).toBe(true);
  });

  it('should render a list of tasks', async () => {
    mockAxios.onPost('/camunda/engine-rest/task').reply(200, [
      {
        id: 1,
        name: 'test-task',
        processDefinitionId: 'processDefinitionId0',
        processInstanceId: 'processInstanceId0',
        due: dayjs().add(2, 'day').format(),
        created: dayjs().subtract(1, 'day').format(),
        assignee: 'john@doe.com',
        priority: 100,
      },
    ]);
    mockAxios.onPost('/camunda/engine-rest/task/count').reply(200, {
      count: 1,
    });
    mockAxios.onGet('/camunda/engine-rest/process-definition').reply(200, [
      {
        category: 'test',
        id: 'processDefinitionId0',
      },
    ]);
    mockAxios.onPost('/camunda/engine-rest/process-instance').reply(200, [
      {
        businessKey: 'TEST-BUSINESS-KEY0',
        id: 'processInstanceId0',
      },
    ]);

    render(
      <MockGroupContext>
        <TasksListPage />
      </MockGroupContext>
    );

    await waitFor(() => {
      expect(screen.getByText('test-task')).toBeTruthy();
    });
  });

  it('should group tasks correctly', async () => {
    /*
     * Add more objects with different processDefinitionIds to map different categories to them.
     * Also added differing priorities to test priority grouping
     */
    let mockData = createMockData(10);
    mockData = mockData.concat([
      {
        id: 'enhance-category',
        name: 'enhance-task',
        processDefinitionId: 'processDefinitionId1',
        processInstanceId: 'processInstanceId1',
        due: dayjs().format(),
        created: dayjs().format(),
        assignee: 'john@doe.com',
        priority: 50,
      },
      {
        id: 'enhance-category1',
        name: 'enhance-task',
        processDefinitionId: 'processDefinitionId1',
        processInstanceId: 'processInstanceId1',
        due: dayjs().format(),
        created: dayjs().format(),
        assignee: 'john@doe.com',
        priority: 150,
      },
    ]);
    // Provides the category to process definition id mapping
    mockAxios.onGet('/camunda/engine-rest/process-definition').reply(200, [
      {
        category: 'test',
        id: 'processDefinitionId0',
      },
      {
        category: 'enhance',
        id: 'processDefinitionId1',
      },
    ]);
    mockAxios.onPost('/camunda/engine-rest/task').reply(200, mockData);
    mockAxios.onPost('/camunda/engine-rest/task/count').reply(200, {
      count: 100,
    });
    // Provides the business key to process instance id mapping
    mockAxios.onPost('/camunda/engine-rest/process-instance').reply(200, [
      {
        businessKey: 'TEST-BUSINESS-KEY0',
        id: 'processInstanceId0',
      },
      {
        businessKey: 'TEST-BUSINESS-KEY1',
        id: 'processInstanceId1',
      },
    ]);
    const { container } = render(
      <MockGroupContext>
        <TasksListPage />
      </MockGroupContext>
    );

    await waitFor(() => {
      /*
       * Check if the grouping title has the correct number of tasks associated with it for categories,
       * the number shown is correspondant with the number of tasks pulled from the api call.
       * Categories is the default grouping when component has mounted
       */
      expect(screen.getByText('test 10 tasks')).toBeTruthy();
      expect(screen.getByText('enhance 2 tasks')).toBeTruthy();
    });

    // Grab groupByDropdown after initial assertions, cannot define this before the await as the component has not mounted at that point
    const groupByDropDown = getById(container, 'group');

    fireEvent.change(groupByDropDown, { target: { value: 'priority' } });

    await waitFor(() => {
      // Same as category assertions but with priority
      expect(screen.getByText('Low 1 task')).toBeTruthy();
      expect(screen.getByText('Medium 10 tasks')).toBeTruthy();
      expect(screen.getByText('High 1 task')).toBeTruthy();
    });

    fireEvent.change(groupByDropDown, { target: { value: 'assignee' } });

    await waitFor(() => {
      // Same as category assertions but with assignee, only one assertion here as all the tasks are assigned to john@doe.com
      expect(screen.getByText('john@doe.com 12 tasks')).toBeTruthy();
    });

    fireEvent.change(groupByDropDown, { target: { value: 'businessKey' } });

    await waitFor(() => {
      expect(screen.getByText('TEST-BUSINESS-KEY0 10 tasks')).toBeTruthy();
      expect(screen.getByText('TEST-BUSINESS-KEY1 2 tasks')).toBeTruthy();
    });
  });

  it('should render spinner on pagination button click', async () => {
    const mockData = createMockData(21);
    mockAxios.onPost('/camunda/engine-rest/task').reply(200, mockData);
    mockAxios.onPost('/camunda/engine-rest/task/count').reply(200, {
      count: 21,
    });
    mockAxios.onGet('/camunda/engine-rest/process-definition').reply(200, [
      {
        category: 'test',
        id: 'processDefinitionId0',
      },
    ]);
    mockAxios.onPost('/camunda/engine-rest/process-instance').reply(200, [
      {
        businessKey: 'TEST-BUSINESS-KEY0',
        id: 'processInstanceId0',
      },
    ]);

    const { container } = render(
      <MockGroupContext>
        <TasksListPage />
      </MockGroupContext>
    );

    await waitFor(() => {
      expect(screen.queryByText('loading')).not.toBeInTheDocument();
      expect(getById(container, 'sort')).not.toBe(null);
      expect(getById(container, 'group')).not.toBe(null);
      expect(getById(container, 'filterTaskName')).not.toBe(null);
    });

    fireEvent.click(screen.getByText('Next ›'));

    expect(screen.queryByText('loading')).toBeInTheDocument();
    expect(getById(container, 'sort')).not.toBe(null);
    expect(getById(container, 'group')).not.toBe(null);
    expect(getById(container, 'filterTaskName')).not.toBe(null);
  });
});
