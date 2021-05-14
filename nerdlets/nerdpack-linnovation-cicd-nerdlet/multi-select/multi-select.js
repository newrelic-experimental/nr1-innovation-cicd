import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox, TextField } from 'nr1';

export default class MultiSelect extends React.Component {
  state = {
    searchTerm: '',
    filtered: null,
  };

  search = evt => {
    const { source } = this.props;
    const searchText = evt.target.value;

    const trimmedSearchText = searchText.trim();
    const filtered = trimmedSearchText.length
      ? source.filter(s => s.value.includes(trimmedSearchText))
      : source;

    this.setState({ searchTerm: trimmedSearchText, filtered });
  };

  render() {
    const { source, selected, onChange, emptyMessage } = this.props;
    const { searchTerm, filtered } = this.state;
    const items = filtered ? filtered : source;

    const renderedItems =
      items &&
      items.map(({ value }) => {
        const foundInSelected = selected && selected.find(s => s === value);
        const isChecked = !!foundInSelected;
        return (
          <div className={`multi__select-item ${isChecked ? 'selected' : ''}`}>
            <Checkbox
              label={value}
              checked={isChecked}
              onChange={() => onChange(value)}
            />
          </div>
        );
      });

    return (
      <div className="multi__select">
        {!items && <div className="multi__select-empty">{emptyMessage}</div>}
        {items && (
          <>
            <div className="multi__select-search">
              <TextField
                className="search__input"
                placeholder="Search..."
                onChange={this.search}
                value={searchTerm}
                type={TextField.TYPE.SEARCH}
              />
            </div>
            <div className="multi__select-items">{renderedItems}</div>
          </>
        )}
      </div>
    );
  };
}

MultiSelect.propTypes = {
  source: PropTypes.array.isRequired,
  selected: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  emptyMessage: PropTypes.string,
};

MultiSelect.defaultProps = {
  emptyMessage: 'No items found.',
}
