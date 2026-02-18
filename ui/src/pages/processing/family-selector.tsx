import { type FC } from 'react';

interface FamilySelectorProps {
  family: string;
  setFamily: (value: string) => void;
  families: Record<string, { name: string }>;
}

export const FamilySelector: FC<FamilySelectorProps> = ({ family, setFamily, families }) => (
  <div className="flex justify-between items-center p-4 border rounded-2xl">
    <div className="text-sm font-medium">Семейство шаблонов</div>
    <select
      value={family}
      onChange={(e) => setFamily(e.target.value)}
      className="border rounded-xl px-3 py-2 text-sm"
    >
      {Object.entries(families).map(([key, value]) => (
        <option key={key} value={key}>
          {value.name}
        </option>
      ))}
    </select>
  </div>
);
