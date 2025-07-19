import React from 'react';

export default function Downloads() {
  const data = [
    ['07/15/25', 'sample@email.com', 'PlayerOne', 'Cheats', '3 pts'],
    ['07/14/25', 'user@domain.com', 'GamerX', 'Guides', '1 pt'],
  ];

  return (
    <div className="overflow-auto max-h-[70vh]">
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">DATE</th>
            <th className="p-2 border">EMAIL ADDRESS</th>
            <th className="p-2 border">FULL NAME</th>
            <th className="p-2 border">CATEGORY</th>
            <th className="p-2 border">POINTS</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className="p-2 border">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
