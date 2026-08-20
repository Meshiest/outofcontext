import { router, publicProcedure } from '../trpc.js';
import { computeServerInfo } from '../../stats.js';
import { VERSION } from '../../version.js';

export const serverRouter = router({
  info: publicProcedure.query(() => computeServerInfo()),
  version: publicProcedure.query(() => VERSION),
});
