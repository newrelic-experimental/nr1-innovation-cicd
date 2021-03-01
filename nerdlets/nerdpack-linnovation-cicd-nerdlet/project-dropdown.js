import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Dropdown } from 'semantic-ui-react';
import { Select, SelectItem, Spinner } from 'nr1';

export default class ProjectDropdown extends React.Component {

  static propTypes = {
    loadedProjects: PropTypes.array,
    filterChange: PropTypes.func,
    projectName: PropTypes.string,
    loading: PropTypes.bool
  }

  constructor(props){
    super(props);
  }

  renderProjectDropdowns(){
    const { loadedProjects, projectName, loading } = this.props;

    const projectOptions = _.map(loadedProjects, (project, index) => ({
        key: loadedProjects[index].name,
        text: loadedProjects[index].name,
        value: loadedProjects[index].name,
      }));

    return (
      <Dropdown placeholder='All' clearable search selection options={projectOptions} loading={loading} disabled={loading} onChange={(ent, value) => this.props.filterChange(event, value.value)}/>
      )
}

  render() {
    return (
      this.renderProjectDropdowns()
    )
  }

}
