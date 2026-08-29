import { QuestionImageValidationError } from "@/application/question-images";
import { getQuestionImageService } from "@/composition/question-images";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Partial<{
      originalName: string;
      contentType: string;
      byteSize: number;
    }>;
    if (
      typeof body.originalName !== "string" ||
      typeof body.contentType !== "string" ||
      typeof body.byteSize !== "number"
    ) {
      return Response.json({ message: "Image upload details are invalid." }, { status: 400 });
    }
    return Response.json(await getQuestionImageService().authorize({
      originalName: body.originalName,
      contentType: body.contentType,
      byteSize: body.byteSize,
    }));
  } catch (error) {
    if (error instanceof QuestionImageValidationError) {
      return Response.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return Response.json({ message: "Image upload details are invalid." }, { status: 400 });
    }
    return Response.json({ message: "Could not authorize the image upload." }, { status: 500 });
  }
}
