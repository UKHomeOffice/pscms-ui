import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-navi';
import _ from 'lodash';
import axios from 'axios';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import { useTranslation } from 'react-i18next';
import { useKeycloak } from '@react-keycloak/web';
import { formatCategory, formatDate } from './utils';
import { targetTaskDefinitionKey } from '../../utils/constants';
import { GroupsContext } from '../../utils/GroupsContext';
import { useIsMounted, useAxios } from '../../utils/hooks';
import ApplicationSpinner from '../../components/ApplicationSpinner';
import TargetPagination from './__components__/TargetPagination';

const TargetsListPage = () => {
  const axiosInstance = useAxios();
  const isMounted = useIsMounted();
  const source = axios.CancelToken.source();
  const { nonRoleGroups } = useContext(GroupsContext);
  const { t } = useTranslation();
  const { trackPageView } = useMatomo();
  const { keycloak } = useKeycloak();
  const [groupCodes, setGroupCodes] = useState([]);
  const [groupNames, setGroupNames] = useState([]);
  const [groupsSelected, setGroupsSelected] = useState([]);
  const [groupTargetCounts, setGroupTargetCounts] = useState([]);
  const [taskCount, setTaskCount] = useState(0);
  const [taskList, setTaskList] = useState();
  const [areTasksLoading, setAreTasksLoading] = useState(true);
  const maxResults = 20;

  // PAGINATION SETTINGS
  const [activePage, setActivePage] = useState(1);
  const [tasksToReturnIndex, setTasksToReturnIndex] = useState(0);
  const itemsPerPage = 20;

  const createGroupCodeArray = () => {
    return nonRoleGroups.map((group) => {
      return group.code;
    });
  };

  const createGroupNameArray = () => {
    return nonRoleGroups.map((group) => {
      return { code: group.code, name: group.displayname };
    });
  };

  const getGroupTargetCounts = () => {
    const promises = [];
    const createGroupTargetCountsArray = [];
    const checked = localStorage.getItem('checkbox')?.split(',') || [];
    setGroupsSelected(localStorage.getItem('checkbox')?.split(',') || []);

    groupNames.forEach((group) => {
      promises.push(
        axiosInstance
          .post('/camunda/engine-rest/task/count', {
            taskDefinitionKey: targetTaskDefinitionKey,
            orQueries: [
              {
                candidateGroups: [group.code],
                includeAssignedTasks: true,
              },
            ],
          })
          .then((resp) => {
            createGroupTargetCountsArray.push({
              code: group.code,
              name: group.name,
              count: resp.data.count,
              checked: checked.includes(group.code),
            });
          })
      );
    });
    Promise.all(promises).then(setGroupTargetCounts(createGroupTargetCountsArray));
  };

  const getTargetTasks = async (groupsToUse) => {
    const checked = localStorage.getItem('checkbox')?.split(',');
    setAreTasksLoading(true);
    try {
      const targetTaskList = await axiosInstance({
        method: 'POST',
        url: '/camunda/engine-rest/task',
        cancelToken: source.token,
        params: {
          maxResults,
          firstResult: tasksToReturnIndex,
        },
        data: {
          sorting: [
            {
              sortBy: 'dueDate',
              sortOrder: 'asc',
            },
          ],
          taskDefinitionKey: targetTaskDefinitionKey,
          orQueries: [
            {
              candidateGroups: !checked ? groupsToUse : checked,
              includeAssignedTasks: true,
            },
          ],
        },
      });
      try {
        const taskCountResponse = await axiosInstance({
          method: 'POST',
          url: '/camunda/engine-rest/task/count',
          cancelToken: source.token,
          data: {
            taskDefinitionKey: targetTaskDefinitionKey,
            orQueries: [
              {
                candidateGroups: !checked ? groupsToUse : checked,
                includeAssignedTasks: true,
              },
            ],
          },
        });
        setTaskCount(taskCountResponse.data.count);
      } catch (e) {
        setTaskList([]);
        setAreTasksLoading(false);
      }
      /*
       * If the response from /camunda/engine-rest/task is an empty array, no need to make requests when task list is empty
       * otherwise this will cause /process-instance call to return an error (no process instance ids in the json body). We don't
       * want to show an alert if the search string yields no tasks - this is not an api error
       */
      if (targetTaskList.data.length === 0) {
        setTaskList([]);
        setTaskCount(0);
        setAreTasksLoading(false);
      } else {
        // This gets & parses the target information data
        const processInstanceIdsForVariableResponse = _.uniq(
          targetTaskList.data.map(({ processInstanceId, id }) => processInstanceId || id)
        ).join(',');
        const variableInstanceResponse = await axiosInstance({
          method: 'GET',
          url: '/camunda/engine-rest/variable-instance',
          params: {
            variableName: 'targetInformationSheet',
            processInstanceIdIn: processInstanceIdsForVariableResponse,
            deserializeValues: false,
          },
        });
        const targetTaskListData = variableInstanceResponse.data.map((task) => {
          return {
            processInstanceId: task.processInstanceId,
            ...JSON.parse(task.value),
          };
        });

        /*
         * We need to merge the initial TargetTaskList data we get, and the expanded
         * targetTaskListData as the first contains taskId and assignee which is
         * needed for linking to the task/<id> & handling assignee claim/unclaim
         */
        const mergedTargetData = targetTaskListData.map((task) => {
          const matchedTargetTask = targetTaskList.data.find(
            (v) => task.processInstanceId === v.processInstanceId
          );
          return {
            ...task,
            ...matchedTargetTask,
          };
        });

        /*
         * We initially grab the tasks from camunda in a sorted order (by 'due' asc)
         * However after using the tasks data to query the variable endpoint we lose the
         * sorting we had before. As a result, the amalgamation of /tasks and /variable api calls
         * is sorted by the 'due' property to ensure the task list is in asc order
         */
        setTaskList(
          mergedTargetData.sort((a, b) => {
            const dateA = new Date(a.due);
            const dateB = new Date(b.due);
            return (a.due === null) - (b.due === null) || +(dateA > dateB) || -(dateA < dateB);
          })
        );
        setAreTasksLoading(false);
      }
    } catch (e) {
      setTaskList([]);
      setAreTasksLoading(false);
    }
  };

  const handleFilterCheckboxChange = (e, code) => {
    if (e.target.checked) {
      setGroupsSelected([...groupsSelected, code]);
    } else if (!e.target.checked) {
      const array = [...groupsSelected];
      const updatedArr = _.remove(array, (item) => {
        return item !== code;
      });
      setGroupsSelected(updatedArr);
    }
  };

  const handleFilterApply = (e) => {
    localStorage.removeItem('checkbox', groupsSelected);
    setTasksToReturnIndex(0);
    setActivePage(1);
    e.preventDefault();
    if (groupsSelected.length > 0) {
      localStorage.setItem('checkbox', groupsSelected);
      getTargetTasks(groupsSelected);
    } else {
      /*
       * When no filters are selected
       * The default behaviour is to show all
       * target tasks for all your gruops
       */
      getTargetTasks(groupCodes);
    }
  };

  const handleFilterReset = (e) => {
    setTasksToReturnIndex(0);
    setActivePage(0);
    e.preventDefault();
    /*
     * Clearing filters returns everything to default state
     * display targets for ALL users groups
     * reset groups selected to null
     * uncheck any checked checkboxes
     */
    getTargetTasks(groupCodes);
    setGroupsSelected([]);
    localStorage.removeItem('checkbox', groupsSelected);
    const checkboxes = document.getElementsByName('group');
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        checkboxes[i].checked = !checkboxes[i].checked;
      }
    }
  };

  useEffect(() => {
    trackPageView();
  }, []);

  useEffect(() => {
    setGroupCodes(createGroupCodeArray());
    setGroupNames(createGroupNameArray());
  }, [nonRoleGroups]);

  useEffect(() => {
    if (axiosInstance && nonRoleGroups.length > 0) {
      getTargetTasks(groupCodes);
      getGroupTargetCounts(); // gets ALL group counts, so do not pass in groupsToUse
    } else {
      setTaskList([]);
    }
    return () => {
      source.cancel('Cancelling request');
    };
  }, [
    setTaskList,
    activePage,
    axiosInstance,
    keycloak.tokenParsed.email,
    keycloak.tokenParsed.groups,
    isMounted,
    groupCodes,
    groupNames,
  ]);

  if (!taskList) {
    return <ApplicationSpinner />;
  }

  return (
    <>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <span className="govuk-caption-l">{t(`pages.targets.caption`)}</span>
          <h1 className="govuk-heading-l">{t(`pages.targets.heading`, { count: taskCount })}</h1>
        </div>
      </div>
      <div className="govuk-grid-row">
        <hr
          style={{
            borderBottom: '3px solid #1d70b8',
            borderTop: 'none',
          }}
        />
        {areTasksLoading && <ApplicationSpinner />}
        <div className="govuk-grid-column-one-quarter cop-filters-container">
          <div className="cop-filters-header">
            <h2 className="govuk-heading-s">{t(`pages.filters.title`)}</h2>
          </div>

          <div className="cop-filters-controls">
            <div className="govuk-button-group">
              <button
                className="govuk-button"
                data-module="govuk-button"
                type="button"
                onClick={(e) => {
                  handleFilterApply(e);
                }}
              >
                {t(`pages.filters.apply`)}
              </button>
              <button
                className="govuk-link"
                data-module="govuk-button"
                type="button"
                onClick={(e) => {
                  handleFilterReset(e);
                }}
              >
                {t(`pages.filters.clear`)}
              </button>
            </div>
          </div>

          <div className="cop-filters-options">
            <div className="govuk-form-group">
              <fieldset className="govuk-fieldset" aria-describedby="waste-hint">
                <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
                  <h3 className="govuk-fieldset__heading">{t(`pages.filters.groups.title`)}</h3>
                </legend>

                <ul
                  className="govuk-checkboxes cop-filters-options"
                  data-module="govuk-checkboxes"
                  data-testid="sorted-list"
                >
                  {groupTargetCounts.length > 0 &&
                    groupTargetCounts
                      .sort((a, b) => (a.name > b.name ? 1 : -1))
                      .map((group) => {
                        let checked = true;
                        return (
                          <li
                            className="govuk-checkboxes__item govuk-!-margin-bottom-5"
                            key={group.code}
                          >
                            <input
                              className="govuk-checkboxes__input"
                              id={group.code}
                              name="group"
                              type="checkbox"
                              value={group.name}
                              defaultChecked={group.checked}
                              onChange={(e) => {
                                checked = !checked;
                                handleFilterCheckboxChange(e, group.code);
                              }}
                              data-testid={`checkbox-${group.code}`}
                            />
                            <label
                              className="govuk-label govuk-checkboxes__label govuk-!-padding-top-0"
                              htmlFor={group.code}
                            >
                              {group.name} <br />
                              <strong>{group.count} targets</strong>
                            </label>
                          </li>
                        );
                      })}
                </ul>
              </fieldset>
            </div>
          </div>
        </div>
        <div className="govuk-grid-column-three-quarters">
          <table>
            <thead className="govuk-table__head">
              <tr className="govuk-table__row">
                <th scope="col" className="govuk-table__header">
                  Location
                </th>
                <th scope="col" className="govuk-table__header">
                  Vessel
                </th>
                <th scope="col" className="govuk-table__header">
                  Due
                </th>
                <th scope="col" className="govuk-table__header">
                  Mode
                </th>
                <th scope="col" className="govuk-table__header">
                  Vehicle / Trailer registration
                </th>
                <th scope="col" className="govuk-table__header">
                  Driver last name
                </th>
                <th scope="col" className="govuk-table__header">
                  Category
                </th>
                <th scope="col" className="govuk-table__header">
                  Warnings
                </th>
              </tr>
            </thead>
            <tbody className="govuk-table__body">
              {taskList.map((task) => (
                <tr className="govuk-table__row" key={task.id}>
                  <td className="govuk-table__cell">
                    <Link
                      className="govuk-link govuk-!-font-size-19"
                      href={`/targets/${task.id}`}
                      aria-describedby={task.eventPort?.name}
                    >
                      {task.eventPort?.name}
                    </Link>
                  </td>
                  <td className="govuk-table__cell">
                    {task.roro?.details?.vessel?.name}
                    <br />
                    {task.roro?.details?.vessel?.company}
                  </td>
                  <td className="govuk-table__cell">{formatDate(task.roro?.details?.eta)}</td>
                  <td className="govuk-table__cell">
                    {task.mode?.mode}
                    <br />
                    {task.roro?.roroFreightType}
                  </td>
                  <td className="govuk-table__cell">
                    {task.roro?.details?.vehicle?.registrationNumber}
                    <br />
                    {task.roro?.details?.vehicle?.trailer?.regNumber}
                  </td>
                  <td className="govuk-table__cell">{task.roro?.details?.driver?.lastName}</td>
                  <td className="govuk-table__cell">{formatCategory(task.category)}</td>
                  <td className="govuk-table__cell">{task.warnings}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <TargetPagination
            totalItems={taskCount}
            itemsPerPage={itemsPerPage}
            activePage={activePage === 0 ? 1 : activePage}
            handleOnPageChange={setTasksToReturnIndex}
            updatePageNumber={setActivePage}
          />
        </div>
      </div>
    </>
  );
};

export default TargetsListPage;
