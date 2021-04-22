import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownItem } from 'nr1';

export default class ProjectDropdown extends React.Component {
  static propTypes = {
    loadedProjects: PropTypes.array.isRequired,
    selectedProject: PropTypes.string.isRequired,
    filterChange: PropTypes.func.isRequired,
  };

  render() {
    const { loadedProjects, selectedProject, filterChange } = this.props;

    return (
      <div className="toolbar__item">
        <div className="toolbar__label">Project:</div>
        <Dropdown
          className="toolbar__item-element"
          title={selectedProject ? selectedProject : 'All'}
          style={{ minWidth: '10rem' }}
        >
          <DropdownItem
            onClick={() => filterChange('All')}
            selected={selectedProject === null}
          >
            All
          </DropdownItem>
          {loadedProjects.map((item, index) => (
            <DropdownItem
              key={index}
              onClick={() => filterChange(item.name)}
              selected={selectedProject === item.name}
            >
              {item.name}
            </DropdownItem>
          ))}
        </Dropdown>
      </div>
    );
  }
}
