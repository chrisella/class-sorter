import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type Column,
} from '@tanstack/react-table';
import { useStudentStore, useClassStore } from '../../stores';
import type { Student } from '../../types';
import { EditStudentModal } from './EditStudentModal';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { SourceClassChip } from './SourceClassChip';
import { RelationshipCell } from './RelationshipCell';

const columnHelper = createColumnHelper<Student>();

function SortHeader({ column, label }: { column: Column<Student, unknown>; label: string }) {
  const sortState = column.getIsSorted();
  const indicator = sortState === 'asc' ? '↑' : sortState === 'desc' ? '↓' : '↕';
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
    >
      <span>{label}</span>
      <span className={sortState ? 'text-blue-600' : 'text-gray-400'}>{indicator}</span>
    </button>
  );
}

export function StudentTable() {
  const { students, deleteStudent, updateStudent } = useStudentStore();
  const { sourceClasses } = useClassStore();
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');

  const filteredStudents = useMemo(
    () =>
      search.trim()
        ? students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
        : students,
    [students, search]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: ({ column }) => <SortHeader column={column} label="Name" />,
        enableSorting: true,
        cell: (info) => (
          <span className="font-medium text-gray-900">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('sourceClassId', {
        id: 'sourceClass',
        header: ({ column }) => <SortHeader column={column} label="Source" />,
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const nameA = sourceClasses.find((sc) => sc.id === rowA.original.sourceClassId)?.name ?? '';
          const nameB = sourceClasses.find((sc) => sc.id === rowB.original.sourceClassId)?.name ?? '';
          return nameA.localeCompare(nameB);
        },
        cell: (info) => <SourceClassChip student={info.row.original} />,
      }),
      columnHelper.accessor('gender', {
        header: ({ column }) => <SortHeader column={column} label="Gender" />,
        enableSorting: true,
        cell: (info) => {
          const student = info.row.original;
          const isMale = info.getValue() === 'male';
          return (
            <button
              onClick={() => updateStudent(student.id, { gender: isMale ? 'female' : 'male' })}
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                isMale
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
              }`}
              title={`Click to change to ${isMale ? 'Female' : 'Male'}`}
            >
              {isMale ? 'M' : 'F'}
            </button>
          );
        },
      }),
      columnHelper.accessor('behavior', {
        header: ({ column }) => <SortHeader column={column} label="Behavior" />,
        enableSorting: true,
        cell: (info) => {
          const student = info.row.original;
          const value = info.getValue();
          const nextValue =
            value === 1 || value === 2 || value === 3
              ? (value === 3 ? 1 : ((value + 1) as 1 | 2 | 3))
              : 1;
          return (
            <button
              onClick={() => updateStudent(student.id, { behavior: nextValue })}
              className="inline-flex px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              title={`Click to change to ${nextValue}`}
            >
              {value}
            </button>
          );
        },
      }),
      columnHelper.accessor('ability', {
        header: ({ column }) => <SortHeader column={column} label="Ability" />,
        enableSorting: true,
        cell: (info) => {
          const student = info.row.original;
          const value = info.getValue();
          const nextValue =
            value === 1 || value === 2 || value === 3
              ? (value === 3 ? 1 : ((value + 1) as 1 | 2 | 3))
              : 1;
          return (
            <button
              onClick={() => updateStudent(student.id, { ability: nextValue })}
              className="inline-flex px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors bg-violet-100 text-violet-700 hover:bg-violet-200"
              title={`Click to change to ${nextValue}`}
            >
              {value}
            </button>
          );
        },
      }),
      columnHelper.accessor('isEAL', {
        header: ({ column }) => <SortHeader column={column} label="EAL" />,
        enableSorting: true,
        cell: (info) => {
          const student = info.row.original;
          const isEAL = info.getValue();
          return (
            <button
              onClick={() => updateStudent(student.id, { isEAL: !isEAL })}
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                isEAL
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={`Click to ${isEAL ? 'remove' : 'mark as'} EAL`}
            >
              {isEAL ? 'Yes' : 'No'}
            </button>
          );
        },
      }),
      columnHelper.accessor('ehcp', {
        header: ({ column }) => <SortHeader column={column} label="EHCP" />,
        enableSorting: true,
        cell: (info) => {
          const student = info.row.original;
          const value = info.getValue();
          return (
            <button
              onClick={() => updateStudent(student.id, { ehcp: !value })}
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                value
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={`Click to ${value ? 'unset' : 'set'} EHCP`}
            >
              {value ? 'Yes' : 'No'}
            </button>
          );
        },
      }),
      columnHelper.accessor('send', {
        header: ({ column }) => <SortHeader column={column} label="SEND" />,
        enableSorting: true,
        cell: (info) => {
          const student = info.row.original;
          const value = info.getValue();
          return (
            <button
              onClick={() => updateStudent(student.id, { send: !value })}
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                value
                  ? 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={`Click to ${value ? 'unset' : 'set'} SEND`}
            >
              {value ? 'Yes' : 'No'}
            </button>
          );
        },
      }),
      columnHelper.accessor('ppg', {
        header: ({ column }) => <SortHeader column={column} label="PPG" />,
        enableSorting: true,
        cell: (info) => {
          const student = info.row.original;
          const value = info.getValue();
          return (
            <button
              onClick={() => updateStudent(student.id, { ppg: !value })}
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                value
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={`Click to ${value ? 'unset' : 'set'} PPG`}
            >
              {value ? 'Yes' : 'No'}
            </button>
          );
        },
      }),
      columnHelper.accessor('sl', {
        header: ({ column }) => <SortHeader column={column} label="S&L" />,
        enableSorting: true,
        cell: (info) => {
          const student = info.row.original;
          const value = info.getValue();
          return (
            <button
              onClick={() => updateStudent(student.id, { sl: !value })}
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                value
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={`Click to ${value ? 'unset' : 'set'} S&L`}
            >
              {value ? 'Yes' : 'No'}
            </button>
          );
        },
      }),
      columnHelper.accessor((row) => row.preferredFriends.length, {
        id: 'friends',
        header: ({ column }) => <SortHeader column={column} label="Friends" />,
        enableSorting: true,
        cell: (info) => <RelationshipCell student={info.row.original} type="friends" />,
      }),
      columnHelper.display({
        id: 'keepApart',
        header: 'Keep apart',
        cell: (info) => <RelationshipCell student={info.row.original} type="keepApart" />,
      }),
      columnHelper.display({
        id: 'mustBeWith',
        header: 'Must be with',
        cell: (info) => <RelationshipCell student={info.row.original} type="mustBeWith" />,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingStudent(info.row.original)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button
              onClick={() => setDeletingStudent(info.row.original)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        ),
      }),
    ],
    [updateStudent, sourceClasses]
  );

  const table = useReactTable({
    data: filteredStudents,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-200">
          <div className="relative w-56">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pupils…"
              className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
        />
      )}

      {deletingStudent && (
        <ConfirmDialog
          title="Delete Student"
          message={`Are you sure you want to delete ${deletingStudent.name}?`}
          confirmLabel="Delete"
          onConfirm={() => {
            deleteStudent(deletingStudent.id);
            setDeletingStudent(null);
          }}
          onCancel={() => setDeletingStudent(null)}
        />
      )}
    </>
  );
}
