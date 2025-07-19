import React from 'react';

export default function ActiveGames() {
  const data = [
    ['07/17/25', 'player@game.com', 'PlayerY', 'Shooter'],
    ['07/16/25', 'gamer@xyz.com', 'GamerZ', 'Strategy'],
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
