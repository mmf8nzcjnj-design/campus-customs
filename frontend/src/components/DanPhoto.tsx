/** The real Handsome Dan (photo), cropped to his face in a circle.
 * Used as the chat avatar; `talking` adds a pulsing ring while a reply loads. */
export default function DanPhoto({ size = 56, talking = false }: { size?: number; talking?: boolean }) {
  return (
    <span
      className={`dan-photo${talking ? ' talking' : ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Friendly Bulldog"
    />
  )
}
