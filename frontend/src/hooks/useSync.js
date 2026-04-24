import { useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerSync } from '../api/analytics';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export const useSync = () => {
  const queryClient = useQueryClient();
  const setSyncing = useStore((s) => s.setSyncing);

  const mutation = useMutation({
    mutationFn: triggerSync,
    onSuccess: (data) => {
      setSyncing(true);
      toast.success('Sync started! Watch the progress in real time.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to start sync');
      setSyncing(false);
    },
  });

  return {
    triggerSync: mutation.mutate,
    isTriggering: mutation.isPending,
  };
};

export default useSync;
