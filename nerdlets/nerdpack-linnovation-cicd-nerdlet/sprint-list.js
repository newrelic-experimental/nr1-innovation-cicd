import React from 'react';
import PropTypes from 'prop-types';
//import { Dropdown } from 'semantic-ui-react';
import { List, ListItem, Spinner } from 'nr1';

export default class SprintList extends React.Component {

  static propTypes = {
    projectName: PropTypes.string,
    loadedSprints: PropTypes.array,
    sprintName: PropTypes.string,
    filterChange: PropTypes.func
  }

  constructor(props){
    super(props);
  }



  renderSprintDropdowns(){
    const { loadedSprints, projectName, sprintName } = this.props;
    var sprintMenu;
    var sprintTop;

    if(sprintName) {
      sprintTop = <li onClick={(ent, value) => this.props.filterChange(event, "All")} className="sidebar-list-item" key={0} value="all">All Sprints</li>;
    } else {
      sprintTop = <li onClick={(ent, value) => this.props.filterChange(event, "All")} className="sidebar-list-item-selected" key={0} value="All">All Sprints</li>;
    }
    if (loadedSprints) {
        sprintMenu = loadedSprints.map((item, index) => (
        <li onClick={(ent, value) => this.props.filterChange(event, item.name)} className="sidebar-list-item" key={index} value={item.name}>{item.name}</li>
      ))};


    return (
            <ul className="sidebar-list">
              {sprintTop}
              {sprintMenu}
            </ul>
    )
}

  render() {
    return (
      this.renderSprintDropdowns()
    )
  }

}