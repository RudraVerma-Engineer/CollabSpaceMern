/** Renders tags/skills. Pass `onSelect` to make the chips clickable filters. */
const ChipList = ({ items = [], prefix = "", onSelect }) =>
  items.length === 0 ? null : (
    <div className="chip-list">
      {items.map((item) =>
        onSelect ? (
          <button key={item} type="button" className="chip" onClick={() => onSelect(item)}>
            {prefix}
            {item}
          </button>
        ) : (
          <span key={item} className="chip">
            {prefix}
            {item}
          </span>
        ),
      )}
    </div>
  );

export default ChipList;
