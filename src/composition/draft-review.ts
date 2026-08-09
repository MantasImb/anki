import { getPostgresCardDraftReviewRepository } from "../adapters/persistence/postgres/database";
import { createCardDraftReviewService } from "../application/draft-review";

export function getCardDraftReviewService() {
  return createCardDraftReviewService(getPostgresCardDraftReviewRepository());
}
