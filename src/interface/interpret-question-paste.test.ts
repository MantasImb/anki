import { describe, expect, it } from "vitest";
import { interpretQuestionPaste } from "./interpret-question-paste";

describe("Question paste interpretation", () => {
  it("extracts the prompt and four ordered answers", () => {
    expect(interpretQuestionPaste("Rett til å tilby drosjetjenester i et bestemt område kalles…\nEnerett\nReisebevis\nRutestyring\nFelleskapstillatelse")).toEqual({
      prompt: "Rett til å tilby drosjetjenester i et bestemt område kalles…",
      answers: ["Enerett", "Reisebevis", "Rutestyring", "Felleskapstillatelse"],
    });
  });
});

it.each(["\n", "\r\n", "\r"])("ignores blank lines and trims edges across %j line endings", (newline) => {
  expect(interpretQuestionPaste(["", "  Hva nå?  ", "  ", "  ja  takk  ", " nei ", "ja  takk", "4", "5", ""].join(newline))).toEqual({
    prompt: "Hva nå?", answers: ["ja  takk", "nei", "ja  takk", "4", "5"],
  });
});

it("accepts exactly two answers", () => {
  expect(interpretQuestionPaste("Hva?\nja\nnei")).toEqual({ prompt: "Hva?", answers: ["ja", "nei"] });
});

it.each(["", " \n\t", "Hva?", "Hva?\nja", "Hva?\n\n ja\n  "])("leaves %j as ordinary paste", (text) => {
  expect(interpretQuestionPaste(text)).toBeUndefined();
});
