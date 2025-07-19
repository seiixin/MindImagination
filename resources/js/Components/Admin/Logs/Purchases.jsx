import React from 'react';

export default function Purchases() {
  const data = [
    ['07/16/25', 'buyer@email.com', 'BuyerOne', 'Skins', '10 pts', '₱100'],
    ['07/15/25', 'client@site.com', 'ClientX', 'Lootbox', '5 pts', '₱50'],
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
            <th className="p-2 border">COST</th>
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
