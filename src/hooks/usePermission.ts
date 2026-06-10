import { UserRole } from '@/types';
import { checkPermission } from '@/rules';

export function usePermission(
  role: UserRole,
  currentAgentId: string | null,
) {
  const canAssign = () => checkPermission(role, 'assign');
  const canAssignAny = () => checkPermission(role, 'assignAny');
  const canTransferAll = () => checkPermission(role, 'transfer');
  const canTransferOwn = () => checkPermission(role, 'transferOwn');
  const canFinishAll = () => checkPermission(role, 'finish');
  const canFinishOwn = () => checkPermission(role, 'finishOwn');
  const canUpgradeAssign = () => checkPermission(role, 'upgradeAssign');
  const canExport = () => checkPermission(role, 'export');
  const canChangeOwnStatus = () => checkPermission(role, 'changeOwnStatus');
  const canChangeOtherStatus = () => checkPermission(role, 'changeOtherStatus');

  const canTransferCall = (isOwn: boolean, _assignedAgentId: string | null) => {
    if (isOwn) return canTransferOwn();
    return canTransferAll();
  };

  const canFinishCall = (isOwn: boolean, _assignedAgentId: string | null) => {
    if (isOwn) return canFinishOwn();
    return canFinishAll();
  };

  return {
    canAssign,
    canAssignAny,
    canTransferAll,
    canTransferOwn,
    canFinishAll,
    canFinishOwn,
    canUpgradeAssign,
    canExport,
    canChangeOwnStatus,
    canChangeOtherStatus,
    canFinishCall,
    canTransferCall,
  };
}
