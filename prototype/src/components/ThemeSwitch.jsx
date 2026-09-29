import { useId } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

const options = [
  { value: 'light', label: 'Hell', Icon: Sun },
  { value: 'dark', label: 'Dunkel', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

// Umschalter Hell/Dunkel/System – echte Radios (Pfeiltasten wechseln), je Instanz eigener Name
export default function ThemeSwitch({ value, onChange }) {
  const name = useId();
  return (
    <fieldset className="segmented">
      <legend className="segmented__legend">Darstellung</legend>
      <div className="segmented__options">
        {options.map(({ value: v, label, Icon }) => (
          <label key={v} className="segmented__option">
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
            <span className="segmented__face">
              <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
