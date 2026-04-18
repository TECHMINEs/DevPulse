import { useQuery } from '@tanstack/react-query';
import { getWellness } from '../api/analytics';

export const useWellness = (days = 90) => {
  return useQuery({
    queryKey: ['wellness', days],
    queryFn: () => getWellness(days),
    staleTime: 5 * 60 * 1000,
  });
};

export default useWellness;
