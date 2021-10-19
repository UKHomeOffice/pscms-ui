import { shallow, mount } from 'enzyme';
import React from 'react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { act } from '@testing-library/react';
import Home from './index';
import Card from './components/Card';
import { CurrentGroupContext } from '../../utils/CurrentGroupContext';
import { mockNavigate } from '../../setupTests';

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

describe('Home', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  const mockAxios = new MockAdapter(axios);
  it('renders without crashing', () => {
    shallow(
      <MockGroupContext>
        <Home />
      </MockGroupContext>
    );
  });

  it('renders forms, tasks, cases and reports panels', async () => {
    mockAxios.onPost('/camunda/engine-rest/task/count').reply(200, {
      count: 10,
    });

    mockAxios.onGet('refdata/v2/entities/groups?filter=teamid=eq.21').reply(200, {
      displayname: 'Portsmouth',
      code: 'ABC123',
      grouptypeid: 1,
    });

    const wrapper = mount(
      <MockGroupContext>
        <Home />
      </MockGroupContext>
    );

    await act(async () => {
      await Promise.resolve(wrapper);
      await new Promise((resolve) => setImmediate(resolve));
      await wrapper.update();
    });

    expect(wrapper.find(Card).length).toBe(6);
    const tasksCard = wrapper.find(Card).at(0);
    const groupTasksCard = wrapper.find(Card).at(1);
    const targetsCard = wrapper.find(Card).at(2);
    const formsCard = wrapper.find(Card).at(3);
    const casesCard = wrapper.find(Card).at(4);
    const reportsCard = wrapper.find(Card).at(5);

    expect(tasksCard.find('h2').text()).toBe('10');
    expect(tasksCard.find('span').text()).toBe('pages.home.card.tasks.title');
    expect(groupTasksCard.find('h2').text()).toBe('10');
    expect(groupTasksCard.find('span').text()).toBe('pages.home.card.group-tasks.title');
    expect(targetsCard.find('h2').text()).toBe('10');
    expect(targetsCard.find('span').text()).toBe('pages.home.card.targets.title');
    expect(formsCard.find('h2').text()).toBe('pages.home.card.forms.title');
    expect(casesCard.find('h2').text()).toBe('pages.home.card.cases.title');
    expect(reportsCard.find('h2').text()).toBe('pages.home.card.reports.title');
  });

  it('handles errors and sets it to zero', async () => {
    mockAxios.onPost('/camunda/engine-rest/task/count').reply(500, {});

    const wrapper = mount(
      <MockGroupContext>
        <Home />
      </MockGroupContext>
    );

    await act(async () => {
      await Promise.resolve(wrapper);
      await new Promise((resolve) => setImmediate(resolve));
      await wrapper.update();
    });

    expect(wrapper.find(Card).length).toBe(6);
    const tasksCard = wrapper.find(Card).at(0);
    const groupTasksCard = wrapper.find(Card).at(1);
    const targetsCard = wrapper.find(Card).at(2);
    const formsCard = wrapper.find(Card).at(3);
    const casesCard = wrapper.find(Card).at(4);
    const reportsCard = wrapper.find(Card).at(5);

    expect(tasksCard.find('h2').text()).toBe('0');
    expect(groupTasksCard.find('h2').text()).toBe('0');
    expect(targetsCard.find('h2').text()).toBe('0');
    expect(formsCard.find('h2').text()).toBe('pages.home.card.forms.title');
    expect(casesCard.find('h2').text()).toBe('pages.home.card.cases.title');
    expect(reportsCard.find('h2').text()).toBe('pages.home.card.reports.title');
  });

  it('can handle onClick', async () => {
    mockAxios.onPost('/camunda/engine-rest/task/count').reply(200, {
      count: 10,
    });
    const wrapper = await mount(
      <MockGroupContext>
        <Home />
      </MockGroupContext>
    );

    await act(async () => {
      await Promise.resolve(wrapper);
      await new Promise((resolve) => setImmediate(resolve));
      await wrapper.update();
    });

    expect(wrapper.find(Card).length).toBe(6);
    const tasksCard = wrapper.find(Card).at(0);
    const groupTasksCard = wrapper.find(Card).at(1);
    const targetsCard = wrapper.find(Card).at(2);
    const formsCard = wrapper.find(Card).at(3);
    const casesCard = wrapper.find(Card).at(4);
    const reportsCard = wrapper.find(Card).at(5);

    tasksCard.props().handleClick();
    expect(mockNavigate).toBeCalledWith('/tasks/your-tasks');

    groupTasksCard.props().handleClick();
    expect(mockNavigate).toBeCalledWith('/tasks');

    formsCard.props().handleClick();
    expect(mockNavigate).toBeCalledWith('/forms');

    casesCard.props().handleClick();
    expect(mockNavigate).toBeCalledWith('/cases');

    reportsCard.props().handleClick();
    expect(mockNavigate).toBeCalledWith('/reports');

    targetsCard.props().handleClick();
    expect(mockNavigate).toBeCalledWith('/targets');
  });
});
