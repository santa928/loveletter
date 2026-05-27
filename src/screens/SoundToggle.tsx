interface SoundToggleProps {
  muted: boolean;
  onToggle(): void;
}

/**
 * Keeps the shared-device sound preference available without obscuring play.
 */
export function SoundToggle({ muted, onToggle }: SoundToggleProps) {
  return (
    <button
      aria-label={muted ? "効果音を有効にする" : "効果音をミュート"}
      className="sound-toggle"
      onClick={onToggle}
      type="button"
    >
      <span aria-hidden="true">SOUND</span>
      <strong aria-hidden="true">{muted ? "OFF" : "ON"}</strong>
    </button>
  );
}
