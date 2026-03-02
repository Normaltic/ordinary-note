interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected';
  synced: boolean;
}

const statusConfig = {
  connected: { dot: 'bg-green-500', label: '연결됨' },
  connecting: { dot: 'bg-yellow-500 animate-pulse', label: '연결 중...' },
  disconnected: { dot: 'bg-red-500', label: '오프라인' },
} as const;

export function ConnectionStatus({ status, synced }: ConnectionStatusProps) {
  const config = statusConfig[status];
  const label = status === 'connected' && !synced ? '동기화 중...' : config.label;

  return (
    <span className="flex items-center gap-1.5 text-xs text-text-muted">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
}
