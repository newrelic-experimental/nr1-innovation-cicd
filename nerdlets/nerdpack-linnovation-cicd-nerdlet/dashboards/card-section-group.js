import React from 'react'
import PropTypes from 'prop-types'

const sectionGroup = props => {
  return (
    <NrqlQuery accountId={section.accountId} query={section.query}>
      {({ data }) => {
        if (data) {
          let value = data ? data[0].data[0].y : 0;
          value = section.formatter ? section.formatter(value) : value;

          return renderSection(section.label, value ? value : 0);
        }

        return <></>;
      }}
    </NrqlQuery>
  );
};

sectionGroup.propTypes = {
  query: PropTypes.string.isRequired,
  accountId: PropTypes.number.isRequired,
  formatter: PropTypes.func,
  sections: PropTypes.shape({
    label: PropTypes.string,
  }),
};

export default sectionGroup;
