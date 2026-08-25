import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Raw menu text supplied by the client (Breakfast.pdf), in reading order.
 * Lines with a trailing price are dishes; lines without are category headers.
 * Prices were extracted from the PDF and should be spot-checked in the admin
 * portal — a few entries in the source had OCR/typo quirks.
 */
const RAW = `
Breakfast & Dinner
VEG
Idly 2 -50.00
Sambar Idly -80.00
Vda -30.00
Sambar Vada -48.00
Curd Vada -48.00
Kichadi -96.00
Ghee Pongal -96.00
Poori -96.00
Choola poori -128.00
Idiyappam -80.00
Dosai varieties
Plain Dosa -96.00
Diet Dosa (Ragi/Wheat) -96.00
Kal Dosa -112.00
Podi Dosa -128.00
Ghee Podi Dosa -160.00
Ghee Dosa -144.00
Masal Dosa -128.00
Ghee Masala Dosa -160.00
Onion Dosa -128.00
Rava Dosa -112.00
Cashew net Rava Dosa -160.00
Ghee Rava Dosa -160.00
Onion Rava Dosa -144.00
Mushroom Masala Dosa -144.00
Paneer Masala Dosa -160.00
Gobi Masala Dosa -160.00
Paper Rost -182.00
Uttappam -96.00
Onion Uttapam -144.00
Carrot Uttapam -144.00
Tomato Uttapam -144.00
Podi Uttapam -144.00
Ghee Podi Uttapam -160.00
5 Taste Uttapam -144.00
7 Taste Uttapam -192.00
Lunch Veg
Meals -220.00
Curd Rice -160.00
Lemon Rice -160.00
Tomato Rice -160.00
Veg Biryani -160.00
Mushroom 65 -200.00
Paneer 65 -200.00
Gobi 65 -200.00
Chilli (paneer/mushroom/Gobi/Baby Corn) -200.00
Manchurian (Gobi/ Mushroom/Paneer/Baby Corn) -200.00
Dragon (Gobi/ Mushroom/Paneer/Baby Corn) -200.00
Pepper (Gobi/ Mushroom/Paneer/Baby Corn) -200.00
Fried Rice
Veg Fried Rice -192.00
Paneer Fried Rice -192.00
Mushroom Fried Rice -192.00
Corn Fried Rice -192.00
Schezwan Veg Fried Rice -200.00
Schezwan Paneer Veg Fried Rice -200.00
Schezwan Mushroom Veg Fried Rice -200.00
Schezwan Panner Veg Fried Rice -200.00
Schezwan Corn Veg Fried Rice -200.00
Noodles
Veg Noodles -192.00
Paneer Noodles -192.00
Mushroom Noodles -192.00
Corn Noodles -192.00
Schezwan Veg Noodles -200.00
Schezwan Paneer Veg Noodles -200.00
Schezwan Mushroom Veg Noodles -200.00
Schezwan Panner Veg Noodles -200.00
Schezwan Corn Veg Noodles -200.00
Veg Pulav -192.00
Kashmiri Pulav -240.00
Indian Breds
Tandoori Chapati 2pc 72.00
Phulka (2pc) -72.00
Paratha -96.00
Beverage
Water Bottle - 50/L
Cool Drinks 50/500ml
Tea -50.00
Coffee -50.00
Boost 50.00
Horlicks -50.00
Lunch & Dinner
(Non-Veg)
Meals -288.00
Soup
Nattu Kozhi Soup -192.00
Goat Leg Soup -192.00
Biryani Varieties
Flying Biriyani -330.00
Egg Biryani -330.00
chicken Biryani -400.00
mutton Biryani -500.00
Mutton Varieties
Mutton chukka -400.00
mutton varuval gravy -400.00
Mutton Egg Curry -450.00
Mutton chest curry gravy -400.00
Mutton liver -400.00
Mutton Suvarotti -300.00
Mutton Brain Rost -300.00
Mutton Head Curry Gravy -300.00
Mutton Kudal Gravy -300.00
Mutton Nalli Chops 2pc -400.00
Mutton Leg paya -240.00
Mutton Kola (1pc) -75.00
Mutton Chukka Rost -400.00
Mutton Chest Curry Rost -400.00
Mutton Liver Rost -400.00
Chicken Varieties
Chicken Egg Curry -350.00
Nattu Kozhi Chops -350.00
Nattu Kozhi Rost -350.00
Chittinad Chicken Curry -300.00
Chicken 65 BL Full -300.00
Chicken 65 BL Half -450.00
Chilli chicken BL Full -350.00
Chicken lollipop (4 pc) -350.00
Sea Food varieties
Ney is Roast -400.00
Ney Fish (BL) -400.00
Ney Fish Gravy -350.00
Vaval Fish Roast -450.00
Vila / Paarai Rost -350.00
Crab Masala -450.00
Crab (BL) -500.00
Prawn Gravy -400.00
Prawn pepper Gravy -400.00
Ney Fish Chilli -400.00
SPL Vaval Rost -500.00
Prawn 65 (or) Prawn Chilli -400.00
Pond Fish varieties
Viral Fish Gravy -300.00
Viral Fish Roast -300.00
Ayirai Fish Gravy -400.00
Keluthi Fish Gravy -400.00
Fish Head -240.00
Special Varieties
Dove Chops -400.00
Kadai Chops -280.00
kadai 65 -280.00
Rabbit Chukka -400.00
Turkey Chukka -400.00
Parotta Varieties
Parotta -75.00
Veechu Parotta -225.00
Egg Parotta -225.00
Chicken Egg Parotta -400.00
Mutton Egg Parotta -500.00
Prawn Egg Parotta -500.00
Crab Egg Parotta -500.00
Egg Labaa (Veechu) -240.00
Chicken Labaa (Veechu) -400.00
Mutton Labaa (Veechu) -500.00
Crab Labaa (Veechu) -600.00
Mutton Parotta -450.00
Chicken parotta -400.00
Gravy Parotta -400.00
Prawn Labaa (Veechu) -540.00
Egg Varieties
Omelette -50.00
Half Boil -40.00
Egg Fry -50.00
Boiled Egg -30.00
Mutton Omelette -450.00
Chicken Omelette -350.00
Crab Omelette -550.00
Prawn Omelette -450.00
Fish Omelette -400.00
Ayirai Omelette -450.00
Easy To Eat
Idli (1) -30.00
Idiyappam (1) -30.00
Egg Idiyappam -190.00
Egg Mutton Idiyappam -500.00
Egg Chicken Idiyappam -400.00
Egg Crab Idiyappam -500.00
Egg Prawn Idiyappam -450.00
Special Dosai Varieties
Home Dosai -96.00
Dosai -112.00
Kal Dosai -112.00
SPL Dosai -128.00
Oil Dosai -128.00
Uttappam -112.00
Onion Uttappam -128.00
Spl Onion Uttappam -144.00
Onion Egg Uttappam -160.00
Egg Dosai -160.00
Egg Uttappam -160.00
Mutton Kari Dosai -500.00
Chicken Kari Dosai -400.00
Crab Kari Dosai -600.00
Prawn Kari Dosai -500.00
Fish Kari Dosai -450.00
Ayirai Fish Dosai -450.00
Beverage Hot & Cold
Water Bottle - 50/1L
Soda 50/500ml
Coffee -50.00
Tea -50.00
Boost -50.00
Horlicks -50.00
Kilograms Varieties
Sea Foods
Ayirai Mean Kolambu 1Kg -2800.00
Viral Mean Kolambu 1Kg -2000.00
Nei Mean Kolambu 1Kg -2500.00
Fish Fry Vanjaram 1Kg -2000.00
Fish Fry Viral 1Kg -2000.00
Fish Fry Nei Mean 1Kg -2000.00
Nandu Gravy 1Kg -2300.00
Prawn Gravy 1Kg -2300.00
Prawn 65 1Kg -2300.00
Chicken
Chicken Kolambu 1Kg -1400.00
Chicken Gravy 1Kg -1400.00
Chicken 65 1Kg -1400.00
Chicken Chukka 1Kg -1400.00
Nattu Kozhi Kolambu 1Kg -2400.00
Mutton
Mutton Kolambu 1Kg -2300.00
Mutton Gravy 1Kg -2300.00
Mutton Chukka 1Kg -2300.00
Mutton Head 1Kg -2300.00
Mutton Kudal 1Kg -2300.00
Mutton Eral 1Kg -2300.00
Mutton Sevarotti 1Kg -6500.00
Mutton Sillipi 1Kg -2300.00
Mutton Paya 1Kg -2300.00
Mutton Gadi Chops -2300.00
Mutton Nalli Gravy 1Kg 2300.00
Vengai Kari Gravy 1Kg -2300.00
`;

// Headers that are just section super-titles (no dishes of their own).
const RENAME: Record<string, string> = {
  VEG: 'Breakfast & Tiffin',
  '(Non-Veg)': 'Non-Veg Meals',
  'Indian Breds': 'Indian Breads',
};

interface ParsedItem {
  name: string;
  price: number;
  veg: boolean | null;
}
interface ParsedCategory {
  name: string;
  note: string | null;
  items: ParsedItem[];
}

function parse(raw: string): ParsedCategory[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const categories: ParsedCategory[] = [];
  let current: ParsedCategory | null = null;
  let nonVeg = false; // flips once we pass the "(Non-Veg)" section
  let perKg = false; // flips once we pass the "Kilograms" section

  const priceRe = /^(.+?)\s*-?\s*(?:₹|Rs\.?)?\s*(\d+(?:\.\d+)?)(?:\s*\/\s*\w+)?\.?\s*$/;

  for (const line of lines) {
    const m = line.match(priceRe);
    if (m && current) {
      // Dish line.
      const name = m[1].replace(/\s+/g, ' ').trim();
      const price = Math.round(parseFloat(m[2]));
      const veg = /beverage/i.test(current.name) ? null : !nonVeg;
      current.items.push({ name, price, veg });
      continue;
    }
    // Header line.
    if (/non-veg/i.test(line)) nonVeg = true;
    if (/kilogram/i.test(line)) perKg = true;
    let name = RENAME[line] ?? line;
    if (perKg && /^(sea foods|chicken|mutton)$/i.test(line)) name = `${line} (Per Kg)`;
    current = { name, note: perKg ? 'Per Kg' : null, items: [] };
    categories.push(current);
  }

  // Drop empty super-title headers (e.g. "Breakfast & Dinner", "Kilograms Varieties").
  return categories.filter((c) => c.items.length > 0);
}

async function seedMenu() {
  const parsed = parse(RAW);

  // Idempotent: clear existing menu, then re-insert.
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();

  let itemCount = 0;
  for (let ci = 0; ci < parsed.length; ci++) {
    const cat = parsed[ci];
    await prisma.menuCategory.create({
      data: {
        name: cat.name,
        note: cat.note,
        sortOrder: ci,
        items: {
          create: cat.items.map((it, ii) => ({
            name: it.name,
            price: it.price,
            veg: it.veg,
            sortOrder: ii,
          })),
        },
      },
    });
    itemCount += cat.items.length;
  }
  return { categories: parsed.length, items: itemCount };
}

seedMenu()
  .then((r) => console.log(`Seeded ${r.categories} menu categories, ${r.items} dishes.`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
