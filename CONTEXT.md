# Norwegian Learning

This context supports manually written flashcards, turns Norwegian source text into editable card drafts, and includes learner-authored multiple-choice quizzes for testing Norwegian knowledge.

## Language

**Learner**:
The sole person who creates and studies the learning material in this application.
_Avoid_: User, Account

**Source Text**:
Norwegian text, typically a chapter or curriculum unit rather than an entire book, supplied as the basis for generating learning material.

**Generation Attempt**:
A single request that applies the current generation instructions to one source text to create a complete collection of card drafts.

**Card Draft**:
An LLM-proposed front and back that remains editable or removable until the learner adds the remaining generated collection.
_Avoid_: Generated flashcard

**Generation Instructions**:
Editable guidance that tells the LLM which learning material to select from source text and turn into card drafts.
_Avoid_: System prompt

**Default Generation Template**:
The application's baseline generation instructions used when the learner has not customized them.

**Flashcard**:
A two-sided study item that pairs Norwegian text with its translation.

**Front**:
The Norwegian word, phrase, or sentence shown as the flashcard prompt.

**Back**:
The English translation revealed by the flashcard.

**Study Result**:
A correct or incorrect self-assessment recorded after the learner reveals a flashcard's back.

**Recall Streak**:
The number of consecutive correct results for a Flashcard or Quiz Question, capped at three.

**Retry Gap**:
The three other items from the same study collection that must be studied after an incorrect result before that item may reappear.

**Flashcard Deck**:
A named study collection containing Flashcards.
_Avoid_: Flashcard Topic

**Quiz**:
A named study collection containing Quiz Questions.
_Avoid_: Quiz Topic

**Collection Name**:
The required display name of a Flashcard Deck or Quiz, compared for uniqueness after trimming, collapsing repeated whitespace, and ignoring letter case while preserving Norwegian letters and punctuation as meaningful.

**Quiz Question**:
A learner-authored multiple-choice study item whose prompt is written in Norwegian.

**Answer Option**:
A selectable response to a Quiz Question that is designated as correct or incorrect.

**Single-Choice Question**:
A Quiz Question that requires the Learner to choose exactly one Answer Option.

**Multiple-Choice Question**:
A Quiz Question that requires the Learner to choose more than one Answer Option.

**Translation Help**:
An English rendering of a Quiz Question prompt and all its Answer Options that the Learner may request before answering.

**Question Translation**:
The retained, learner-editable English text for a Quiz Question prompt and all its Answer Options.

**Fallback Translation**:
Learner-supplied English for a Quiz Question prompt and all its Answer Options when automatic translation is unavailable.

**Question Image**:
The single optional JPEG, PNG, WebP, or GIF shown as part of a Quiz Question prompt.

**Quiz Result**:
An append-only record of a Quiz Question outcome, whether Translation Help was used, and when the answer occurred.

**Answer Feedback**:
The post-answer view that identifies correct Answer Options and any incorrect options selected by the Learner.

**Learned Question**:
A Quiz Question whose Recall Streak has reached three and that therefore appears less often while remaining eligible for study.
_Avoid_: Completed Question, Retired Question

**Learned Flashcard**:
A Flashcard whose Recall Streak has reached three and that therefore appears less often while remaining eligible for study.
_Avoid_: Completed Flashcard, Retired Flashcard

**Quiz Progress**:
The percentage of a Quiz's questions that are Learned Questions.
_Avoid_: Quiz Score

**Deck Progress**:
The percentage of a Flashcard Deck's cards that are Learned Flashcards.
_Avoid_: Deck Score

**Learning Status**:
The visible state of a Flashcard or Quiz Question: Learned at a Recall Streak of three and In Progress otherwise.

## Relationships

- The **Learner** supplies **Source Text**, manages **Card Drafts**, and studies **Flashcards** and **Quiz Questions**.
- All **Source Text**, **Card Drafts**, **Flashcard Decks**, **Flashcards**, **Study Results**, **Quizzes**, **Quiz Questions**, and **Quiz Results** belong to the single **Learner**.
- The **Add Flashcard** workflow accepts either manually entered card content or **Source Text**.
- Manually entered card content creates one **Flashcard** immediately.
- The LLM uses one **Source Text** together with **Generation Instructions** to produce **Card Drafts**.
- The **Default Generation Template** selects Norwegian words, phrases, and sentences grounded in the **Source Text**.
- Source-grounded generation may lightly normalize Norwegian wording but does not introduce unrelated vocabulary or facts.
- The **Learner** can view and modify **Generation Instructions** in the application.
- Customized **Generation Instructions** are reused for future generations.
- The **Default Generation Template** provides a recoverable baseline for **Generation Instructions**.
- Resetting **Generation Instructions** restores the **Default Generation Template**.
- One **Source Text** can produce one or more **Card Drafts**.
- **Source Text** is retained after generation.
- A **Generation Attempt** completes synchronously while the **Learner** waits.
- A successful **Generation Attempt** creates its complete collection of **Card Drafts** together.
- A failed **Generation Attempt** creates no partial **Card Drafts** and leaves the **Source Text** available to retry.
- A **Card Draft** is derived from exactly one **Source Text**.
- A **Card Draft** proposes exactly one Norwegian **Front** and one English **Back**.
- Each remaining **Card Draft** becomes exactly one **Flashcard** when the learner adds the generated collection.
- A **Flashcard** created from a **Card Draft** retains its relationship to the originating **Source Text**.
- A manually created **Flashcard** has no originating **Source Text**.
- A **Flashcard** has exactly one **Front** and exactly one **Back**.
- To study a **Flashcard**, the **Learner** considers the **Front**, reveals the **Back**, and marks the answer correct or incorrect.
- A **Flashcard** accumulates **Study Results** over time.
- **Study Results** determine how often a **Flashcard** is selected for study.
- A correct **Study Result** increases the **Recall Streak** by one, up to three.
- An incorrect **Study Result** resets the **Recall Streak** to zero and increases the flashcard's study priority.
- A flashcard answered incorrectly cannot reappear until its **Retry Gap** has passed.
- After its **Retry Gap**, a zero-streak flashcard has the highest study priority.
- Eligible flashcards are selected with weighted variation so higher-priority cards appear more often without creating a fixed order.
- If fewer than three other flashcards are available, every available alternative is shown before the incorrect flashcard may return.
- A flashcard with a **Recall Streak** of three is shown less often but remains eligible for study.
- A Flashcard at Recall Streak three is a **Learned Flashcard**.
- A **Flashcard Deck** contains zero or more **Flashcards**.
- Every **Flashcard Deck** has a name that is unique among Flashcard Decks.
- Every **Flashcard** belongs to exactly one **Flashcard Deck**.
- Creating a Flashcard manually requires a destination **Flashcard Deck**.
- A **Generation Attempt** targets exactly one **Flashcard Deck**, and its approved Card Drafts become Flashcards in that Deck.
- A **Quiz** contains zero or more **Quiz Questions**.
- Every **Quiz** has a name that is unique among Quizzes.
- A **Quiz** and **Flashcard Deck** may have the same name without becoming related.
- **Collection Name** uniqueness uses a normalized comparison so superficial case or whitespace differences conflict while genuinely different names remain valid.
- Every **Quiz Question** belongs to exactly one **Quiz**.
- **Flashcard Decks** and **Quizzes** are independent collections even when they cover the same subject.
- A **Quiz** derives its progress and statistics only from its own **Quiz Questions** and **Quiz Results**.
- A **Flashcard Deck** derives its progress and statistics only from its own **Flashcards** and **Study Results**.
- No shared Topic, progress rollup, or statistical relationship connects a **Quiz** to a **Flashcard Deck**.
- The **Learner** creates **Quiz Questions** and their **Answer Options**.
- A **Quiz Question** has one Norwegian prompt and multiple text-only **Answer Options**, of which one or more may be correct.
- A **Quiz Question** requires at least two **Answer Options** and has no fixed maximum number of options.
- A **Quiz Question** is either a **Single-Choice Question** or a **Multiple-Choice Question**.
- A **Single-Choice Question** is inferred from having exactly one correct **Answer Option**.
- A **Multiple-Choice Question** is inferred from having two or more correct **Answer Options**; question type is not configured separately.
- A **Multiple-Choice Question** is answered correctly only when the Learner selects every correct **Answer Option** and no incorrect **Answer Option**; partial credit is not awarded.
- The study view shuffles **Answer Options** each time a Quiz Question appears to reduce position memorization.
- The Quiz Question management view retains and displays the Learner's authored Answer Option order.
- The New Question form acquires a **Question Translation** for the prompt and all **Answer Options** before the **Quiz Question** is added.
- Quiz Questions and Answer Options are authored in Norwegian, and every **Question Translation** is English.
- V2 has no configurable study or translation languages.
- The Learner may review and edit every part of the generated **Question Translation** before adding the Quiz Question.
- The edited **Question Translation**, rather than the original generated response, is retained with the Quiz Question.
- If automatic translation fails, the completed question form remains available and the Learner may provide a complete **Fallback Translation**.
- A Quiz Question is not added until English exists for its prompt and every **Answer Option**.
- Editing Norwegian prompt or Answer Option text regenerates the corresponding **Question Translation** for review before saving.
- Editing only the correct-answer selection, **Question Image**, or existing **Question Translation** does not request a new translation.
- **Translation Help** uses the retained **Question Translation** and does not translate during study.
- A **Quiz Question** may include at most one **Question Image**.
- The New Question form shows the selected **Question Image** file size.
- A **Question Image** larger than 5 MB produces a visible warning but does not prevent the Learner from adding the question.
- A **Question Image** larger than 25 MB is rejected to protect the application's publicly reachable upload capability.
- JPEG, PNG, WebP, and GIF are supported **Question Image** formats; other formats are rejected.
- Editing a **Quiz Question**, its **Answer Options**, its **Question Translation**, or its **Question Image** preserves its existing **Recall Streak** and **Learning Status**.
- Choosing an **Answer Option** produces a correct or incorrect **Quiz Result**.
- Submitting an answer locks its selected **Answer Options** and shows **Answer Feedback**.
- **Answer Feedback** highlights every correct **Answer Option** and every incorrect **Answer Option** selected by the Learner.
- The current question remains visible with its **Answer Feedback** until the Learner chooses Next Question.
- When **Translation Help** is requested, English replaces the primary text of the Quiz Question prompt and every **Answer Option**.
- While **Translation Help** is visible, each English text has its original Norwegian text displayed beneath it at lower visual emphasis.
- **Translation Help** does not translate, replace, or interpret text contained inside a **Question Image**.
- Requesting **Translation Help** makes the resulting **Quiz Result** incorrect regardless of which **Answer Option** the Learner subsequently chooses.
- **Answer Feedback** presents a translation-assisted attempt as incorrect and includes a compact indicator that **Translation Help** caused that outcome.
- A correct **Quiz Result** increases the Quiz Question's **Recall Streak** by one, up to three.
- An incorrect **Quiz Result**, including one produced by **Translation Help**, resets the Quiz Question's **Recall Streak** to zero.
- **Quiz Results** are append-only and remain retained after their Quiz Question is deleted.
- A **Quiz Result** does not retain the selected **Answer Options** or a snapshot of question content.
- A deleted Quiz Question is excluded immediately from its Quiz's question list, **Quiz Progress**, and active statistics.
- Deleting a **Quiz** requires confirmation showing its Quiz Question count, permanently deletes its active questions, and retains their detached **Quiz Results**.
- Deleting a **Flashcard Deck** requires confirmation showing its Flashcard count, permanently deletes its active cards, and retains their detached **Study Results**.
- Deleting either collection removes its items immediately from learning progress and active statistics.
- Question Image cleanup after deleting a Quiz or Quiz Question is best-effort and does not block deletion.
- A **Learned Question** is shown less often but remains eligible for study.
- Quiz Question selection uses the same decreasing weights as Flashcards: four, three, two, and one for Recall Streaks zero through three.
- An incorrectly answered **Quiz Question** cannot reappear until its three-question **Retry Gap** has passed.
- If fewer than three other Quiz Questions are available, every available alternative appears before the incorrect question may return.
- Quiz scheduling considers only the **Quiz Questions** in the active Quiz.
- A study session targets exactly one selected **Flashcard Deck** or exactly one selected **Quiz**.
- V2 has no study mode that mixes multiple Decks, multiple Quizzes, or both study formats.
- The Learner selects a **Flashcard Deck** before studying, browsing, adding, generating, or editing its Flashcards.
- The Learner selects a **Quiz** before studying, browsing, adding, or editing its Quiz Questions.
- Top-level navigation exposes separate **Flashcard Decks** and **Quizzes** destinations.
- A collection detail view shows its own progress, item list, Study action, and Add action.
- **Quiz Progress** is the number of **Learned Questions** divided by the total number of **Quiz Questions** in that Quiz.
- A Quiz is fully learned only when its **Quiz Progress** reaches 100 percent.
- A fully learned Quiz retains every Quiz Question's progress and remains available for continued study through the same scheduler.
- Reaching 100 percent does not end the Quiz or reset any **Recall Streak**.
- A Quiz is not evaluated by a session score; **Quiz Progress** is its success measure.
- The Quiz Question list shows each question's **Learning Status**.
- The Quiz Question list shows each question's exact zero-through-three **Recall Streak** with low visual emphasis.
- **Deck Progress** is the number of **Learned Flashcards** divided by the total number of Flashcards in that Deck.
- A Flashcard Deck is fully learned only when its **Deck Progress** reaches 100 percent.
- A fully learned Flashcard Deck retains every Flashcard's progress and remains available for continued study through the same scheduler.
- Reaching 100 percent does not reset any Flashcard **Recall Streak**.
- The Flashcard list shows each card's **Learning Status** and exact zero-through-three **Recall Streak** with low visual emphasis.
- An empty **Quiz** shows “No questions yet” instead of **Quiz Progress**.
- An empty **Flashcard Deck** shows “No cards yet” instead of **Deck Progress**.

## Example dialogue

> **Developer:** “Does the learner need to write every **Flashcard** manually?”
> **Domain expert:** “No. The learner can enter it manually or provide **Source Text**. Generated **Card Drafts** can be edited or removed before the learner adds everything that remains.”

> **Developer:** “Does a **Quiz** study together with a similarly named **Flashcard Deck**?”
> **Domain expert:** “No. The Learner selects one collection first. Each format has its own items, progress, results, and study session.”

## Flagged ambiguities

- “Add flashcard” names the overall entry workflow; LLM-generated content remains a **Card Draft** until the learner adds the remaining generated collection.
- “Draft” applies only to LLM-generated content; manually entered content becomes a **Flashcard** when saved.
- A shared “Learning Item” abstraction is deliberately avoided; **Flashcards** and **Quiz Questions** remain distinct study formats with independent collections and results.
- Quizzing was outside v1; v2 introduces **Quiz Questions** as a separate study format.
- “Topic” is not a shared collection: use **Quiz** or **Flashcard Deck** according to the study format.
- “Topic” may be used informally in conversation, but it does not name a domain object or UI collection type.
- Similar names such as “Taxi Quiz” and “Taxi Flashcards” do not create a relationship between the collections.
- “Learned” means reduced study frequency rather than removal from study.
- V2 adds **Quiz Questions** one at a time; bulk question import is deferred.
