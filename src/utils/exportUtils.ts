import ExcelJS from 'exceljs';
import type { Student, Class, ClassStatistics } from '../types';

export function sortStudentsAlphabetically(students: Student[]): Student[] {
  return [...students].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}

function getStudentsOrderedForClassAssignments(students: Student[], classes: Class[]): Student[] {
  const orderedAssignedStudents = classes.flatMap((cls) =>
    sortStudentsAlphabetically(students.filter((student) => student.assignedClassId === cls.id))
  );
  const orderedUnassignedStudents = sortStudentsAlphabetically(
    students.filter((student) => student.assignedClassId === null)
  );

  return [...orderedAssignedStudents, ...orderedUnassignedStudents];
}

export function exportToCSV(
  students: Student[],
  classes: Class[],
  getStudentById: (id: string) => Student | undefined
): void {
  const headers = [
    'Name',
    'Gender',
    'EAL',
    'Behaviour',
    'Ability',
    'EHCP',
    'SEND',
    'Monitoring SEN',
    'PPG',
    'Must Be With',
    'Assigned Class',
    'Preferred Friends',
    'Friends in Class',
    'Keep Apart From',
  ];

  const orderedStudents = getStudentsOrderedForClassAssignments(students, classes);

  const rows = orderedStudents.map((student) => {
    const assignedClass = classes.find((c) => c.id === student.assignedClassId);
    const preferredFriendNames = student.preferredFriends
      .map((id) => getStudentById(id)?.name)
      .filter(Boolean)
      .join('; ');
    const keepApartNames = student.keepApartFrom
      .map((id) => getStudentById(id)?.name)
      .filter(Boolean)
      .join('; ');
    const mustBeWithName = student.mustBeWithStudentId
      ? getStudentById(student.mustBeWithStudentId)?.name || '-'
      : '-';

    // Count friends in same class
    const friendsInClass = student.preferredFriends.filter((fId) => {
      const friend = getStudentById(fId);
      return friend && friend.assignedClassId === student.assignedClassId;
    }).length;

    return [
      student.name,
      student.gender === 'male' ? 'M' : 'F',
      student.isEAL ? 'Yes' : 'No',
      student.behavior.toString(),
      student.ability.toString(),
      student.ehcp ? 'Yes' : 'No',
      student.send ? 'Yes' : 'No',
      student.monitoringSen ? 'Yes' : 'No',
      student.ppg ? 'Yes' : 'No',
      mustBeWithName,
      assignedClass?.name || 'Unassigned',
      preferredFriendNames || '-',
      `${friendsInClass}/${student.preferredFriends.length}`,
      keepApartNames || '-',
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        // Escape cells containing commas or quotes
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ),
  ].join('\n');

  downloadFile(csvContent, 'class-assignments.csv', 'text/csv');
}

export function exportClassSummaryCSV(
  classStatistics: ClassStatistics[],
  classes: Class[]
): void {
  const headers = [
    'Class Name',
    'Teacher',
    'Total Students',
    'Male',
    'Female',
    'EAL Count',
    'EAL %',
    'Avg Satisfaction',
  ];

  const rows = classStatistics.map((stats) => {
    const cls = classes.find((c) => c.id === stats.classId);
    return [
      stats.className,
      cls?.teacherName || '-',
      stats.totalStudents.toString(),
      stats.genderDistribution.male.toString(),
      stats.genderDistribution.female.toString(),
      stats.ealCount.toString(),
      `${stats.ealPercentage.toFixed(1)}%`,
      `${stats.averageSatisfaction.toFixed(1)}%`,
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  downloadFile(csvContent, 'class-summary.csv', 'text/csv');
}

export function exportToPDF(
  students: Student[],
  classes: Class[],
  classStatistics: ClassStatistics[] | undefined,
  getStudentById: (id: string) => Student | undefined
): void {
  // Create HTML content for the PDF
  const htmlContent = generatePDFHTML(students, classes, classStatistics, getStudentById);

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

function generatePDFHTML(
  students: Student[],
  classes: Class[],
  classStatistics: ClassStatistics[] | undefined,
  getStudentById: (id: string) => Student | undefined
): string {
  const now = new Date().toLocaleDateString();

  let classesHTML = '';
  for (const cls of classes) {
    const classStudents = sortStudentsAlphabetically(
      students.filter((student) => student.assignedClassId === cls.id)
    );
    const stats = classStatistics?.find((cs) => cs.classId === cls.id);
    const behaviorAverage =
      classStudents.length > 0
        ? classStudents.reduce((sum, s) => sum + s.behavior, 0) / classStudents.length
        : 0;
    const abilityAverage =
      classStudents.length > 0
        ? classStudents.reduce((sum, s) => sum + s.ability, 0) / classStudents.length
        : 0;

    classesHTML += `
      <div class="class-section">
        <h2>${cls.name}${cls.teacherName ? ` - ${cls.teacherName}` : ''}</h2>
        <div class="stats">
          <span>Students: ${classStudents.length}</span>
          <span>Male: ${classStudents.filter((s) => s.gender === 'male').length}</span>
          <span>Female: ${classStudents.filter((s) => s.gender === 'female').length}</span>
          <span>EAL: ${classStudents.filter((s) => s.isEAL).length}</span>
          <span>EHCP: ${classStudents.filter((s) => s.ehcp).length}</span>
          <span>SEND: ${classStudents.filter((s) => s.send).length}</span>
          <span>Mon. SEN: ${classStudents.filter((s) => s.monitoringSen).length}</span>
          <span>PPG: ${classStudents.filter((s) => s.ppg).length}</span>
          <span>Behaviour Avg: ${behaviorAverage.toFixed(2)}</span>
          <span>Ability Avg: ${abilityAverage.toFixed(2)}</span>
          ${stats ? `<span>Satisfaction: ${stats.averageSatisfaction.toFixed(0)}%</span>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Gender</th>
              <th>EAL</th>
              <th>Behaviour</th>
              <th>Ability</th>
              <th>EHCP</th>
              <th>SEND</th>
              <th>Mon. SEN</th>
              <th>PPG</th>
              <th>Must Be With</th>
              <th>Preferred Friends</th>
              <th>Matched</th>
            </tr>
          </thead>
          <tbody>
            ${classStudents
              .map((student) => {
                const friendsList = student.preferredFriends.map((fId) => {
                  const friend = getStudentById(fId);
                  if (!friend) return null;
                  const inSameClass = friend.assignedClassId === cls.id;
                  return `<span class="${inSameClass ? 'friend-matched' : 'friend-unmatched'}">${friend.name}</span>`;
                }).filter(Boolean).join(', ') || '-';
                const friendsInClass = student.preferredFriends.filter((fId) => {
                  const friend = getStudentById(fId);
                  return friend && friend.assignedClassId === cls.id;
                }).length;
                const mustBeWithName = student.mustBeWithStudentId
                  ? getStudentById(student.mustBeWithStudentId)?.name || '-'
                  : '-';
                return `
                  <tr>
                    <td>${student.name}</td>
                    <td>${student.gender === 'male' ? 'M' : 'F'}</td>
                    <td>${student.isEAL ? 'Yes' : '-'}</td>
                    <td>${student.behavior}</td>
                    <td>${student.ability}</td>
                    <td>${student.ehcp ? 'Yes' : '-'}</td>
                    <td>${student.send ? 'Yes' : '-'}</td>
                    <td>${student.monitoringSen ? 'Yes' : '-'}</td>
                    <td>${student.ppg ? 'Yes' : '-'}</td>
                    <td>${mustBeWithName}</td>
                    <td>${friendsList}</td>
                    <td>${friendsInClass}/${student.preferredFriends.length}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Class Assignments</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          font-size: 18px;
          margin-bottom: 5px;
        }
        .date {
          color: #666;
          margin-bottom: 20px;
        }
        .class-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        h2 {
          font-size: 14px;
          background: #f0f0f0;
          padding: 8px;
          margin: 0 0 10px 0;
        }
        .stats {
          margin-bottom: 10px;
          color: #666;
        }
        .stats span {
          margin-right: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 6px 8px;
          text-align: left;
        }
        th {
          background: #f5f5f5;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background: #fafafa;
        }
        .friend-matched {
          color: #15803d;
          font-weight: 500;
        }
        .friend-unmatched {
          color: #6b7280;
        }
        @media print {
          body {
            padding: 0;
          }
          .class-section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <h1>Class Assignments</h1>
      <div class="date">Generated: ${now}</div>
      ${classesHTML}
    </body>
    </html>
  `;
}

export async function exportToExcel(
  students: Student[],
  classes: Class[],
  getStudentById: (id: string) => Student | undefined
): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF5F5F5' },
  };
  const headerFont: Partial<ExcelJS.Font> = { bold: true };
  const headerBorder: Partial<ExcelJS.Borders> = {
    bottom: { style: 'thin', color: { argb: 'FFDDE1E7' } },
  };

  for (const cls of classes) {
    const classStudents = sortStudentsAlphabetically(
      students.filter((s) => s.assignedClassId === cls.id)
    );

    const sheetName = cls.name.slice(0, 31);
    const sheet = workbook.addWorksheet(sheetName);

    sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];

    sheet.columns = [
      { header: 'Name', key: 'name', width: 24 },
      { header: 'Gender', key: 'gender', width: 9 },
      { header: 'EAL', key: 'eal', width: 7 },
      { header: 'Behaviour', key: 'behavior', width: 10 },
      { header: 'Ability', key: 'ability', width: 9 },
      { header: 'EHCP', key: 'ehcp', width: 7 },
      { header: 'SEND', key: 'send', width: 7 },
      { header: 'Mon. SEN', key: 'monitoringSen', width: 11 },
      { header: 'PPG', key: 'ppg', width: 7 },
      { header: 'Must Be With', key: 'mustBeWith', width: 20 },
      { header: 'Preferred Friends', key: 'friends', width: 36 },
      { header: 'Matched', key: 'matched', width: 10 },
      { header: 'Keep Apart From', key: 'keepApart', width: 36 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.border = headerBorder;
    });

    for (const student of classStudents) {
      const mustBeWithName = student.mustBeWithStudentId
        ? getStudentById(student.mustBeWithStudentId)?.name ?? '-'
        : '-';
      const friendNames = student.preferredFriends
        .map((id) => getStudentById(id)?.name)
        .filter(Boolean)
        .join('; ') || '-';
      const friendsInClass = student.preferredFriends.filter((fId) => {
        const friend = getStudentById(fId);
        return friend && friend.assignedClassId === cls.id;
      }).length;
      const keepApartNames = student.keepApartFrom
        .map((id) => getStudentById(id)?.name)
        .filter(Boolean)
        .join('; ') || '-';

      sheet.addRow({
        name: student.name,
        gender: student.gender === 'male' ? 'M' : 'F',
        eal: student.isEAL ? 'Yes' : 'No',
        behavior: student.behavior,
        ability: student.ability,
        ehcp: student.ehcp ? 'Yes' : 'No',
        send: student.send ? 'Yes' : 'No',
        monitoringSen: student.monitoringSen ? 'Yes' : 'No',
        ppg: student.ppg ? 'Yes' : 'No',
        mustBeWith: mustBeWithName,
        friends: friendNames,
        matched: `${friendsInClass}/${student.preferredFriends.length}`,
        keepApart: keepApartNames,
      });
    }
  }

  // Summary sheet
  const summary = workbook.addWorksheet('Summary');
  summary.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];
  summary.columns = [
    { header: 'Class', key: 'name', width: 20 },
    { header: 'Teacher', key: 'teacher', width: 20 },
    { header: 'Total', key: 'total', width: 8 },
    { header: 'Male', key: 'male', width: 8 },
    { header: 'Female', key: 'female', width: 8 },
    { header: 'EAL', key: 'eal', width: 7 },
    { header: 'EHCP', key: 'ehcp', width: 7 },
    { header: 'SEND', key: 'send', width: 7 },
    { header: 'Mon. SEN', key: 'monitoringSen', width: 11 },
    { header: 'PPG', key: 'ppg', width: 7 },
    { header: 'S&L', key: 'sl', width: 7 },
    { header: 'Friend Match %', key: 'friendMatch', width: 15 },
  ];

  const summaryHeader = summary.getRow(1);
  summaryHeader.eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.border = headerBorder;
  });

  for (const cls of classes) {
    const classStudents = students.filter((s) => s.assignedClassId === cls.id);
    const avgSatisfaction =
      classStudents.length > 0
        ? classStudents.reduce((sum, s) => {
            const friendsInClass = s.preferredFriends.filter((fId) => {
              const friend = getStudentById(fId);
              return friend && friend.assignedClassId === cls.id;
            }).length;
            return sum + (s.preferredFriends.length > 0 ? (friendsInClass / s.preferredFriends.length) * 100 : 100);
          }, 0) / classStudents.length
        : 0;

    summary.addRow({
      name: cls.name,
      teacher: cls.teacherName || '-',
      total: classStudents.length,
      male: classStudents.filter((s) => s.gender === 'male').length,
      female: classStudents.filter((s) => s.gender === 'female').length,
      eal: classStudents.filter((s) => s.isEAL).length,
      ehcp: classStudents.filter((s) => s.ehcp).length,
      send: classStudents.filter((s) => s.send).length,
      monitoringSen: classStudents.filter((s) => s.monitoringSen).length,
      ppg: classStudents.filter((s) => s.ppg).length,
      sl: classStudents.filter((s) => s.sl).length,
      friendMatch: `${avgSatisfaction.toFixed(1)}%`,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'class-assignments.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
