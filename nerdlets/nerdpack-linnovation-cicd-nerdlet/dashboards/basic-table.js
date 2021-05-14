import React from 'react'
import PropTypes from 'prop-types';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
} from 'nr1';

const basicTable = ({ headers, rows }) => {
  const getHeader = idx => {
    return <TableHeaderCell value={rows[idx]}>{headers[idx]}</TableHeaderCell>;
  };

  const getRow = idx => {
    return <TableRowCell>{rows[idx]}</TableRowCell>;
  };

  return (
    // <div className="chart__container">
    //   <div className="chart__header">
        <Table items={rows}>
          <TableHeader>{() => headers.forEach(idx => getHeader(idx))}</TableHeader>

          {({ item }) => (
            <TableRow>{() => item.forEach(idx => getRow(idx))};</TableRow>
          )}
        </Table>
    //   </div>
    // </div>
  );
}

basicTable.propTypes = {
  headers: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
}

export default basicTable;
