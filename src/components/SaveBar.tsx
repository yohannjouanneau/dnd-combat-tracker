
import LabeledTextInput from './common/LabeledTextInput';

type Props = {
  name: string;
  description: string;
  onChange: (patch: { name?: string; description?: string }) => void;
  onBack: () => void;
  onSave: () => void;
};

export default function SaveBar({ name, description, onChange, onBack, onSave }: Props) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <LabeledTextInput id="combatName" label="Name" value={name} placeholder="Encounter name" onChange={(v) => onChange({ name: v })} />
        <LabeledTextInput id="combatDesc" label="Description" value={description} placeholder="Short description" onChange={(v) => onChange({ description: v })} />
        <div className="flex gap-2">
          <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded">Back to List</button>
          <button onClick={onSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Save</button>
        </div>
      </div>
    </div>
  );
}


