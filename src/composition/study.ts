import { getPostgresStudyRepository } from "../adapters/persistence/postgres/database";
import { createStudyService } from "../application/study";

export function getStudyService() {
  return createStudyService(getPostgresStudyRepository());
}
