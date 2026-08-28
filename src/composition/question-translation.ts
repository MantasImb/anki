import "server-only";

import { TranslationServiceClient } from "@google-cloud/translate";
import { createGoogleQuestionTranslator } from "@/adapters/translation/google-question-translator";
import { requireGoogleTranslationConfiguration } from "@/adapters/translation/google-translation-configuration";
import { createQuestionTranslationService } from "@/application/question-translation";

export function getQuestionTranslationService() {
  const configuration = requireGoogleTranslationConfiguration(process.env);
  const client = new TranslationServiceClient({
    credentials: configuration.credentials,
    projectId: configuration.projectId,
  });
  const translator = createGoogleQuestionTranslator({
    client,
    location: configuration.location,
    logger: {
      translationFailed(event) {
        console.error("Question translation failed", event);
      },
    },
    projectId: configuration.projectId,
    timeoutMilliseconds: configuration.timeoutMilliseconds,
  });
  return createQuestionTranslationService(translator);
}
