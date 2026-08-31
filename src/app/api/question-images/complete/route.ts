import { QuestionImageValidationError } from "@/application/question-images";
import { getQuestionImageService } from "@/composition/question-images";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Partial<{ uploadId: string }>;
    if (typeof body.uploadId !== "string") {
      return Response.json({ message: "Image upload details are invalid." }, { status: 400 });
    }
    const upload = await getQuestionImageService().complete(body.uploadId);
    return Response.json({ uploadId: upload.id });
  } catch (error) {
    if (error instanceof QuestionImageValidationError) {
      return Response.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return Response.json({ message: "Image upload details are invalid." }, { status: 400 });
    }
    return Response.json({ message: "Could not complete the image upload." }, { status: 500 });
  }
}
