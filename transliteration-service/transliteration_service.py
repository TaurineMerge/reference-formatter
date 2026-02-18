import transliteration_pb2
import transliteration_pb2_grpc
import grpc
from transliterator import RussianTransliterator

class TransliterationService(
    transliteration_pb2_grpc.TransliterationServiceServicer
):
    def __init__(self):
        self.translit = RussianTransliterator()

    def Transliterate(self, request, context):
        try:
            result = self.translit.transliterate(request.text)
            return transliteration_pb2.TransliterationResponse(
                transliterated_name=result
            )
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return transliteration_pb2.TransliterationResponse()