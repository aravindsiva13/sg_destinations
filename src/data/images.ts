/**
 * Centralized image URLs (Unsplash). Swap these in one place.
 * All use the `?auto=format&fit=crop` params for responsive, lightweight delivery.
 */
const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const images = {
  // Hero / garden
  gardenPool: u('1505691938895-1758d7feb511'),
  waterfall: u('1432405972618-c60b0225b8f9'),
  portrait: u('1544005313-94ddf0286df2'),
  lushGarden: u('1416879595882-3373a0480b5b'),
  gardenPath: u('1466692476868-aef1dfb1e735'),
  verticalGarden: u('1490750967868-88aa4486c946'),

  // Cabins / stays
  woodHouse: u('1518780664697-55e3ad937233'),
  towerSuite: u('1582719478250-c89cae4dc85b'),
  kudilCottage: u('1520250497591-112f2f40a3f4'),
  cabinInterior: u('1611892440504-42a792e24d32'),
  bedroom: u('1505693416388-ac5ce068fe85'),
  bathroom: u('1620626011761-996317b8d101'),
  veranda: u('1600585154340-be6161a56a0c'),

  // Amenities
  swimmingPool: u('1571896349842-33c89424de2d'),
  poolNight: u('1540541338287-41700207dee6'),
  waterFall: u('1467890947394-8171244e5410'),
  fountain: u('1518972559570-7cc1309f3229'),
  campfire: u('1475483768296-6163e08872a1'),
  campfireDj: u('1533174072545-7a4b6ad7a6c3'),
  theatre: u('1517604931442-7e0c8ed2963c'),
  coconutFarm: u('1574482620811-1aa16ffe3c82'),
  shuttleCourt: u('1626224583764-f87db24ac4ea'),
  sprinklers: u('1563514227147-6d2ff665a6a0'),
  garden: u('1558616629-899031969d5e'),

  // Dining
  diningPlate: u('1504674900247-0877df9cc836'),
  diningBurger: u('1568901346375-23c9450c58cd'),
  diningSpread: u('1555939594-58d7cb561ad1'),
  diningTable: u('1414235077428-338989a2e8c0'),
  chef: u('1577219491135-ce391730fb2c'),
  southIndian: u('1630383249896-424e482df921'),

  // Events
  wedding: u('1519225421980-715cb0215aed'),
  birthday: u('1530103862676-de8c9debad1d'),
  corporate: u('1511795409834-ef04bbd61622'),
  getTogether: u('1529543544282-cc3ac8b5c4a0'),
  eventTable: u('1464366400600-7168b8af9bc3'),
  celebration: u('1492684223066-81342ee5ff30'),
} as const;

export type ImageKey = keyof typeof images;
