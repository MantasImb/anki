# Norwegian Learning

This context supports manually written flashcards and turns Norwegian source text into reviewable card drafts that a learner can approve for study.

## Language

**Learner**:
The sole person who creates and studies the learning material in this application.
_Avoid_: User, Account

**Source Text**:
Norwegian text, typically a chapter or curriculum unit rather than an entire book, supplied as the basis for generating learning material.

**Generation Attempt**:
A single request that applies the current generation instructions to one source text to create a complete collection of card drafts.

**Card Draft**:
An LLM-proposed front and back that must be reviewed before it can become a flashcard.
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
The number of consecutive correct study results for a flashcard, capped at three.

**Retry Gap**:
The three other flashcards that must be studied after an incorrect result before that flashcard may reappear.

## Relationships

- The **Learner** supplies **Source Text**, reviews **Card Drafts**, and studies **Flashcards**.
- All **Source Text**, **Card Drafts**, **Flashcards**, and **Study Results** belong to the single **Learner**.
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
- An approved **Card Draft** becomes exactly one **Flashcard**.
- A **Flashcard** created from an approved **Card Draft** retains its relationship to the originating **Source Text**.
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

## Example dialogue

> **Developer:** “Does the learner need to write every **Flashcard** manually?”
> **Domain expert:** “No. The learner can enter it manually or provide **Source Text**. Generated **Card Drafts** must be reviewed before they become **Flashcards**.”

## Flagged ambiguities

- “Add flashcard” names the overall entry workflow; LLM-generated content remains a **Card Draft** until the learner approves it.
- “Draft” applies only to LLM-generated content; manually entered content becomes a **Flashcard** when saved.
- A separate “Learning Item” abstraction is deliberately deferred; the current domain model uses a simple two-sided **Flashcard**.
- Quizzing is outside v1 and has no defined domain behavior yet.
