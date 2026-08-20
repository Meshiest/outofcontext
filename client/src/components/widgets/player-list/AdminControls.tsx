import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button/Button';

export interface AdminControlsProps {
  /** The row's player id, passed back to the callbacks. */
  playerId: string;
  /** Show the "Change" (grant admin) button. The parent gates this on mode + connected + not-self. */
  isAdminMode?: boolean;
  /** Show the "Remove" button. The parent gates this on mode + connected + not-self. */
  isRemoveMode?: boolean;
  onGrantAdmin?: (playerId: string) => void;
  onRemovePlayer?: (playerId: string) => void;
}

/**
 * Per-row admin actions. Renders a red "Remove" button in remove mode and a blue "Change" (grant
 * admin) button in grant mode. Which mode is active for a given row is decided by the parent.
 */
export function AdminControls({
  playerId,
  isAdminMode = false,
  isRemoveMode = false,
  onGrantAdmin,
  onRemovePlayer,
}: AdminControlsProps) {
  const { t } = useTranslation('common');
  return (
    <>
      {isRemoveMode && (
        <Button
          size="sm"
          compact
          color="red"
          className="h-6 px-1.5"
          onClick={() => onRemovePlayer?.(playerId)}
        >
          {t('playerList.remove')}
        </Button>
      )}
      {isAdminMode && (
        <Button
          size="sm"
          compact
          color="blue"
          className="h-6 px-1.5"
          onClick={() => onGrantAdmin?.(playerId)}
        >
          {t('playerList.change')}
        </Button>
      )}
    </>
  );
}
