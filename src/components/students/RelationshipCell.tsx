import { useState } from 'react';
import { useStudentStore } from '../../stores';
import type { Student } from '../../types';
import { StudentSelect } from './StudentSelect';
import { InlinePopover } from './InlinePopover';

type RelationshipType = 'friends' | 'keepApart' | 'mustBeWith';

interface Props {
  student: Student;
  type: RelationshipType;
}

export function RelationshipCell({ student, type }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { students, updateStudent, setMustBeWithPair } = useStudentStore();

  const ids: string[] =
    type === 'friends'
      ? student.preferredFriends
      : type === 'keepApart'
        ? student.keepApartFrom ?? []
        : student.mustBeWithStudentId
          ? [student.mustBeWithStudentId]
          : [];

  const label = (): string => {
    if (ids.length === 0) return '—';
    const first = students.find((s) => s.id === ids[0])?.name ?? 'Unknown';
    const firstName = first.split(' ')[0];
    return ids.length === 1 ? firstName : `${firstName} +${ids.length - 1}`;
  };

  const handleChange = (newIds: string[]) => {
    if (type === 'friends') {
      updateStudent(student.id, { preferredFriends: newIds });
    } else if (type === 'keepApart') {
      updateStudent(student.id, { keepApartFrom: newIds });
    } else {
      setMustBeWithPair(student.id, newIds[0] ?? null);
    }
  };

  const activeColor =
    type === 'friends'
      ? 'text-green-700 bg-green-50 hover:bg-green-100'
      : type === 'keepApart'
        ? 'text-red-700 bg-red-50 hover:bg-red-100'
        : 'text-purple-700 bg-purple-50 hover:bg-purple-100';

  return (
    <>
      <button
        onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}
        className={`inline-flex px-2 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
          ids.length > 0 ? activeColor : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        {label()}
      </button>
      <InlinePopover anchorEl={anchorEl} onClose={() => setAnchorEl(null)}>
        <div className="p-3 w-64">
          <StudentSelect
            students={students}
            selectedIds={ids}
            excludeSelf={student.id}
            excludeIds={
              type === 'friends'
                ? [...(student.keepApartFrom ?? []), ...(student.mustBeWithStudentId ? [student.mustBeWithStudentId] : [])]
                : type === 'keepApart'
                  ? [...student.preferredFriends, ...(student.mustBeWithStudentId ? [student.mustBeWithStudentId] : [])]
                  : student.keepApartFrom ?? []
            }
            onChange={handleChange}
            maxSelections={
              type === 'friends' ? 3 : type === 'mustBeWith' ? 1 : undefined
            }
            placeholder={
              type === 'friends'
                ? 'Add friend...'
                : type === 'keepApart'
                  ? 'Add student...'
                  : 'Select student...'
            }
          />
        </div>
      </InlinePopover>
    </>
  );
}
