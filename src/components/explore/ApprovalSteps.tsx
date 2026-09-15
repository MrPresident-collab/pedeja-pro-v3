import type { ExploreApprovalStep } from '@/data/explore';

type Props = {
  steps: ExploreApprovalStep[];
};

export function ApprovalSteps({ steps }: Props) {
  return (
    <ol className="approval-steps">
      {steps.map((step, index) => (
        <li className="approval-step" key={step.title}>
          <span className="approval-step-num" aria-hidden="true">
            {index + 1}
          </span>
          <span className="approval-step-main">
            <strong>{step.title}</strong>
            {step.detail && <small>{step.detail}</small>}
          </span>
        </li>
      ))}
    </ol>
  );
}