/**
 * Centralized image URLs. 
 * Mix of real local assets and Unsplash fallbacks.
 */
const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const images = {
  // Hero / garden (Replaced with real images)
  gardenPool: '/images/selected-images/new/elevated_stay.jpeg', // Elevated stay structure
  waterfall: '/images/selected-images/Resort/7L3A1963.JPG', // Girl on swing
  portrait: '/images/selected-images/new/pool_angle.jpeg', // Pool angle
  lushGarden: '/images/selected-images/Events/7L3A1899.JPG', // Event decor
  gardenPath: '/images/selected-images/new/pool_wide_2.jpeg', // Pool wide 2
  verticalGarden: u('1490750967868-88aa4486c946'), // Keep mock

  // Cabins / stays
  woodHouse: u('1518780664697-55e3ad937233'),
  towerSuite: '/images/selected-images/new/elevated_stay.jpeg', // Elevated stay structure!
  kudilCottage: u('1520250497591-112f2f40a3f4'),
  cabinInterior: u('1611892440504-42a792e24d32'),
  bedroom: u('1505693416388-ac5ce068fe85'),
  bathroom: u('1620626011761-996317b8d101'),
  veranda: u('1600585154340-be6161a56a0c'),

  // Amenities
  swimmingPool: '/images/selected-images/new/pool_wide.jpeg', // Updated to new pool wide shot
  poolNight: '/images/selected-images/new/pool_angle.jpeg', // Updated to new pool angle
  waterFall: '/images/selected-images/new/water_shower.jpeg', // Shower waterfall feature
  fountain: '/images/selected-images/new/shra_vanam.jpeg', // Small Shra Vanam pool
  campfire: u('1475483768296-6163e08872a1'), // Keep mock
  campfireDj: u('1533174072545-7a4b6ad7a6c3'), // Keep mock
  theatre: '/images/selected-images/new/shraddha_cinemas.jpeg', // Exterior of Shraddha Cinemas
  coconutFarm: u('1574482620811-1aa16ffe3c82'), // Keep mock
  shuttleCourt: u('1626224583764-f87db24ac4ea'), // Keep mock
  sprinklers: '/images/selected-images/new/water_shower_square.jpeg', // The other shower feature
  garden: u('1558616629-899031969d5e'), // Keep mock

  // Dining (Keep mocks for now - we still need food plates!)
  diningPlate: u('1504674900247-0877df9cc836'),
  diningBurger: u('1568901346375-23c9450c58cd'),
  diningSpread: u('1555939594-58d7cb561ad1'),
  diningTable: u('1414235077428-338989a2e8c0'),
  chef: u('1577219491135-ce391730fb2c'),
  southIndian: u('1630383249896-424e482df921'),

  // Events
  wedding: '/images/selected-images/Events/7L3A1899.JPG', // Event decor
  birthday: '/images/selected-images/Events/7L3A2124.JPG', // Birthday cake
  corporate: '/images/selected-images/new/event_seating_night.jpeg', // Night event seating
  getTogether: '/images/selected-images/Family/7L3A2099.JPG', // Big family group
  eventTable: '/images/selected-images/Events/7L3A1933.JPG', // Ribbon cutting/stage
  celebration: '/images/selected-images/new/event_seating_night.jpeg', // Night event seating
} as const;

export type ImageKey = keyof typeof images;
