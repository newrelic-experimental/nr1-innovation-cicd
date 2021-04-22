import React from 'react';
import PropTypes from 'prop-types';

import { HeadingText } from 'nr1';

const navigation = ({
  projectName,
  sprintName,
  loadedSprints,
  kanbanOnly,
  onChange,
}) => {
  const renderSprintDropdowns = () => {
    const sprintTop = (
      <div
        onClick={() => onChange('All')}
        className={
          'navigation__item' + `${sprintName === 'All' ? ' selected' : ''}`
        }
        key={0+'all'}
        value="all"
      >
        All Sprints
      </div>
    );

    const sprintMenu =
      loadedSprints &&
      loadedSprints.map((item, index) => (
        <div
          className={
            'navigation__item' +
            `${item.name === sprintName ? ' selected' : ''}`
          }
          onClick={() => onChange(item.name)}
          key={index}
          value={item.name}
        >
          <div className="navigation__item-name">{item.name}</div>
        </div>
      ));

    return (
      <>
        {sprintTop}
        {sprintMenu}
      </>
    );
  };

  if (projectName && !kanbanOnly) return renderSprintDropdowns();
  else
    return (
      <HeadingText type={HeadingText.TYPE.HEADING_4}>
        <center></center>
      </HeadingText>
    );
};

navigation.propTypes = {};

export default navigation;
