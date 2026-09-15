type Props = { className?: string };

/** Pedejá P mark — always the white P with the purple signature dot. */
export function BrandMark({ className = '' }: Props) {
  return (
    <span className={`brand-mark-lock ${className}`} aria-label="Pedejá">
      <img src="/brand/pedeja-mark-white.svg" alt="" aria-hidden="true" />
    </span>
  );
}
