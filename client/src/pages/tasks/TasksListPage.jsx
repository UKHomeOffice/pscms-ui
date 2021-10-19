import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKeycloak } from '@react-keycloak/web';
import axios from 'axios';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import ApplicationSpinner from '../../components/ApplicationSpinner';
import { targetTaskNameLike } from '../../utils/constants';
import { useIsMounted, useAxios } from '../../utils/hooks';
import TaskList from './components/TaskList';
import TaskFilters from './components/TaskFilters';
import Pagination from '../../components/Pagination';
import SecureLocalStorageManager from '../../utils/SecureLocalStorageManager';
import { CurrentGroupContext } from '../../utils/CurrentGroupContext';

const TasksListPage = ({ taskType }) => {
  const { t } = useTranslation();
  const { keycloak } = useKeycloak();
  const [filters, setFilters] = useState({
    sortBy: SecureLocalStorageManager.get(`${taskType}-tasksSortBy`)
      ? SecureLocalStorageManager.get(`${taskType}-tasksSortBy`)
      : 'asc-dueDate',
    groupBy: SecureLocalStorageManager.get(`${taskType}-tasksGroupBy`)
      ? SecureLocalStorageManager.get(`${taskType}-tasksGroupBy`)
      : 'category',
    search: '',
  });
  const [data, setData] = useState({
    isLoading: true,
    tasks: [],
  });
  const [page, setPage] = useState(0);
  const [areTasksLoading, setAreTasksLoading] = useState(true);
  const [taskCount, setTaskCount] = useState(0);
  const maxResults = 20;
  const isMounted = useIsMounted();
  const axiosInstance = useAxios();

  const formatSortByValue = (sortValue) => {
    const [sortOrder, sortVariable] = sortValue.split('-');
    return { sortOrder, sortVariable };
  };
  const { trackPageView } = useMatomo();

  useEffect(() => {
    trackPageView();
  }, []);

  const { currentGroup } = useContext(CurrentGroupContext);

  useEffect(() => {
    const source = axios.CancelToken.source();
    setAreTasksLoading(true);
    const loadTasks = async () => {
      if (axiosInstance) {
        try {
          /*
           * taskTypePayload uses the taskType prop to query either the user assigned tasks or
           * their assigned and group assigned tasks
           */

          let taskTypePayload;
          if (taskType === 'yours') {
            taskTypePayload = {
              involvedUser: keycloak.tokenParsed.email,
              nameLike: `%${filters.search}%`,
            };
          } else if (taskType !== 'yours' && !filters.search) {
            taskTypePayload = {
              candidateGroups: [currentGroup.code],
              includeAssignedTasks: true,
              nameNotLike: targetTaskNameLike,
            };
          } else {
            taskTypePayload = {
              candidateGroups: [currentGroup.code],
              includeAssignedTasks: true,
              nameNotLike: targetTaskNameLike,
              nameLike: `%${filters.search}%`,
            };
          }

          const taskCountResponse = await axiosInstance({
            method: 'POST',
            url: '/camunda/engine-rest/task/count',
            cancelToken: source.token,
            data: {
              ...taskTypePayload,
            },
          });
          const { sortOrder, sortVariable } = formatSortByValue(filters.sortBy);
          const tasksResponse = await axiosInstance({
            method: 'POST',
            url: '/camunda/engine-rest/task',
            cancelToken: source.token,
            params: {
              maxResults,
              firstResult: page,
            },
            data: {
              sorting: [
                {
                  sortBy: sortVariable,
                  sortOrder,
                },
              ],
              ...taskTypePayload,
            },
          });
          /*
           * If the response from /camunda/engine-rest/task is an empty array, no need to make requests when task list is empty
           * otherwise this will cause /process-instance call to return an error (no process instance ids in the json body). We don't
           * want to show an alert if the search string yields no tasks - this is not an api error
           */
          if (tasksResponse.data.length === 0) {
            setData({
              isLoading: false,
              tasks: [],
            });
            setAreTasksLoading(false);
            setTaskCount(0);
          } else {
            // This generates a unique list of process definition ids to use for a call to camunda for task categories
            const processDefinitionIds = _.uniq(
              tasksResponse.data.map((task) => task.processDefinitionId)
            );
            const definitionResponse = await axiosInstance({
              method: 'GET',
              url: '/camunda/engine-rest/process-definition',
              params: {
                processDefinitionIdIn: processDefinitionIds.toString(),
              },
            });
            // This generates a unique list of process instance ids to use for a call to camunda for task business keys
            const processInstanceIds = _.uniq(
              tasksResponse.data.map((task) => task.processInstanceId)
            );
            const processInstanceResponse = await axiosInstance({
              method: 'POST',
              url: '/camunda/engine-rest/process-instance',
              data: {
                processInstanceIds,
              },
            });

            if (isMounted.current) {
              if (definitionResponse.data && definitionResponse.data.length) {
                tasksResponse.data.forEach((task) => {
                  const processDefinition = _.find(
                    definitionResponse.data,
                    (definition) => definition.id === task.processDefinitionId
                  );
                  const processInstance = _.find(
                    processInstanceResponse.data,
                    (instance) => instance.id === task.processInstanceId
                  );

                  if (processDefinition) {
                    task.category = processDefinition.category;
                  }
                  if (processInstance) {
                    task.businessKey = processInstance.businessKey;
                  }
                });
              }

              setData({
                isLoading: false,
                tasks: tasksResponse.data,
              });
              setTaskCount(taskCountResponse.data.count);
              setAreTasksLoading(false);
            }
          }
        } catch (e) {
          setData({
            isLoading: false,
            tasks: [],
          });
          setAreTasksLoading(false);
        }
      }
    };
    loadTasks().then(() => {});
    return () => {
      source.cancel('Cancelling request');
    };
  }, [
    setData,
    page,
    setTaskCount,
    axiosInstance,
    keycloak.tokenParsed.email,
    keycloak.tokenParsed.groups,
    isMounted,
    filters.sortBy,
    filters.search,
    taskType,
  ]);

  if (data.isLoading) {
    return <ApplicationSpinner />;
  }

  return (
    <>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <span className="govuk-caption-l">{t(`pages.tasks.${taskType}.caption`)}</span>
          <h1 className="govuk-heading-l">
            {t(`pages.tasks.${taskType}.heading`, { count: taskCount })}
          </h1>
        </div>
      </div>
      <div>
        <TaskFilters
          filters={filters}
          setFilters={setFilters}
          setPage={setPage}
          taskType={taskType}
        />
      </div>
      {areTasksLoading ? (
        <ApplicationSpinner />
      ) : (
        <>
          <div className="govuk-grid-row">
            <div className="govuk-grid-column-full">
              <TaskList
                tasks={data.tasks}
                taskType={taskType}
                groupBy={filters.groupBy}
                areTasksLoading={areTasksLoading}
              />
              {data.tasks.length ? (
                <Pagination
                  page={page}
                  setPage={setPage}
                  taskCount={taskCount}
                  maxResults={maxResults}
                />
              ) : null}
            </div>
          </div>
        </>
      )}
    </>
  );
};

TasksListPage.propTypes = {
  taskType: PropTypes.string.isRequired,
};

export default TasksListPage;
