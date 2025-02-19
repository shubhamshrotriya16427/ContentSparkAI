import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [currentFilter, setCurrentFilter] = useState(null);

  const updateCurrentFilter = (filter) => {
    setCurrentFilter(filter);
  };

  return (
    <FilterContext.Provider value={{ currentFilter, updateCurrentFilter }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => useContext(FilterContext);