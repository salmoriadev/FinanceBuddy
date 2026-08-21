import { Global, Module } from "@nestjs/common";
import { ReportsCacheInvalidationService } from "./reports-cache-invalidation.service";

@Global()
@Module({
  providers: [ReportsCacheInvalidationService],
  exports: [ReportsCacheInvalidationService],
})
export class ReportsCacheModule {}
