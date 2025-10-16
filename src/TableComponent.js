// src/TableComponent.js
import React from 'react';

const TableComponent = ({ data }) => {
  if (!data || data.length === 0) {
    return null; // Don't render anything if there's no data
  }

  // Get headers from the keys of the first object in the array
  const headers = Object.keys(data[0]);

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {headers.map(header => (
                <td key={header}>{String(row[header])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableComponent;