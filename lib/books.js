// أنواع الكتب: هوايات (الأصلي) — العادات الحلوة — الحروف والأرقام
// الصور نفسها من غير أي كتابة، والكلام (الجملة/الحرف/الرقم) بيتكتب في الـ PDF بخط واضح.
const { STYLE } = require('./prompts');

const TYPES = {
  hobbies: { title: 'كتاب تلوين', short: 'هواياته' },
  habits: { title: 'كتاب العادات الحلوة', short: 'العادات الحلوة' },
  letters: { title: null, short: 'الحروف والأرقام' },
};
const SETS = {
  ar: { title: 'حروفي العربي', short: 'حروف عربي' },
  en: { title: 'My ABC', short: 'حروف إنجليزي' },
  num_ar: { title: 'أرقامي', short: 'أرقام عربي' },
  num_en: { title: 'My Numbers', short: 'أرقام إنجليزي' },
};

// العادة: [المشهد بالإنجليزي, جملة الولد, جملة البنت]
const HABITS = {
  'غسيل السنان': ['brushing teeth at the bathroom sink with a toothbrush, foam bubbles, smiling at the mirror', 'بيغسل سنانه الصبح وبالليل', 'بتغسل سنانها الصبح وبالليل'],
  'النوم بدري': ['sleeping peacefully in a cozy bed hugging a teddy bear, the moon and stars at the window', 'بينام بدري عشان يصحى نشيط', 'بتنام بدري عشان تصحى نشيطة'],
  'ترتيب اللعب': ['happily putting toys back into a big toy box in a tidy bedroom', 'بيرتّب لعبه بعد ما يخلّص', 'بترتّب لعبها بعد ما تخلّص'],
  'قفل الموبايل': ['putting a tablet away on a shelf and running outside to play with a ball in the garden', 'بيقفل الموبايل ويروح يلعب', 'بتقفل الموبايل وتروح تلعب'],
  'الأكل الصحي': ['eating a healthy plate of vegetables and fruits at the dining table, happy and strong', 'بياكل خضار وفاكهة عشان يكبر قوي', 'بتاكل خضار وفاكهة عشان تكبر قوية'],
  'غسيل الإيدين': ['washing hands with soap and lots of bubbles at a sink', 'بيغسل إيده قبل الأكل', 'بتغسل إيديها قبل الأكل'],
  'شرب الماية': ['drinking a big glass of water, a water bottle on the table', 'بيشرب ماية كتير', 'بتشرب ماية كتير'],
  'مساعدة ماما': ['helping mom set the dinner table, carrying plates with a big smile', 'بيساعد ماما في البيت', 'بتساعد ماما في البيت'],
  'المذاكرة': ['doing homework at a desk with books and pencils, focused and happy', 'بيذاكر ويعمل واجبه', 'بتذاكر وتعمل واجبها'],
  'القراءة': ['reading a big storybook on a cozy couch with cushions', 'بيقرا قصة كل يوم', 'بتقرا قصة كل يوم'],
  'المشاركة': ['sharing toys and snacks with a friend, both smiling', 'بيشارك لعبه مع صحابه', 'بتشارك لعبها مع صحابها'],
  'يلبس لوحده': ['getting dressed alone, putting on shoes and tying the laces proudly', 'بيلبس هدومه لوحده', 'بتلبس هدومها لوحدها'],
  'الاستحمام': ['taking a bubble bath with a rubber duck and lots of foam', 'بياخد شاور وريحته حلوة', 'بتاخد شاور وريحتها حلوة'],
  'الرياضة': ['jumping rope and exercising in a sunny garden', 'بيلعب رياضة كل يوم', 'بتلعب رياضة كل يوم'],
  'الأدب': ['politely giving a flower to grandma, both smiling warmly', 'بيقول لو سمحت وشكراً', 'بتقول لو سمحت وشكراً'],
};
// لو الأم اختارت أقل من 10، بنكمّل بالترتيب ده
const HABITS_ORDER = ['غسيل السنان', 'النوم بدري', 'قفل الموبايل', 'ترتيب اللعب', 'الأكل الصحي', 'غسيل الإيدين', 'مساعدة ماما', 'المذاكرة', 'القراءة', 'الأدب', 'المشاركة', 'شرب الماية', 'الرياضة', 'يلبس لوحده', 'الاستحمام'];

// [الحرف, الكلمة, الحاجة بالإنجليزي]
const AR = [
  ['أ', 'أرنب', 'a cute rabbit'], ['ب', 'بطة', 'a little duck'], ['ت', 'تفاحة', 'a big apple'], ['ث', 'ثعلب', 'a friendly fox'],
  ['ج', 'جمل', 'a friendly camel'], ['ح', 'حصان', 'a horse'], ['خ', 'خروف', 'a fluffy sheep'], ['د', 'دب', 'a teddy bear'],
  ['ذ', 'ذرة', 'a big corn cob'], ['ر', 'رمانة', 'a pomegranate'], ['ز', 'زرافة', 'a baby giraffe'], ['س', 'سمكة', 'a happy fish in a fish bowl'],
  ['ش', 'شمس', 'a big smiling sun'], ['ص', 'صاروخ', 'a toy rocket'], ['ض', 'ضفدع', 'a friendly frog'], ['ط', 'طيارة', 'a toy airplane'],
  ['ظ', 'ظرف', 'a big envelope (letter mail)'], ['ع', 'عصفور', 'a little bird'], ['غ', 'غزالة', 'a baby gazelle'], ['ف', 'فيل', 'a baby elephant'],
  ['ق', 'قطة', 'a kitten'], ['ك', 'كورة', 'a soccer ball'], ['ل', 'ليمونة', 'a lemon'], ['م', 'موزة', 'a banana'],
  ['ن', 'نحلة', 'a cute bee'], ['هـ', 'هدية', 'a wrapped gift box with a bow'], ['و', 'وردة', 'a big flower'], ['ي', 'يمامة', 'a dove'],
];
const EN = [
  ['A', 'Apple', 'a big apple'], ['B', 'Ball', 'a ball'], ['C', 'Cat', 'a kitten'], ['D', 'Dog', 'a puppy'], ['E', 'Elephant', 'a baby elephant'],
  ['F', 'Fish', 'a fish in a fish bowl'], ['G', 'Giraffe', 'a baby giraffe'], ['H', 'Horse', 'a horse'], ['I', 'Ice cream', 'an ice cream cone'],
  ['J', 'Jellyfish', 'a smiling jellyfish'], ['K', 'Kite', 'a kite'], ['L', 'Lion', 'a friendly lion'], ['M', 'Monkey', 'a playful monkey'],
  ['N', 'Nest', 'a bird nest with eggs in a tree'], ['O', 'Owl', 'an owl'], ['P', 'Penguin', 'a penguin'], ['Q', 'Queen', 'a queen crown'],
  ['R', 'Rabbit', 'a rabbit'], ['S', 'Sun', 'a big smiling sun'], ['T', 'Train', 'a toy train'], ['U', 'Umbrella', 'an umbrella in the rain'],
  ['V', 'Violin', 'a violin'], ['W', 'Whale', 'a friendly whale'], ['X', 'Xylophone', 'a xylophone'], ['Y', 'Yo-yo', 'a yo-yo'], ['Z', 'Zebra', 'a zebra'],
];
// [الرقم عربي, الرقم إنجليزي, الكلام عربي, الكلام إنجليزي, المشهد]
const NUM = [
  ['١', '1', 'واحد', 'One', 'holding exactly one big balloon'],
  ['٢', '2', 'اثنان', 'Two', 'playing with exactly two kittens'],
  ['٣', '3', 'ثلاثة', 'Three', 'feeding exactly three ducks by a pond'],
  ['٤', '4', 'أربعة', 'Four', 'playing with exactly four toy cars lined up on the floor'],
  ['٥', '5', 'خمسة', 'Five', 'pointing at exactly five big stars in the sky'],
  ['٦', '6', 'ستة', 'Six', 'looking at exactly six fish swimming in a pond'],
  ['٧', '7', 'سبعة', 'Seven', 'surrounded by exactly seven butterflies in a garden'],
  ['٨', '8', 'ثمانية', 'Eight', 'next to exactly eight apples lined up in two rows of four on a picnic blanket'],
  ['٩', '9', 'تسعة', 'Nine', 'watering exactly nine flowers planted in a neat garden bed of three rows with three flowers in each row (3 + 3 + 3 = 9)'],
  ['١٠', '10', 'عشرة', 'Ten', 'waving at exactly ten little birds sitting on a wooden fence that has two long rails: five birds on the top rail and five birds on the bottom rail (5 + 5 = 10), each bird clearly separated'],
];

const NO_TEXT = 'Absolutely no text, letters or numbers anywhere in the picture.';

function who(order) {
  const g = order.childGender === 'girl' ? 'girl' : order.childGender === 'boy' ? 'boy' : 'child';
  const age = order.childAge ? ` around ${order.childAge} years old` : '';
  return `A cute cartoon ${g}${age} who looks like the child in the reference photo (same hairstyle, face and features),`;
}

function habitList(order) {
  const picked = (order.habits || []).filter((h) => HABITS[h]);
  const rest = HABITS_ORDER.filter((h) => !picked.includes(h));
  return [...picked, ...rest].slice(0, 10);
}

// كل صفحة: { prompt, caption } — caption بيتكتب في الـ PDF
function bookPages(order) {
  const w = who(order);
  const girl = order.childGender === 'girl';
  const name = order.childName || '';
  if (order.bookType === 'habits') {
    return habitList(order).map((h) => {
      const [scene, m, f] = HABITS[h];
      return { prompt: `${STYLE}. ${w} ${scene}. Leave a little empty white space at the bottom. ${NO_TEXT}`, caption: { line: `${name} ${girl ? f : m}` } };
    });
  }
  if (order.bookType === 'letters') {
    const set = order.lettersSet;
    if (set === 'num' || set === 'num_ar' || set === 'num_en') {
      const en = set === 'num_en';
      return NUM.map(([ar, d, wAr, wEn, scene]) => {
        const n = Number(d);
        return {
          prompt: `${STYLE}. ${w} happily ${scene}. ${n > 1 ? `There must be exactly ${n} of them, all the same size, clearly separated and easy to count.` : ''} Leave the top part of the picture as simple empty sky or wall. ${NO_TEXT}`,
          caption: { big: en ? d : ar, word: en ? wEn : wAr, latin: en },
        };
      });
    }
    const list = set === 'en' ? EN : AR;
    return list.map(([l, word, thing]) => ({
      prompt: `${STYLE}. ${w} happily playing with ${thing}, the ${thing.replace(/^an? /, '').replace(/^(cute|big|little|friendly|baby|happy|smiling|toy|playful|fluffy) /, '')} is big and clearly visible in the scene. ${NO_TEXT}`,
      caption: { big: l, word, latin: set === 'en' },
    }));
  }
  return null; // هوايات: البرومبتات القديمة
}

const pageCount = (order) => {
  if (order.bookType === 'habits') return 10;
  if (order.bookType === 'letters') return String(order.lettersSet).startsWith('num') ? NUM.length : order.lettersSet === 'en' ? EN.length : AR.length;
  return 10;
};

// الطلبات القديمة اللي اتعملت قبل ما نفصل الأرقام: num = أرقام عربي
const setKey = (order) => (order.lettersSet === 'num' ? 'num_ar' : order.lettersSet || 'ar');

function bookTitle(order) {
  if (order.bookType === 'letters') return (SETS[setKey(order)] || SETS.ar).title;
  return (TYPES[order.bookType] || TYPES.hobbies).title;
}
function bookLabel(order) {
  if (order.bookType === 'letters') return (SETS[setKey(order)] || SETS.ar).short;
  return (TYPES[order.bookType] || TYPES.hobbies).short;
}

module.exports = { setKey, NUM, AR, EN, TYPES, SETS, HABITS, HABITS_ORDER, bookPages, pageCount, bookTitle, bookLabel };
