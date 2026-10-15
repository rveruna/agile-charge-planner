import { REGIONS } from '../domain/regions';
import { DURATION_OPTIONS, POWER_OPTIONS, type Settings } from '../domain/settings';

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

const WITHIN_LABELS: Record<Settings['within'], string> = {
  all: 'All the prices available',
  '6': 'The next 6 hours',
  '12': 'The next 12 hours',
  '24': 'The next 24 hours',
};

function durationLabel(hours: number): string {
  return hours === 1 ? '1 hour' : `${hours} hours`;
}

export function SettingsForm({ settings, onChange }: Props) {
  return (
    <form className="settings" aria-label="Charging settings" onSubmit={(e) => e.preventDefault()}>
      <label>
        Region
        <select
          value={settings.region}
          onChange={(e) => onChange({ region: e.target.value as Settings['region'] })}
        >
          {REGIONS.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name} ({r.code})
            </option>
          ))}
        </select>
      </label>

      <label>
        How long to charge
        <select value={settings.hours} onChange={(e) => onChange({ hours: Number(e.target.value) })}>
          {DURATION_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {durationLabel(h)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Charger power
        <select value={settings.kw} onChange={(e) => onChange({ kw: Number(e.target.value) })}>
          {POWER_OPTIONS.map((kw) => (
            <option key={kw} value={kw}>
              {kw} kW
            </option>
          ))}
        </select>
      </label>

      <label>
        Charge within
        <select
          value={settings.within}
          onChange={(e) => onChange({ within: e.target.value as Settings['within'] })}
        >
          {Object.entries(WITHIN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend>Charging style</legend>
        <label className="choice">
          <input
            type="radio"
            name="mode"
            checked={settings.mode === 'together'}
            onChange={() => onChange({ mode: 'together' })}
          />
          Together, in one unbroken session
        </label>
        <label className="choice">
          <input
            type="radio"
            name="mode"
            checked={settings.mode === 'flexible'}
            onChange={() => onChange({ mode: 'flexible' })}
          />
          Flexible, the charger can pause between cheap slots
        </label>
      </fieldset>
    </form>
  );
}
