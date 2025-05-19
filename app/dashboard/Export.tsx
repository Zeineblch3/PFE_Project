import React, { useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import Papa from 'papaparse';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';


interface ColumnDefinition {
  key: string;
  label: string;
}

interface ExportProps {
  data: any[]; 
  columns: ColumnDefinition[]; 
  fileName: string;
  className?: string;
}

const Export: React.FC<ExportProps> = ({ data, columns, fileName, className }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'pdf' | null>(null);

  const handleExportCSV = () => {
    const exportData = data.map((item) => {
      const mapped: any = {};
      columns.forEach((col) => {
        mapped[col.label] = item[col.key];
      });
      return mapped;
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
  
    const tableColumn = columns.map(col => col.label);
    const tableRows = data.map(item =>
      columns.map(col => {
        const value = item[col.key];
        return typeof value === 'string' || typeof value === 'number'
          ? value
          : JSON.stringify(value);
      })
    );
  
    doc.setFontSize(12);
    doc.text(`${fileName} Export`, 14, 15);
  
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak', 
      },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: 255,
        halign: 'center',
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 20, left: 14, right: 14 },
  
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 50 }, 
        2: { cellWidth: 20 }, 
        3: { cellWidth: 50 }, 
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
      },
  
      tableWidth: 'auto',
    });
  
    doc.save(`${fileName}.pdf`);
  };  
  
  
  

  const handleExportClick = (type: 'csv' | 'pdf') => {
    setExportType(type);
    setDropdownOpen(false);
    if (type === 'csv') {
      handleExportCSV();
    } else if (type === 'pdf') {
      handleExportPDF();
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        className="bg-black text-white rounded-md p-0 flex items-center"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <FaDownload className="mr-2" /> Export as
      </button>

      {dropdownOpen && (
        <div className="absolute right-47 mt-2 w-40 rounded-md bg-black shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {(['csv', 'pdf'] as const).map((format) => (
              <button
                key={format}
                onClick={() => handleExportClick(format)}
                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800"
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Export;
