// Accessible radio group styled as a segmented button row.
function SegmentedControl({ legend, name, options, value, onChange }) {
  return (
    <fieldset className="segmented">
      <legend className="segmented-legend">{legend}</legend>
      <div className="segmented-options">
        {options.map((option) => (
          <label key={option.value} className="segmented-option">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default SegmentedControl;