type Status = 'en_attente_validation' | 'confirmee';

const labels: Record<Status, string> = {
  en_attente_validation: 'En attente',
  confirmee: 'Confirmée',
};

const styles: Record<Status, string> = {
  en_attente_validation: 'bg-warning-bg text-warning-dark',
  confirmee: 'bg-success-bg text-success-dark',
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
