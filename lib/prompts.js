// بيبني 10 برومبتات لصفحات التلوين من بيانات الطلب
// كل هواية ليها مشاهد مخصوصة، والحيوان المفضل بيظهر في الصفحات

const STYLE =
  'black and white coloring book page for kids, cute cartoon style, thick clean outlines, ' +
  'no shading, no grayscale, no color, no solid black fills, white background, simple shapes, ' +
  'large areas to color, no text, no letters, no words, no numbers';

// %s = الطفل (مثلاً: a cute cartoon boy ... ) — كل مشهد جملة إنجليزي كاملة
const INTERESTS = {
  'كورة القدم': ['%s kicking a soccer ball toward a goal in a sunny park', '%s playing soccer at the beach next to sandcastles', '%s holding a big trophy after winning a soccer match, confetti falling', '%s doing tricks with a soccer ball in the backyard'],
  'الديناصورات': ['%s playing with friendly dinosaurs around, a volcano in the background', '%s playing with dinosaur toys in a cozy room full of toys', '%s exploring an enchanted forest with a friendly baby dinosaur', '%s digging up dinosaur fossils as a little paleontologist'],
  'الفضاء': ['%s exploring outer space as an astronaut among stars and planets, helmet visor open so the face shows', '%s flying a rocket ship past the moon', '%s looking through a telescope on a rooftop at the moon and stars', '%s waving from the surface of the moon next to a little friendly alien'],
  'الرسم': ['%s painting flowers on an easel with a palette and brushes', '%s painting a big mural of butterflies and flowers on a wall', '%s drawing in a sketchbook outdoors under a tree', '%s at a desk by a window drawing with crayons and pencils'],
  'العربيات': ['%s driving a toy race car on a race track', '%s washing a car with bubbles and a sponge', '%s driving a little red tractor on a farm', '%s waving from the window of a big city bus'],
  'القطط': ['%s playing on a rug with a kitten chasing a ball of yarn', '%s reading a book in an armchair with a sleepy cat on the lap', '%s having a tea party in the garden with a kitten and a teddy bear', '%s drawing at a desk while a cat plays in a basket'],
  'الكلاب': ['%s playing fetch with a happy puppy in the park', '%s giving a puppy a bubble bath', '%s walking a puppy on a leash along a path with trees', '%s cuddling a sleepy puppy in a cozy bed'],
  'اليونيكورن': ['%s riding a magical unicorn over fluffy clouds and a rainbow', '%s dancing in a flower meadow with a baby unicorn and butterflies', '%s riding in a pumpkin carriage pulled by a unicorn', '%s braiding the mane of a unicorn with ribbons'],
  'الأميرات': ['%s as a princess with a crown and long gown in front of a fairytale castle', '%s as a princess blowing out candles on a big birthday cake, balloons around', '%s as a princess having a royal tea party with animal friends', '%s as a princess waving from a castle tower'],
  'الأبطال الخارقين': ['%s flying as a superhero with a cape over the city', '%s as a superhero rescuing a kitten from a tree', '%s as a superhero standing proudly on a rooftop, cape flowing', '%s as a superhero lifting a big car with one hand'],
  'السباحة': ['%s swimming in a pool with goggles, splashing water', '%s diving off a diving board into a pool', '%s snorkeling underwater next to a friendly sea turtle and coral reef', '%s on a winners podium with a medal next to a swimming pool'],
  'العجلة': ['%s riding a bicycle on an adventure road lined with trees', '%s riding a bicycle under a rainbow with balloons', '%s riding a bicycle through a park with ducks by a pond', '%s fixing a bicycle with a little toolbox'],
  'المزيكا': ['%s playing a big drum set with music notes flying around', '%s playing guitar on a little stage with stars around', '%s playing piano in a cozy room with music notes floating', '%s leading a marching band beating a drum'],
  'الرقص': ['%s dancing happily in a flower meadow with butterflies', '%s dancing on a stage under a spotlight', '%s dancing in the rain with an umbrella, splashing puddles', '%s dancing at a party with balloons and streamers'],
  'القراءة': ['%s sitting under a tree reading a big storybook', '%s reading with a flashlight inside a cozy blanket fort', '%s flying through the sky on a giant open book like a magic carpet', '%s choosing a book from tall shelves in a cozy library'],
  'الطبخ': ['%s wearing an apron and chef hat decorating cupcakes', '%s flipping pancakes in a pan, a stack of pancakes on the table', '%s making a big fruit salad at the kitchen table', '%s baking cookies and taking them out of the oven with oven mitts'],
  'البحر': ['%s building a big sandcastle at the beach with a bucket and spade', '%s collecting seashells and starfish in a bucket on the beach', '%s rowing a little boat on the sea while fish jump around', '%s splashing in small waves with a beach ball'],
  'الغابة والحيوانات': ['%s exploring the jungle with a friendly lion, an elephant and a monkey', '%s feeding a giraffe at a safari park', '%s camping next to a tent and a campfire under the stars', '%s swinging on a jungle vine with a happy monkey'],
  'الروبوتات': ['%s building a friendly robot in a little workshop with tools around', '%s riding on the back of a giant friendly robot through a city', '%s proudly holding a trophy at a science fair next to a robot invention', '%s flying a drone with a remote control in a sunny garden'],
  'العلوم': ['%s in a lab coat doing a fun science experiment with bubbling flasks', '%s looking at a butterfly through a magnifying glass in a meadow', '%s launching a homemade toy rocket in a park', '%s exploring an ancient Egyptian pyramid with a flashlight'],
  'الشطرنج': ['%s playing chess at a table, a big chess board in front', '%s next to giant chess pieces in a park', '%s winning a chess game and holding a little trophy', '%s as a knight in a chess kingdom next to a friendly castle'],
  'الجمباز': ['%s wearing a long-sleeve sporty top and leggings doing a cartwheel in a sunny park', '%s wearing a long-sleeve sporty top and leggings balancing on a balance beam', '%s wearing a long-sleeve sporty top and leggings twirling a long ribbon with stars around', '%s on a gymnastics podium with a gold medal, arms raised'],
  'ركوب الخيل': ['%s riding a horse jumping over a fence, wearing a riding helmet', '%s galloping on a horse through a field of flowers toward the mountains', '%s brushing and feeding an apple to a pony in a stable', '%s sitting under a tree reading while a horse grazes nearby'],
  'الباليه': ['%s dancing ballet on a stage in a tutu, doing a twirl', '%s in a tutu practicing ballet at a barre in a dance studio', '%s dancing ballet in a garden with butterflies', '%s taking a bow on stage as flowers are thrown'],
  'عروسة البحر': ['%s as a little mermaid with a fish tail and a modest shell top swimming with happy fish', '%s as a little mermaid sitting on a rock holding a big seashell, a crab beside', '%s as a little mermaid exploring a sunken ship with a seahorse', '%s as a little mermaid riding a dolphin through the waves'],
  'الزراعة': ['%s watering flowers and vegetables with a watering can', '%s planting seeds next to giant sunflowers', '%s picking strawberries into a basket in a field', '%s holding a basket of vegetables in a garden full of carrots and lettuce'],
  'القراصنة': ['%s as a pirate captain steering the wheel of a pirate ship on the sea', '%s as a pirate digging up a treasure chest full of coins on an island', '%s as a pirate looking through a spyglass from the crow\'s nest of a ship', '%s reading a treasure map on a tropical island'],
  'كورة السلة': ['%s jumping to dunk a basketball into a hoop on an outdoor court', '%s playing basketball with friends in a school gym', '%s on a winners podium with a medal holding a basketball', '%s spinning a basketball on one finger in the park'],
  'الثلج والشتا': ['%s building a snowman with a scarf and carrot nose', '%s sliding down a snowy hill on a sled', '%s making snow angels in the snow', '%s drinking hot chocolate by a window watching snowflakes'],
};

// مشاهد احتياطية لأي هواية العميل كتبها بنفسه (أو لو الصفحات محتاجة تكملة)
const GENERIC = [
  '%s enjoying %h in a sunny park',
  '%s enjoying %h with friends',
  '%s dreaming about %h in a cozy bedroom, a dream bubble above',
  '%s winning a prize for %h, confetti falling',
  '%s enjoying %h in a magical fairytale world',
  '%s enjoying %h on a big adventure in an enchanted forest',
];
const FINALE = [
  '%s at a birthday party with a big cake, balloons and gifts',
  '%s flying as a superhero with a cape over the city',
  '%s having a picnic on a blanket in a meadow',
  '%s under a rainbow with balloons',
];

// اسم الهواية بالإنجليزي (للمشاهد الاحتياطية)
const EN = {
  'كورة القدم': 'playing soccer', 'الديناصورات': 'dinosaurs', 'الفضاء': 'space and rockets', 'الرسم': 'painting and drawing',
  'العربيات': 'cars', 'القطط': 'cats', 'الكلاب': 'puppies', 'اليونيكورن': 'unicorns', 'الأميرات': 'being a princess',
  'الأبطال الخارقين': 'being a superhero', 'السباحة': 'swimming', 'العجلة': 'riding a bicycle', 'المزيكا': 'playing music',
  'الرقص': 'dancing', 'القراءة': 'reading books', 'الطبخ': 'cooking and baking', 'البحر': 'the sea and the beach',
  'الغابة والحيوانات': 'jungle animals', 'الروبوتات': 'building robots', 'العلوم': 'science experiments', 'الشطرنج': 'playing chess',
  'الجمباز': 'gymnastics', 'ركوب الخيل': 'horse riding', 'الباليه': 'ballet', 'عروسة البحر': 'mermaids', 'الزراعة': 'gardening',
  'القراصنة': 'pirates', 'كورة السلة': 'playing basketball', 'الثلج والشتا': 'snow and winter fun',
};

const ANIMALS = {
  'قطة': 'a cute kitten', 'كلب': 'a happy puppy', 'أرنب': 'a fluffy bunny', 'حصان': 'a friendly horse',
  'ببغاء': 'a colorful parrot', 'بطريق': 'a cute penguin', 'دولفين': 'a smiling dolphin', 'أسد': 'a friendly lion',
  'سلحفاة': 'a little turtle', 'بطة': 'a little duck', 'فيل': 'a baby elephant', 'سمكة': 'a happy fish',
  'فراشة': 'a big butterfly', 'باندا': 'a cute panda', 'زرافة': 'a baby giraffe', 'قرد': 'a playful monkey',
  'ديناصور': 'a baby dinosaur', 'يونيكورن': 'a baby unicorn',
};

function childPhrase(order) {
  const g = order.childGender === 'girl' ? 'girl' : order.childGender === 'boy' ? 'boy' : 'child';
  const age = order.childAge ? ` around ${order.childAge} years old` : '';
  return `a cute cartoon ${g}${age} who looks like the child in the reference photo (same hairstyle, face and features),`;
}

function animalPhrase(order) {
  const a = String(order.favoriteAnimal || '').trim();
  if (!a) return '';
  return ANIMALS[a] || `a cute "${a}" (an animal written in Arabic, understand it and draw it)`;
}

function buildPrompts(order, count = 10) {
  const who = childPhrase(order);
  const pet = animalPhrase(order);
  const interests = (order.interests || []).length ? order.interests : ['اللعب'];

  // قوايم مشاهد لكل هواية
  const keys = interests.map((n) => String(n).trim());
  const hobby = (k) => EN[k] || `the favorite hobby "${k}" (written in Arabic, understand it and draw it)`;
  const lists = keys.map((k) => (INTERESTS[k] ? [...INTERESTS[k]] : GENERIC.map((s) => s.replace('%h', hobby(k)))));
  const extras = keys.map((k) => (INTERESTS[k] ? GENERIC.map((s) => s.replace('%h', hobby(k))) : []));

  // نوزّع بالدور على الهوايات: المشاهد المخصوصة الأول، بعدين مشاهد عامة بنفس الهواية، وأخيراً مشاهد ختام
  const scenes = [];
  const roundRobin = (ls) => {
    for (let i = 0; scenes.length < count && i < 10; i++)
      for (const l of ls) if (l[i] && scenes.length < count) scenes.push(l[i]);
  };
  roundRobin(lists);
  // لو هواية واحدة بس: نخلط شوية مشاهد ختام عشان ميبقاش كله شبه بعض
  if (keys.length === 1) scenes.push(...FINALE.slice(0, 2).filter(() => scenes.length < count));
  roundRobin(extras);
  for (const f of FINALE) if (scenes.length < count && !scenes.includes(f)) scenes.push(f);

  // الحيوان المفضل: صفحة مخصوصة له + يظهر كرفيق في نص الصفحات تقريباً
  if (pet) {
    scenes[count - 2] = `%s hugging and playing with ${pet}, a big happy friendship scene`;
    for (let i = 1; i < count - 2; i += 2) scenes[i] += `, with ${pet} as a companion nearby`;
  }

  return scenes.slice(0, count).map((s) => `${STYLE}. ${s.replace('%s', who.charAt(0).toUpperCase() + who.slice(1))}.`);
}

module.exports = { buildPrompts, STYLE, INTERESTS, ANIMALS };
