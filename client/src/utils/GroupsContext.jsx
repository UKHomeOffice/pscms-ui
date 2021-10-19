import React, { createContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const GROUP_TYPE_ROLE = 2;

export const GroupsContext = createContext({
  groups: {},
  setGroups: () => {},
  nonRoleGroups: [],
  nonRoleGroupCodes: [],
  setNonRoleGroups: () => {},
});

export const GroupsContextProvider = ({ children }) => {
  const [groups, setGroups] = useState({});
  const [nonRoleGroups, setNonRoleGroups] = useState([]);
  const [nonRoleGroupCodes, setNonRoleGroupCodes] = useState([]);

  const getNonRoleGroups = () => {
    const filteredGroups =
      groups.length > 0 ? groups.filter((group) => group.grouptypeid !== GROUP_TYPE_ROLE) : [];
    setNonRoleGroups(filteredGroups);
    const groupCodes = filteredGroups.map((group) => {
      return group.code;
    });
    setNonRoleGroupCodes(groupCodes);
  };

  useEffect(() => {
    getNonRoleGroups();
  }, [groups]);

  return (
    <GroupsContext.Provider
      value={{ groups, setGroups, nonRoleGroups, nonRoleGroupCodes, setNonRoleGroups }}
    >
      {children}
    </GroupsContext.Provider>
  );
};

GroupsContextProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};
