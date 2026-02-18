from icu import Transliterator

class RussianTransliterator:
    def __init__(self):
        self.base_trans = Transliterator.createInstance("Russian-Latin/BGN")
        self.exceptions = {
            "Эйдлин": "Eidlin",
            "Желоховцев": "Zhelokhovtsev",
            "Кравцова": "Kravtsova",
            "Пружинин": "Pruzhinin",
        }

    def transliterate(self, text: str) -> str:
        if text in self.exceptions:
            result = self.exceptions[text]
        else:
            result = self.base_trans.transliterate(text)

        if result:
            result = result[0].upper() + result[1:]
        return result